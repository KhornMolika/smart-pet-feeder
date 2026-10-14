import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DevicesService } from './devices.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { TelegramAuthGuard } from '../../common/guards/telegram-auth.guard.js';

@Controller('api/v1/devices')
@UseGuards(TelegramAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get(':id')
  async getDevice(@Param('id') id: string) {
    return this.devicesService.getDevice(id);
  }

  @Get(':id/status')
  async getDeviceStatus(@Param('id') id: string) {
    return this.devicesService.getDeviceStatus(id);
  }

  @Get(':id/settings')
  async getDeviceSettings(@Param('id') id: string) {
    return this.devicesService.getDeviceSettings(id);
  }

  @Patch(':id/settings')
  @HttpCode(HttpStatus.OK)
  async updateDeviceSettings(
    @Param('id') id: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.devicesService.updateDeviceSettings(id, dto);
  }
}
