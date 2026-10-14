import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { Device } from '../../devices/entities/device.entity.js';

export type FeedingSource = 'manual_app' | 'button' | 'schedule';
export type FeedingEventStatus = 'completed' | 'interrupted' | 'failed';

@Entity('feeding_events')
export class FeedingEvent extends BaseEntity {
  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId: string;

  @Column({ name: 'command_id', type: 'varchar', length: 64, nullable: true })
  commandId: string | null;

  @Column({ name: 'schedule_id', type: 'varchar', length: 64, nullable: true })
  scheduleId: string | null;

  @Column({ type: 'varchar', length: 32 })
  source: FeedingSource;

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  status: FeedingEventStatus;

  @Column({ name: 'started_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ name: 'actuation_completed', type: 'boolean', default: true })
  actuationCompleted: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Feed actuation completed' })
  note: string;

  @ManyToOne('Device', (device: Device) => device.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
