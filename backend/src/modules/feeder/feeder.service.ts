import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';

import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FeedingSchedule } from './entities/feeding-schedule.entity.js';
import { FeedCommand } from './entities/feed-command.entity.js';
import { FeedingEvent } from './entities/feeding-event.entity.js';
import { Device } from '../devices/entities/device.entity.js';
import { TriggerFeedDto } from './dto/trigger-feed.dto.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { MqttService } from '../mqtt/mqtt.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import {
  validateDurationBounds,
  isCooldownViolated,
  DEFAULT_SAFETY,
} from './helpers/feed-safety.helper.js';

function getCurrentTimeInTimezone(tz: string = 'Asia/Phnom_Penh'): {
  timeStr: string;
  dayOfWeek: number;
  dateStr: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parts.find((p) => p.type === 'hour')?.value.padStart(2, '0') || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value.padStart(2, '0') || '00';

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  });
  const weekdayStr = dayFormatter.format(now);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] ?? now.getDay();

  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = dateFormatter.format(now);

  return {
    timeStr: `${hour}:${minute}`,
    dayOfWeek,
    dateStr,
  };
}

function getHardwareDeviceIds(deviceId: string): string[] {
  const ids = new Set<string>();
  if (deviceId) {
    ids.add(deviceId);
    ids.add(deviceId.replace(/-/g, '_'));
    ids.add(deviceId.replace(/_001$/, '_01'));
    ids.add(deviceId.replace(/-001$/, '_01'));
    ids.add(deviceId.replace(/^claim_/, ''));
  }
  // Guarantee physical hardware default receives command
  ids.add('feeder_esp32_01');
  return Array.from(ids).filter(Boolean);
}

