import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity.js';
import { DeviceSettings } from './entities/device-settings.entity.js';
import { DeviceMember } from './entities/device-member.entity.js';
import { DevicesService } from './devices.service.js';
import { DevicesController } from './devices.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Device, DeviceSettings, DeviceMember])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
