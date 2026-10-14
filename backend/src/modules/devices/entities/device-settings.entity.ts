import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Device } from './device.entity.js';

@Entity('device_settings')
export class DeviceSettings extends BaseEntity {
  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId: string;

  @Column({ name: 'default_duration_ms', type: 'int', default: 700 })
  defaultDurationMs: number;

  @Column({ name: 'max_duration_ms', type: 'int', default: 2000 })
  maxDurationMs: number;

  @Column({ name: 'cooldown_seconds', type: 'int', default: 3 })
  cooldownSeconds: number;

  @Column({ name: 'buzzer_enabled', type: 'boolean', default: true })
  buzzerEnabled: boolean;

  @Column({ name: 'max_feeds_per_day', type: 'int', default: 12 })
  maxFeedsPerDay: number;

  @OneToOne('Device', (device: Device) => device.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
