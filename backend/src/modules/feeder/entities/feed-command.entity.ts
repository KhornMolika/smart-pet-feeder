import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';

export type FeedCommandStatus = 'pending' | 'completed' | 'failed' | 'expired';

@Entity('feed_commands')
export class FeedCommand extends BaseEntity {
  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId: string;

  @Column({ name: 'requested_by', type: 'varchar', length: 64 })
  requestedBy: string;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: FeedCommandStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
