import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingSchedule } from './entities/feeding-schedule.entity.js';
import { FeedCommand } from './entities/feed-command.entity.js';
import { FeedingEvent } from './entities/feeding-event.entity.js';
import { FeederService } from './feeder.service.js';
import { FeederController } from './feeder.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedingSchedule, FeedCommand, FeedingEvent]),
  ],
  controllers: [FeederController],
  providers: [FeederService],
  exports: [FeederService],
})
export class FeederModule {}
