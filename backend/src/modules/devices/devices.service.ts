import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Device } from './entities/device.entity.js';
import { DeviceSettings } from './entities/device-settings.entity.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { MqttService } from '../mqtt/mqtt.service.js';

@Injectable()
export class DevicesService implements OnModuleInit {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceSettings)
    private readonly settingsRepository: Repository<DeviceSettings>,
    private readonly dataSource: DataSource,
    private readonly mqttService: MqttService,
  ) {}

  async onModuleInit() {
    // Seed default feeder device for development/testing if database is fresh
    await this.ensureDefaultDevice('feeder_esp32_01');

    // Listen for MQTT device events to update live state
    this.mqttService.events.on('deviceState', async (payload) => {
      await this.updateLastSeen(payload.deviceId, payload.online);
    });

    this.mqttService.events.on('deviceAvailability', async (payload) => {
      await this.updateAvailability(payload.deviceId, payload.isOnline);
    });
  }

  async ensureDefaultDevice(deviceId: string): Promise<Device> {
    let device = await this.deviceRepository.findOne({
      where: { id: deviceId },
      relations: { settings: true },
    });

    if (!device) {
      device = this.deviceRepository.create({
        id: deviceId,
        name: "Mochi's Feeder",
        ownerId: 'owner_bff_user',
        firmwareVersion: '1.0.0-esp32',
        timezone: 'Asia/Phnom_Penh',
        configVersion: 1,
        isOnline: true,
      });
      await this.deviceRepository.save(device);

      const settings = this.settingsRepository.create({
        deviceId: device.id,
        defaultDurationMs: 700,
        maxDurationMs: 2000,
        cooldownSeconds: 3,
        buzzerEnabled: true,
        maxFeedsPerDay: 12,
      });
      await this.settingsRepository.save(settings);
      device.settings = settings;
    }

    return device;
  }

  async getDevice(id: string): Promise<Device> {
    let device = await this.deviceRepository.findOne({
      where: { id },
      relations: { settings: true },
    });
    if (!device) {
      device = await this.ensureDefaultDevice(id);
    }
    return device;
  }

  async getDeviceStatus(id: string) {
    const device = await this.getDevice(id);
    const now = Date.now();
    const lastSeenMs = new Date(device.lastSeenAt).getTime();
    // Device is considered online if seen within last 45 seconds or explicitly reported
    const isOnline = device.isOnline && now - lastSeenMs < 45000;

    return {
      deviceId: device.id,
      name: device.name,
      isOnline,
      lastSeenAt: device.lastSeenAt,
      firmwareVersion: device.firmwareVersion,
      rtcSynced: true,
      timezone: device.timezone,
      configVersion: device.configVersion,
    };
  }

  async getDeviceSettings(id: string): Promise<DeviceSettings> {
    const settings = await this.settingsRepository.findOne({
      where: { deviceId: id },
    });
    if (!settings) {
      throw new NotFoundException(`Settings for device ${id} not found`);
    }
    return settings;
  }

  async updateDeviceSettings(id: string, dto: UpdateSettingsDto): Promise<DeviceSettings> {
    return this.dataSource.transaction(async (manager) => {
      let settings = await manager.findOne(DeviceSettings, {
        where: { deviceId: id },
      });
      if (!settings) {
        settings = manager.create(DeviceSettings, { deviceId: id, ...dto });
      } else {
        Object.assign(settings, dto);
      }
      const saved = await manager.save(settings);

      // Increment device config version
      await manager.increment(Device, { id }, 'configVersion', 1);

      // Publish desired config update over MQTT
      this.mqttService.publishDesiredConfig(id, {
        settings: {
          defaultDurationMs: saved.defaultDurationMs,
          maxDurationMs: saved.maxDurationMs,
          buzzerEnabled: saved.buzzerEnabled,
        },
      });

      return saved;
    });
  }

  private async updateLastSeen(deviceId: string, isOnline: boolean) {
    try {
      await this.deviceRepository.update(
        { id: deviceId },
        { lastSeenAt: new Date(), isOnline },
      );
    } catch {
      // Ignored if device doesn't exist yet
    }
  }

  private async updateAvailability(deviceId: string, isOnline: boolean) {
    try {
      await this.deviceRepository.update(
        { id: deviceId },
        { isOnline, lastSeenAt: new Date() },
      );
    } catch {
      // Ignored
    }
  }
}
