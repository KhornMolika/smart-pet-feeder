import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Device } from '../../devices/entities/device.entity.js';

@Entity('feeding_schedules')
export class FeedingSchedule extends BaseEntity {
  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId: string;

  @Column({ type: 'varchar', length: 64, default: 'Custom Routine' })
  label: string;

  @Column({ name: 'time_local', type: 'varchar', length: 8, default: '12:00' })
  timeLocal: string; // e.g. "07:30" or "18:00"

  @Column({ name: 'days_of_week', type: 'simple-json', default: [1, 2, 3, 4, 5, 6, 7] })
  daysOfWeek: number[];

  @Column({ name: 'duration_ms', type: 'int', default: 700 })
  durationMs: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @ManyToOne('Device', (device: Device) => device.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
