import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service.js';
import { TelegramController } from './telegram.controller.js';
import { Device } from '../devices/entities/device.entity.js';
import { DeviceMember } from '../devices/entities/device-member.entity.js';
import { FeederModule } from '../feeder/feeder.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceMember]),
    forwardRef(() => FeederModule),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
