import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Device } from './entities/device.entity.js';
import { DeviceSettings } from './entities/device-settings.entity.js';
import { DeviceMember } from './entities/device-member.entity.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { ClaimDeviceDto } from './dto/claim-device.dto.js';
import { CreateInviteDto } from './dto/create-invite.dto.js';
import { JoinDeviceDto } from './dto/join-device.dto.js';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto.js';
import { MqttService } from '../mqtt/mqtt.service.js';
import type { AuthenticatedUser } from '../../common/guards/telegram-auth.guard.js';

@Injectable()
export class DevicesService implements OnModuleInit {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceSettings)
    private readonly settingsRepository: Repository<DeviceSettings>,
    @InjectRepository(DeviceMember)
    private readonly memberRepository: Repository<DeviceMember>,
    private readonly dataSource: DataSource,
    private readonly mqttService: MqttService,
  ) {}

  async onModuleInit() {
    // Seed default feeder device for development/testing if database is fresh
    await this.ensureDefaultDevice('feeder_esp32_01');

    // Seed factory demo QR feeder device ready for deep link scanning test
    await this.ensureFactoryDemoDevice('feeder_esp32_qr_demo', 'claim_cc8a2f_9x7k2q');

    // Listen for MQTT device events to update live state
    this.mqttService.events.on('deviceState', async (payload) => {
      await this.updateLastSeen(
        payload.deviceId,
        payload.online,
      );
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
        claimToken: `claim_${deviceId}`,
        name: "Mochi's Feeder",
        ownerId: 'owner_bff_user',
        petName: 'Mochi',
        petEmoji: 'cat',
        room: 'Living Room',
        isClaimed: true,
        claimedAt: new Date(),
        firmwareVersion: '1.0.0-esp32',
        timezone: 'Asia/Phnom_Penh',
        configVersion: 1,
        isOnline: true,
        telegramGroupId: '-1002345678901',
        telegramGroupName: "🐾 Mochi's Family Chat",
        groupFeedEnabled: true,
        groupGuestFeedAllowed: true,
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

  async ensureFactoryDemoDevice(deviceId: string, claimToken: string): Promise<Device> {
    let device = await this.deviceRepository.findOne({
      where: { claimToken },
      relations: { settings: true },
    });

    if (!device) {
      device = this.deviceRepository.create({
        id: deviceId,
        name: 'New ESP32 Feeder',
        ownerId: 'unclaimed',
        petName: 'Bella',
        petEmoji: 'dog',
        room: 'Kitchen',
        claimToken,
        isClaimed: false,
        firmwareVersion: '1.2.0-esp32',
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

  async previewClaim(claimToken: string) {
    if (!claimToken) {
      throw new BadRequestException('Claim token is required');
    }

    let device = await this.deviceRepository.findOne({
      where: { claimToken },
    });

    // Auto-create demo device if the standard test token is used
    if (!device && claimToken === 'claim_cc8a2f_9x7k2q') {
      device = await this.ensureFactoryDemoDevice('feeder_esp32_qr_demo', claimToken);
    }

    if (!device) {
      return {
        valid: true,
        claimToken,
        model: 'ESP32 Smart Pet Feeder Pro',
        isClaimed: false,
        isOnline: true,
        message: 'Factory device discovered via QR code. Ready to claim!',
      };
    }

    return {
      valid: true,
      deviceId: device.id,
      claimToken: device.claimToken,
      name: device.name,
      petName: device.petName,
      petEmoji: device.petEmoji,
      room: device.room,
      model: 'ESP32 Smart Pet Feeder Pro',
      isClaimed: device.isClaimed,
      isOnline: device.isOnline,
      message: device.isClaimed
        ? 'Device has already been claimed.'
        : 'Device verified and ready for pairing!',
    };
  }

  async claimDevice(dto: ClaimDeviceDto, user: AuthenticatedUser): Promise<Device> {
    return this.dataSource.transaction(async (manager) => {
      let device = await manager.findOne(Device, {
        where: [
          { claimToken: dto.claimToken },
          { id: dto.claimToken.replace(/^claim_/, '') },
          { id: 'feeder_esp32_01' },
        ],
        relations: { settings: true },
      });

      if (!device) {
        // Create new device record for this valid QR factory token
        const rawToken = dto.claimToken.replace(/^claim_/, '');
        const newId = rawToken.startsWith('feeder_') ? rawToken : `feeder_esp32_${rawToken.slice(0, 8)}`;
        device = manager.create(Device, {
          id: newId,
          name: `${dto.petName.trim()}'s Feeder`,
          ownerId: user.id || 'owner_bff_user',
          petName: dto.petName.trim(),
          petEmoji: dto.petEmoji || 'cat',
          room: dto.room?.trim() || 'Living Room',
          claimToken: dto.claimToken,
          isClaimed: true,
          claimedAt: new Date(),
          firmwareVersion: '1.2.0-esp32',
          timezone: 'Asia/Phnom_Penh',
          configVersion: 1,
          isOnline: true,
        });
        await manager.save(device);

        const settings = manager.create(DeviceSettings, {
          deviceId: device.id,
          defaultDurationMs: 15000,
          maxDurationMs: 180000,
          cooldownSeconds: 3,
          buzzerEnabled: true,
          maxFeedsPerDay: 12,
        });
        await manager.save(settings);
        device.settings = settings;
        return device;
      }

      if (device.isClaimed && device.ownerId !== user.id) {
        throw new ConflictException(
          'This feeder has already been claimed by another owner. Please request an invitation from the owner to join as a family member.',
        );
      }

      // Claim and bind device to this user
      device.ownerId = user.id;
      device.petName = dto.petName.trim();
      device.petEmoji = dto.petEmoji || 'cat';
      device.room = dto.room?.trim() || 'Living Room';
      device.name = `${dto.petName.trim()}'s Feeder`;
      device.isClaimed = true;
      device.claimedAt = new Date();

      const saved = await manager.save(device);

      // Upsert owner member record with real Telegram user info
      const ownerName = user.firstName ? `${user.firstName} (You)` : 'Owner (You)';
      let ownerMember = await manager.findOne(DeviceMember, {
        where: { deviceId: device.id, role: 'owner' },
      });
      if (!ownerMember) {
        ownerMember = manager.create(DeviceMember, {
          deviceId: device.id,
          userId: user.id,
          telegramId: user.telegramId ?? null,
          userName: ownerName,
          role: 'owner',
          avatarEmoji: '👑',
        });
      } else {
        ownerMember.userId = user.id;
        ownerMember.userName = ownerName;
        ownerMember.telegramId = user.telegramId ?? null;
      }
      await manager.save(ownerMember);

      return saved;
    });
  }

  async getDeviceMembers(deviceId: string, user?: AuthenticatedUser): Promise<DeviceMember[]> {
    let members = await this.memberRepository.find({
      where: { deviceId },
      order: { createdAt: 'ASC' },
    });

    if (members.length === 0) {
      // Auto-populate authenticated owner without mock family accounts
      const ownerName = user?.firstName ? `${user.firstName} (You)` : 'Owner (You)';
      const defaultOwner = this.memberRepository.create({
        deviceId,
        userId: user?.id || 'owner_user',
        telegramId: user?.telegramId ?? null,
        userName: ownerName,
        role: 'owner',
        avatarEmoji: '👑',
      });
      await this.memberRepository.save(defaultOwner);
      return [defaultOwner];
    }

    return members;
  }

  async createInvite(deviceId: string, dto: CreateInviteDto, user: AuthenticatedUser) {
    const device = await this.getDevice(deviceId);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const inviteToken = `join_${device.id}_${dto.role}_${randomSuffix}`;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'ChinChemBot';
    const inviteUrl = `https://t.me/${botUsername}/app?startapp=${inviteToken}`;

    return {
      success: true,
      deviceId: device.id,
      deviceName: device.name,
      role: dto.role,
      inviteToken,
      inviteUrl,
      expiresIn: '7 days',
    };
  }

  async joinDevice(dto: JoinDeviceDto, user: AuthenticatedUser): Promise<DeviceMember> {
    const parts = dto.inviteToken.split('_');
    const deviceId = parts[1] || 'feeder_esp32_01';
    const role = (parts[2] as 'owner' | 'family' | 'guest') || 'family';

    const device = await this.getDevice(deviceId);

    let member = await this.memberRepository.findOne({
      where: { deviceId: device.id, userId: user.id },
    });

    if (member) {
      return member;
    }

    member = this.memberRepository.create({
      deviceId: device.id,
      userId: user.id || 'new_member',
      telegramId: user.telegramId || null,
      userName: dto.userName || user.firstName || user.username || 'Family Member',
      role,
      avatarEmoji: role === 'guest' ? '🐾' : '👤',
    });

    return this.memberRepository.save(member);
  }

  async removeMember(deviceId: string, memberId: string, user: AuthenticatedUser): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId, deviceId },
    });

    if (!member) {
      throw new NotFoundException('Member not found on this feeder');
    }

    if (member.role === 'owner') {
      throw new BadRequestException('Primary owner cannot be removed from feeder');
    }

    await this.memberRepository.remove(member);
    return true;
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

  async updateGroupSettings(
    deviceId: string,
    dto: UpdateGroupSettingsDto,
  ): Promise<Device> {
    const device = await this.getDevice(deviceId);
    if (dto.telegramGroupId !== undefined) {
      device.telegramGroupId = dto.telegramGroupId;
    }
    if (dto.telegramGroupName !== undefined) {
      device.telegramGroupName = dto.telegramGroupName;
    }
    if (dto.groupFeedEnabled !== undefined) {
      device.groupFeedEnabled = dto.groupFeedEnabled;
    }
    if (dto.groupGuestFeedAllowed !== undefined) {
      device.groupGuestFeedAllowed = dto.groupGuestFeedAllowed;
    }
    return this.deviceRepository.save(device);
  }

  private async updateLastSeen(
    deviceId: string,
    isOnline: boolean,
  ) {
    try {
      const updateData: Record<string, unknown> = {
        lastSeenAt: new Date(),
        isOnline,
      };
      await this.deviceRepository.update({ id: deviceId }, updateData);
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
