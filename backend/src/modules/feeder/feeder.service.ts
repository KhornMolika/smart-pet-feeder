import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  OnModuleInit,
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

@Injectable()
export class FeederService implements OnModuleInit {
  private readonly logger = new Logger(FeederService.name);
  private lastFeedTimestamp = 0;

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

  onModuleInit() {
    // Seed default schedules if none exist
    this.seedDefaultSchedules('feeder_esp32_01');

    // Handle incoming MQTT events from ESP32
    this.mqttService.events.on('feedEvent', async (eventData) => {
      await this.recordHardwareEvent(eventData);
    });
  }

  private async seedDefaultSchedules(deviceId: string) {
    try {
      const count = await this.scheduleRepository.count({ where: { deviceId } });
      if (count === 0) {
        await this.scheduleRepository.save([
          this.scheduleRepository.create({
            deviceId,
            label: 'Breakfast Crunch',
            timeLocal: '07:30',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            durationMs: 700,
            enabled: true,
            version: 1,
          }),
          this.scheduleRepository.create({
            deviceId,
            label: 'Dinner Feast',
            timeLocal: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
            durationMs: 700,
            enabled: true,
            version: 1,
          }),
        ]);
        this.logger.log(`Seeded default feeding schedules for ${deviceId}`);
      }
    } catch {
      // Ignored
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

      // 4. Publish feed command to ESP32 over MQTT
      this.mqttService.publishFeedCommand(
        deviceId,
        command.id,
        boundsCheck.clampedDuration,
      );

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

  // --------------------------------------------------------------------------
  // SCHEDULES
  // --------------------------------------------------------------------------
  async getSchedules(deviceId: string): Promise<FeedingSchedule[]> {
    let schedules = await this.scheduleRepository.find({
      where: { deviceId },
      order: { timeLocal: 'ASC' },
    });
    if (schedules.length === 0) {
      await this.seedDefaultSchedules(deviceId);
      schedules = await this.scheduleRepository.find({
        where: { deviceId },
        order: { timeLocal: 'ASC' },
      });
    }
    return schedules;
  }

  async createSchedule(
    deviceId: string,
    dto: CreateScheduleDto,
  ): Promise<FeedingSchedule> {
    const schedule = this.scheduleRepository.create({
      deviceId,
      ...dto,
      version: 1,
    });
    const saved = await this.scheduleRepository.save(schedule);
    await this.syncSchedulesToMqtt(deviceId);
    return saved;
  }

  async updateSchedule(
    deviceId: string,
    id: string,
    dto: UpdateScheduleDto,
  ): Promise<FeedingSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, deviceId },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }

    Object.assign(schedule, dto);
    schedule.version += 1;
    const updated = await this.scheduleRepository.save(schedule);
    await this.syncSchedulesToMqtt(deviceId);
    return updated;
  }

  async deleteSchedule(deviceId: string, id: string): Promise<void> {
    const result = await this.scheduleRepository.delete({ id, deviceId });
    if (result.affected === 0) {
      throw new NotFoundException(`Schedule ${id} not found`);
    }
    await this.syncSchedulesToMqtt(deviceId);
  }

  private async syncSchedulesToMqtt(deviceId: string) {
    const allSchedules = await this.getSchedules(deviceId);
    const compactSchedules = allSchedules.map((s) => {
      const [h, m] = s.timeLocal.split(':').map(Number);
      return {
        hour: h,
        minute: m,
        durationMs: s.durationMs,
        enabled: s.enabled,
        label: s.label,
      };
    });

    this.mqttService.publishDesiredConfig(deviceId, {
      schedules: compactSchedules,
    });
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
