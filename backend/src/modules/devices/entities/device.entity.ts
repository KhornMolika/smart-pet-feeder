import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { DeviceSettings } from './device-settings.entity.js';
import { DeviceMember } from './device-member.entity.js';
import { FeedingSchedule } from '../../feeder/entities/feeding-schedule.entity.js';
import { FeedingEvent } from '../../feeder/entities/feeding-event.entity.js';

@Entity('devices')
export class Device {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 128, default: 'Mochis Feeder' })
  name: string;

  @Column({ name: 'owner_id', type: 'varchar', length: 64, default: 'owner_bff_user' })
  ownerId: string;

  @Column({ name: 'pet_name', type: 'varchar', length: 64, default: 'Mochi' })
  petName: string;

  @Column({ name: 'pet_emoji', type: 'varchar', length: 32, default: 'cat' })
  petEmoji: string;

  @Column({ type: 'varchar', length: 64, default: 'Living Room' })
  room: string;

  @Column({ name: 'claim_token', type: 'varchar', length: 64, nullable: true })
  claimToken: string | null;

  @Column({ name: 'is_claimed', type: 'boolean', default: false })
  isClaimed: boolean;

  @Column({ name: 'claimed_at', type: 'datetime', nullable: true })
  claimedAt: Date | null;

  @Column({ name: 'last_seen_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastSeenAt: Date;

  @Column({ name: 'firmware_version', type: 'varchar', length: 32, default: '1.0.0-esp32' })
  firmwareVersion: string;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Phnom_Penh' })
  timezone: string;

  @Column({ name: 'config_version', type: 'int', default: 1 })
  configVersion: number;

  @Column({ name: 'is_online', type: 'boolean', default: true })
  isOnline: boolean;

  @Column({ name: 'telegram_group_id', type: 'varchar', length: 64, nullable: true })
  telegramGroupId: string | null;

  @Column({ name: 'telegram_group_name', type: 'varchar', length: 128, nullable: true })
  telegramGroupName: string | null;

  @Column({ name: 'group_feed_enabled', type: 'boolean', default: true })
  groupFeedEnabled: boolean;

  @Column({ name: 'group_guest_feed_allowed', type: 'boolean', default: true })
  groupGuestFeedAllowed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToOne(() => DeviceSettings, (settings) => settings.device, { cascade: true })
  settings: DeviceSettings;

  @OneToMany(() => FeedingSchedule, (schedule) => schedule.device)
  schedules: FeedingSchedule[];

  @OneToMany(() => FeedingEvent, (event) => event.device)
  events: FeedingEvent[];

  @OneToMany('DeviceMember', (member: DeviceMember) => member.device)
  members: DeviceMember[];
}
