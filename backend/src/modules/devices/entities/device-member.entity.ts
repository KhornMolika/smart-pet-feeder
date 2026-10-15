import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Device } from './device.entity.js';

@Entity('device_members')
export class DeviceMember extends BaseEntity {
  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'telegram_id', type: 'bigint', nullable: true })
  telegramId: number | null;

  @Column({ name: 'user_name', type: 'varchar', length: 64, default: 'Household Member' })
  userName: string;

  @Column({ type: 'varchar', length: 32, default: 'family' })
  role: 'owner' | 'family' | 'guest';

  @Column({ name: 'avatar_emoji', type: 'varchar', length: 16, default: '👤' })
  avatarEmoji: string;

  @ManyToOne('Device', (device: Device) => device.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
