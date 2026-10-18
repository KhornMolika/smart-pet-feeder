import { Injectable, Logger, forwardRef, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../devices/entities/device.entity.js';
import { DeviceMember } from '../devices/entities/device-member.entity.js';
import { FeederService } from '../feeder/feeder.service.js';

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly botUsername: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceMember)
    private readonly memberRepository: Repository<DeviceMember>,
    @Inject(forwardRef(() => FeederService))
    private readonly feederService: FeederService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME', 'ChinChemBot');
  }

  onModuleInit() {
    if (this.botToken) {
      this.logger.log(`Telegram Bot service initialized for @${this.botUsername}`);
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Running Telegram Bot in mock/simulation mode.');
    }
  }

  /**
   * Raw Telegram Bot API HTTP Caller
   */
  async callTelegramApi(method: string, payload: Record<string, unknown>): Promise<any> {
    if (!this.botToken) {
      this.logger.debug(`[Mock Telegram API] ${method}: ${JSON.stringify(payload)}`);
      return { ok: true, result: { message_id: Math.floor(Math.random() * 10000) } };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        this.logger.error(`Telegram API error on ${method}: ${data.description}`);
      }
      return data;
    } catch (err: any) {
      this.logger.error(`Failed to call Telegram API ${method}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Send text message with optional inline keyboard to chat or group
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    replyMarkup?: { inline_keyboard: TelegramInlineButton[][] },
  ): Promise<boolean> {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await this.callTelegramApi('sendMessage', payload);
    return res.ok === true;
  }

  /**
   * Answer callback query (inline button clicks)
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false): Promise<boolean> {
    const res = await this.callTelegramApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
    return res.ok === true;
  }

  /**
   * Posts an interactive feeding control menu into the linked family group chat
   */
  async sendGroupFeedMenu(chatId: string | number, device: Device): Promise<boolean> {
    const text =
      `🐾 *${device.petName}'s Feeder Control*\n` +
      `📍 Location: *${device.room}*\n` +
      `⚡ Status: *${device.isOnline ? 'Online (Ready)' : 'Offline'}*\n\n` +
      `Tap a button below to dispense food or open the dashboard:`;

    const appUrl = `https://t.me/${this.botUsername}/app?startapp=dev_${device.id}`;

    const inlineKeyboard: TelegramInlineButton[][] = [
      [
        {
          text: '🥣 Quick Snack (700ms)',
          callback_data: `feed:${device.id}:700:Quick Snack`,
        },
        {
          text: '🍲 Meal Bowl (1500ms)',
          callback_data: `feed:${device.id}:1500:Meal Bowl`,
        },
      ],
      [
        {
          text: '📊 Feeder Status',
          callback_data: `status:${device.id}`,
        },
        {
          text: '📱 Open Mini App',
          url: appUrl,
        },
      ],
    ];

    return this.sendMessage(chatId, text, { inline_keyboard: inlineKeyboard });
  }

  /**
   * Broadcast feeding confirmation to the linked Telegram group
   */
  async broadcastFeedEvent(device: Device, details: { source: string; durationMs: number; requestedBy?: string }): Promise<void> {
    if (!device.telegramGroupId) return;

    const sourceLabel =
      details.source === 'button'
        ? 'Physical Machine Button'
        : details.source === 'schedule'
        ? 'Autonomous Schedule (RTC)'
        : details.source === 'telegram_group'
        ? `Telegram Group (${details.requestedBy || 'Member'})`
        : `Mini App (${details.requestedBy || 'Owner'})`;

    const seconds = (details.durationMs / 1000).toFixed(1);
    const text =
      `🍽️ *Meal Dispensed for ${device.petName}!*\n` +
      `⏱️ Portion Duration: *${seconds}s*\n` +
      `👤 Triggered via: *${sourceLabel}*\n` +
      `🌾 Location: *${device.room}*`;

    const appUrl = `https://t.me/${this.botUsername}/app?startapp=dev_${device.id}`;
    const inlineKeyboard: TelegramInlineButton[][] = [
      [
        {
          text: '🥣 Dispense Another Snack',
          callback_data: `feed:${device.id}:700:Quick Snack`,
        },
        {
          text: '📱 Open Mini App',
          url: appUrl,
        },
      ],
    ];

    await this.sendMessage(device.telegramGroupId, text, { inline_keyboard: inlineKeyboard });
  }

  /**
   * Main Webhook Processor for incoming Telegram Bot Updates
   */
  async handleWebhookUpdate(update: any): Promise<void> {
    // 1. Process Messages & Commands
    if (update.message) {
      await this.handleIncomingMessage(update.message);
      return;
    }

    // 2. Process Inline Keyboard Button Taps (Callback Queries)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return;
    }
  }

  private async handleIncomingMessage(message: any) {
    const text: string = (message.text || '').trim();
    const chatId: string = message.chat.id.toString();
    const isGroup = message.chat.type === 'group' || message.chat.type === 'supergroup';

    // Command: /start link_<deviceId>
    if (text.startsWith('/start link_')) {
      const deviceId = text.replace('/start link_', '').trim();
      const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
      if (!device) {
        await this.sendMessage(chatId, `❌ Feeder device *${deviceId}* not found.`);
        return;
      }

      device.telegramGroupId = chatId;
      device.telegramGroupName = message.chat.title || 'Family Group';
      device.groupFeedEnabled = true;
      device.groupGuestFeedAllowed = true;
      await this.deviceRepository.save(device);

      const confirmMsg =
        `🎉 *Smart Pet Feeder Linked Successfully!*\n\n` +
        `This group is now connected to *${device.petName}'s Feeder*.\n` +
        `• Group members and guests can control feeding directly via buttons.\n` +
        `• All feeding events and alerts will be announced here in real-time.\n\n` +
        `Use /feed anytime to open the control menu!`;

      await this.sendMessage(chatId, confirmMsg);
      await this.sendGroupFeedMenu(chatId, device);
      return;
    }

    // Command: /feed or /treat
    if (text.startsWith('/feed') || text.startsWith('/treat')) {
      let device: Device | null = null;
      if (isGroup) {
        device = await this.deviceRepository.findOne({ where: { telegramGroupId: chatId } });
      }
      if (!device) {
        // Fallback to default demo device
        device = await this.deviceRepository.findOne({ where: { id: 'feeder_esp32_01' } });
      }

      if (!device) {
        await this.sendMessage(
          chatId,
          `⚠️ No pet feeder is connected to this chat. Connect a feeder from the Mini App or use /start link_<deviceId>.`,
        );
        return;
      }

      if (!device.groupFeedEnabled && isGroup) {
        await this.sendMessage(
          chatId,
          `🔒 *Group Feeding Disabled*: The feeder owner has turned off group chat buttons for this device.`,
        );
        return;
      }

      await this.sendGroupFeedMenu(chatId, device);
      return;
    }

    // Command: /status
    if (text.startsWith('/status')) {
      let device = await this.deviceRepository.findOne({ where: { telegramGroupId: chatId } });
      if (!device) {
        device = await this.deviceRepository.findOne({ where: { id: 'feeder_esp32_01' } });
      }

      if (device) {
        const statusMsg =
          `🐾 *${device.petName}'s Feeder Status*\n` +
          `• Device: *${device.name}* (\`${device.id}\`)\n` +
          `• Room: *${device.room}*\n` +
          `• Online: *${device.isOnline ? '🟢 Yes' : '🔴 No'}*\n` +
          `• Group Controls: *${device.groupFeedEnabled ? '✅ Active' : '❌ Disabled'}*\n` +
          `• Guest Feeding: *${device.groupGuestFeedAllowed ? '✅ Allowed' : '🔒 Registered Only'}*`;
        await this.sendMessage(chatId, statusMsg);
      }
    }
  }

  private async handleCallbackQuery(query: any) {
    const data: string = query.data || '';
    const fromUser = query.from?.username ? `@${query.from.username}` : (query.from?.first_name || 'Group Member');
    const telegramId: number = query.from?.id;

    // Action 1: Feed from Group (format: feed:<deviceId>:<durationMs>:<label>)
    if (data.startsWith('feed:')) {
      const parts = data.split(':');
      const deviceId = parts[1];
      const durationMs = parseInt(parts[2], 10) || 700;
      const label = parts[3] || 'Snack';

      const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
      if (!device) {
        await this.answerCallbackQuery(query.id, '❌ Feeder device not found.', true);
        return;
      }

      // Check group feed toggle
      if (!device.groupFeedEnabled) {
        await this.answerCallbackQuery(query.id, '🔒 Group feeding is disabled by owner.', true);
        return;
      }

      // Check user authorization (Owner, Family member, or Guest)
      const member = await this.memberRepository.findOne({
        where: { deviceId: device.id, telegramId },
      });

      const isOwnerOrFamily = member && (member.role === 'owner' || member.role === 'family');
      if (!isOwnerOrFamily && !device.groupGuestFeedAllowed) {
        await this.answerCallbackQuery(
          query.id,
          '🔒 Only registered household members can trigger feeds.',
          true,
        );
        return;
      }

      try {
        // Trigger feed via FeederService
        await this.feederService.triggerManualFeed(
          deviceId,
          { durationMs },
          `telegram_group:${fromUser}`,
        );

        // Immediate popup toast for the button clicker
        await this.answerCallbackQuery(query.id, `🐾 Dispensing ${label} for ${device.petName}!`);

        // Post confirmation into group
        if (query.message?.chat?.id) {
          const roleTag = member ? `(${member.role})` : '(Group Guest)';
          const text =
            `🍽️ *Meal Dispensed for ${device.petName}!*\n` +
            `• Portion: *${label} (${durationMs}ms)*\n` +
            `• Triggered by: *${fromUser}* ${roleTag} via Group Control 🌾\n` +
            `• Status: *Dispensing Now*`;

          await this.sendMessage(query.message.chat.id, text);
        }
      } catch (err: any) {
        const errMsg = err.response?.error || err.message || 'Dispense failed or cooldown active.';
        await this.answerCallbackQuery(query.id, `⚠️ ${errMsg}`, true);
      }
      return;
    }

    // Action 2: Status check from group
    if (data.startsWith('status:')) {
      const deviceId = data.split(':')[1];
      const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
      if (device) {
        const text = `🐾 ${device.petName}: ${device.isOnline ? 'Online' : 'Offline'} in ${device.room}.`;
        await this.answerCallbackQuery(query.id, text, false);
      } else {
        await this.answerCallbackQuery(query.id, 'Device not found.', true);
      }
    }
  }
}
