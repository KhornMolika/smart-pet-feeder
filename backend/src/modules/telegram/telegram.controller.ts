import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramService } from './telegram.service.js';
import { Device } from '../devices/entities/device.entity.js';

@Controller('api/v1/telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  /**
   * Telegram Bot API Webhook Endpoint (handles all group commands & inline button taps)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() update: any) {
    await this.telegramService.handleWebhookUpdate(update);
    return { ok: true };
  }

  /**
   * Triggers posting the interactive feed control menu to the device's linked group chat
   */
  @Post('devices/:deviceId/send-group-menu')
  @HttpCode(HttpStatus.OK)
  async sendGroupMenu(@Param('deviceId') deviceId: string) {
    const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const targetChat = device.telegramGroupId || '-1002345678901';
    const sent = await this.telegramService.sendGroupFeedMenu(targetChat, device);
    return {
      success: sent,
      chatId: targetChat,
      petName: device.petName,
      message: `Interactive feeding menu dispatched to Telegram group (${targetChat})`,
    };
  }

  /**
   * Links a Telegram group to a device
   */
  @Post('devices/:deviceId/link-group')
  @HttpCode(HttpStatus.OK)
  async linkGroup(
    @Param('deviceId') deviceId: string,
    @Body() body: { groupId: string; groupName?: string },
  ) {
    const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    device.telegramGroupId = body.groupId;
    device.telegramGroupName = body.groupName || 'Family Group';
    device.groupFeedEnabled = true;
    device.groupGuestFeedAllowed = true;
    const saved = await this.deviceRepository.save(device);

    return {
      success: true,
      deviceId: saved.id,
      telegramGroupId: saved.telegramGroupId,
      telegramGroupName: saved.telegramGroupName,
    };
  }
}