@Injectable()
export class FeederService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeederService.name);
  private lastFeedTimestamp = 0;
  private scheduleCheckTimer: NodeJS.Timeout | null = null;
  private readonly lastTriggeredSchedules = new Set<string>();

  constructor(
    @InjectRepository(FeedingSchedule)
    private readonly scheduleRepository: Repository<FeedingSchedule>,
    @InjectRepository(FeedCommand)
    private readonly commandRepository: Repository<FeedCommand>,
    @InjectRepository(FeedingEvent)
    private readonly eventRepository: Repository<FeedingEvent>,
    private readonly dataSource: DataSource,
    private readonly mqttService: MqttService,
    private readonly moduleRef: ModuleRef,
  ) {}

  private getTelegramService(): TelegramService | null {
    try {
      return this.moduleRef.get(TelegramService, { strict: false });
    } catch {
      return null;
    }
  }

  async onModuleInit() {
    // Handle incoming MQTT events from ESP32
    this.mqttService.events.on('feedEvent', async (eventData) => {
      await this.recordHardwareEvent(eventData);
    });

    // Automated Schedule Dispatcher: Evaluates active schedules every 15s
    // When schedule time arrives, immediately actuates the servo via MQTT and records the event
    this.scheduleCheckTimer = setInterval(() => {
      this.evaluateSchedules().catch((err) => {
        this.logger.error(`[Schedule Engine] Error evaluating schedules: ${err.message}`);
      });
    }, 15000);
    this.logger.log('⏰ Automated Schedule Engine started (15s evaluation cycle).');
  }

  onModuleDestroy() {
    if (this.scheduleCheckTimer) {
      clearInterval(this.scheduleCheckTimer);
      this.scheduleCheckTimer = null;
    }
  }

  /**
   * Evaluates all enabled feeding schedules across devices.
   * When schedule time arrives, immediately dispatches MQTT feed command to actuate servo and records the event.
   */
  async evaluateSchedules() {
    const { timeStr, dayOfWeek, dateStr } = getCurrentTimeInTimezone('Asia/Phnom_Penh');
    const enabledSchedules = await this.scheduleRepository.find({
      where: { enabled: true },
    });

    for (const schedule of enabledSchedules) {
      if (schedule.timeLocal !== timeStr) {
        continue;
      }

      // Check day of week (support both Sunday=0 and Sunday=7)
      const days = Array.isArray(schedule.daysOfWeek) ? schedule.daysOfWeek : [];
      const matchesDay = days.includes(dayOfWeek) || (dayOfWeek === 0 && days.includes(7));
      if (!matchesDay) {
        continue;
      }

      // Guard against duplicate actuations within the same minute
      const triggerKey = `${schedule.id}_${dateStr}_${timeStr}`;
      if (this.lastTriggeredSchedules.has(triggerKey)) {
        continue;
      }

      this.lastTriggeredSchedules.add(triggerKey);
      if (this.lastTriggeredSchedules.size > 200) {
        const keys = Array.from(this.lastTriggeredSchedules);
        for (let i = 0; i < 100; i++) {
          this.lastTriggeredSchedules.delete(keys[i]);
        }
      }

      this.logger.log(
        `[Schedule Engine] ⏰ SCHEDULE TIME ARRIVED: "${schedule.label}" (${schedule.timeLocal}) for device ${schedule.deviceId}. Dispatching actuation command & event immediately!`,
      );

      const targetHardwareIds = getHardwareDeviceIds(schedule.deviceId);
      const durationMs = schedule.durationMs || 15000;

      // 1. Actuate the hardware servo immediately over MQTT
      const cmdId = `sched_cmd_${Date.now()}`;
      for (const hId of targetHardwareIds) {
        this.mqttService.publishFeedCommand(hId, cmdId, durationMs);
      }

      // 2. Immediately record the feeding event in database & notify Telegram
      await this.recordHardwareEvent({
        deviceId: schedule.deviceId,
        eventId: `sched_${Date.now()}`,
        source: 'schedule',
        status: 'completed',
        durationMs,
        actuationCompleted: true,
      });
    }
  }

  /**
   * Executes a bounded manual feed command, enforces cooldown, dispatches MQTT command,
   * and records the feeding event transactionally.
   */
  async triggerManualFeed(
    deviceId: string,
    dto: TriggerFeedDto,
    requestedBy: string = 'bff_owner',
  ) {
    // 1. Validate duration bounds
    const boundsCheck = validateDurationBounds(dto.durationMs);
    if (!boundsCheck.valid) {
      throw new BadRequestException(boundsCheck.reason);
    }

    // 2. Enforce 3-second motor safety cooldown
    const now = Date.now();
    const cooldownCheck = isCooldownViolated(this.lastFeedTimestamp, now);
    if (cooldownCheck.inCooldown) {
      throw new HttpException(
        {
          error: `Feeder cooldown active. Please wait ${cooldownCheck.remainingSeconds}s.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.lastFeedTimestamp = now;

    // 3. Create command entity and feeding event in database transaction
    return this.dataSource.transaction(async (manager) => {
      const command = manager.create(FeedCommand, {
        deviceId,
        requestedBy,
        durationMs: boundsCheck.clampedDuration,
        status: 'completed',
        expiresAt: new Date(now + 60000),
        completedAt: new Date(),
      });
      await manager.save(command);

      const event = manager.create(FeedingEvent, {
        deviceId,
        commandId: command.id,
        source: 'manual_app',
        status: 'completed',
        durationMs: boundsCheck.clampedDuration,
        actuationCompleted: true,
        note: `Manual treat (${boundsCheck.clampedDuration}ms) via Security BFF`,
        startedAt: new Date(),
        completedAt: new Date(),
      });
      await manager.save(event);

      // 4. Publish feed command to ESP32 over MQTT (broadcast to all alias topics)
      const targetHardwareIds = getHardwareDeviceIds(deviceId);
      this.logger.log(
        `[FeederService] 🍽️ Triggering feed command for ${deviceId} -> target hardware IDs: [${targetHardwareIds.join(', ')}] (${boundsCheck.clampedDuration}ms, Requested by: ${requestedBy})`,
      );

      for (const hId of targetHardwareIds) {
        this.mqttService.publishFeedCommand(
          hId,
          command.id,
          boundsCheck.clampedDuration,
        );
      }

      // 5. Broadcast to linked Telegram Group (if not initiated from the group itself)
      if (!requestedBy.startsWith('telegram_group')) {
        manager
          .getRepository(Device)
          .findOne({ where: { id: deviceId } })
          .then((dev) => {
            if (dev?.telegramGroupId) {
              this.getTelegramService()
                ?.broadcastFeedEvent(dev, {
                  source: 'manual_app',
                  durationMs: boundsCheck.clampedDuration,
                  requestedBy,
                })
                .catch((err) =>
                  this.logger.warn(`Failed to broadcast feed event: ${err.message}`),
                );
            }
          })
          .catch((err) =>
            this.logger.warn(`Failed to load device for broadcast: ${err.message}`),
          );
      }

      return {
        id: command.id,
        deviceId: command.deviceId,
        requestedBy: command.requestedBy,
        durationMs: command.durationMs,
        status: command.status,
        issuedAt: command.createdAt,
        expiresAt: command.expiresAt,
        completedAt: command.completedAt,
      };
    });
  }

  /**
   * Immediately stops active food dispensing on the ESP32 hardware and closes the servo gate.
   */
  async stopFeed(deviceId: string, requestedBy: string = 'bff_owner') {
    const targetHardwareIds = getHardwareDeviceIds(deviceId);
    this.logger.log(
      `[FeederService] 🛑 Stop feed command for ${deviceId} -> target hardware IDs: [${targetHardwareIds.join(', ')}] (Requested by: ${requestedBy})`,
    );

    for (const hId of targetHardwareIds) {
      this.mqttService.publishStopCommand(hId);
    }

    return {
      success: true,
      deviceId,
      stopped: true,
      message: 'Dispense stopped immediately. Gate closed.',
      timestamp: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // SCHEDULES
  // --------------------------------------------------------------------------
  async getSchedules(deviceId: string): Promise<FeedingSchedule[]> {
    const targetHardwareIds = getHardwareDeviceIds(deviceId);
    return this.scheduleRepository.find({
      where: targetHardwareIds.map((id) => ({ deviceId: id })),
      order: { timeLocal: 'ASC' },
    });
  }

  async createSchedule(
    deviceId: string,
    dto: CreateScheduleDto,
  ): Promise<FeedingSchedule> {
    const targetId = (deviceId || 'feeder_esp32_01')
      .replace(/^claim_/, '')
      .replace(/-/g, '_')
      .replace(/_001$/, '_01');

    const { deviceId: _dtoDeviceId, id: _dtoId, ...scheduleData } = dto;

    const schedule = this.scheduleRepository.create({
      ...scheduleData,
      deviceId: targetId,
      device: { id: targetId } as any,
      version: 1,
    });
    const saved = await this.scheduleRepository.save(schedule);
    await this.syncSchedulesToMqtt(targetId);
    return saved;
  }

  async updateSchedule(
    deviceId: string,
    id: string,
    dto: UpdateScheduleDto,
  ): Promise<FeedingSchedule> {
    const targetHardwareIds = getHardwareDeviceIds(deviceId);
    let schedule = await this.scheduleRepository.findOne({
      where: targetHardwareIds.map((hId) => ({ id, deviceId: hId })),
    });
    if (!schedule) {
      schedule = await this.scheduleRepository.findOne({ where: { id } });
    }
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }

    const { deviceId: _dtoDeviceId, id: _dtoId, ...updateData } = dto;
    Object.assign(schedule, updateData);
    const targetId = schedule.deviceId || targetHardwareIds[0] || 'feeder_esp32_01';
    schedule.deviceId = targetId;
    schedule.device = { id: targetId } as any;
    schedule.version = (schedule.version || 1) + 1;
    const updated = await this.scheduleRepository.save(schedule);
    await this.syncSchedulesToMqtt(schedule.deviceId);
    return updated;
  }

  async deleteSchedule(deviceId: string, id: string): Promise<void> {
    const targetHardwareIds = getHardwareDeviceIds(deviceId);
    let schedule = await this.scheduleRepository.findOne({
      where: targetHardwareIds.map((hId) => ({ id, deviceId: hId })),
    });
    if (!schedule) {
      schedule = await this.scheduleRepository.findOne({ where: { id } });
    }
    if (schedule) {
      await this.scheduleRepository.remove(schedule);
    } else {
      await this.scheduleRepository.delete({ id });
    }
    await this.syncSchedulesToMqtt(deviceId);
  }

  private async syncSchedulesToMqtt(deviceId: string) {
    const allSchedules = await this.getSchedules(deviceId);
    const compactSchedules = allSchedules.map((s) => {
      const [h, m] = (s.timeLocal || '12:00').split(':').map(Number);
      return {
        hour: Number.isFinite(h) ? h : 12,
        minute: Number.isFinite(m) ? m : 0,
        durationMs: s.durationMs,
        enabled: s.enabled,
        label: s.label,
      };
    });

    const targetHardwareIds = getHardwareDeviceIds(deviceId);
    for (const hId of targetHardwareIds) {
      this.mqttService.publishDesiredConfig(hId, {
        schedules: compactSchedules,
        defaultDurationMs: 15000,
      });
    }
    this.logger.log(
      `[FeederService] ⏰ Synced ${compactSchedules.length} schedule(s) to MQTT hardware IDs: [${targetHardwareIds.join(', ')}]`,
    );
  }

  // --------------------------------------------------------------------------
  // FEEDING EVENTS & HISTORY
  // --------------------------------------------------------------------------
  async getFeedingEvents(
    deviceId: string,
    limit: number = 25,
  ): Promise<FeedingEvent[]> {
    return this.eventRepository.find({
      where: { deviceId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  private async recordHardwareEvent(data: {
    deviceId: string;
    eventId: string;
    commandId?: string;
    source: 'manual_app' | 'button' | 'schedule';
    status: 'completed' | 'interrupted';
    durationMs: number;
    actuationCompleted: boolean;
  }) {
    try {
      const event = this.eventRepository.create({
        deviceId: data.deviceId,
        commandId: data.commandId || null,
        source: data.source,
        status: data.status,
        durationMs: data.durationMs,
        actuationCompleted: data.actuationCompleted,
        note: `Actuation via hardware ${data.source} (${data.durationMs}ms)`,
        startedAt: new Date(),
        completedAt: new Date(),
      });
      await this.eventRepository.save(event);
      this.logger.log(`Persisted hardware event for ${data.deviceId} (${data.source})`);

      // Broadcast hardware button or RTC schedule feeds to group chat
      if (data.status === 'completed' && data.source !== 'manual_app') {
        const device = await this.dataSource
          .getRepository(Device)
          .findOne({ where: { id: data.deviceId } });
        if (device?.telegramGroupId) {
          await this.getTelegramService()
            ?.broadcastFeedEvent(device, {
              source: data.source,
              durationMs: data.durationMs,
            })
            .catch((err) =>
              this.logger.warn(`Failed to broadcast hardware feed event: ${err.message}`),
            );
        }
      }
    } catch (err: unknown) {
      this.logger.error(`Failed to persist hardware event: ${(err as Error)?.message}`);
    }
  }
}
