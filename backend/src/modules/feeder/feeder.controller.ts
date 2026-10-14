import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FeederService } from './feeder.service.js';
import { TriggerFeedDto } from './dto/trigger-feed.dto.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { TelegramAuthGuard } from '../../common/guards/telegram-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('api/v1/devices/:deviceId')
@UseGuards(TelegramAuthGuard)
export class FeederController {
  constructor(private readonly feederService: FeederService) {}

  @Post('feed')
  @HttpCode(HttpStatus.OK)
  async triggerFeed(
    @Param('deviceId') deviceId: string,
    @Body() dto: TriggerFeedDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.feederService.triggerManualFeed(deviceId, dto, userId);
  }

  @Get('schedules')
  async getSchedules(@Param('deviceId') deviceId: string) {
    return this.feederService.getSchedules(deviceId);
  }

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  async createSchedule(
    @Param('deviceId') deviceId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.feederService.createSchedule(deviceId, dto);
  }

  @Put('schedules/:scheduleId')
  @HttpCode(HttpStatus.OK)
  async updateSchedule(
    @Param('deviceId') deviceId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.feederService.updateSchedule(deviceId, scheduleId, dto);
  }

  @Delete('schedules/:scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSchedule(
    @Param('deviceId') deviceId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.feederService.deleteSchedule(deviceId, scheduleId);
  }

  @Get('events')
  async getEvents(
    @Param('deviceId') deviceId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.feederService.getFeedingEvents(deviceId, limit || 25);
  }
}
