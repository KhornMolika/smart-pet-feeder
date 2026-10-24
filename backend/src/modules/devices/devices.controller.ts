import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DevicesService } from './devices.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { ClaimDeviceDto } from './dto/claim-device.dto.js';
import { CreateInviteDto } from './dto/create-invite.dto.js';
import { JoinDeviceDto } from './dto/join-device.dto.js';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto.js';
import { TelegramAuthGuard } from '../../common/guards/telegram-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/guards/telegram-auth.guard.js';

@Controller('api/v1/devices')
@UseGuards(TelegramAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('claim/preview/:token')
  async previewClaim(@Param('token') token: string) {
    return this.devicesService.previewClaim(token);
  }

  @Post('claim')
  @HttpCode(HttpStatus.CREATED)
  async claimDevice(
    @Body() dto: ClaimDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.claimDevice(dto, user);
  }

  @Post('join')
  @HttpCode(HttpStatus.CREATED)
  async joinDevice(
    @Body() dto: JoinDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.joinDevice(dto, user);
  }

  @Get()
  async getUserDevices(@CurrentUser() user: AuthenticatedUser) {
    return this.devicesService.getUserDevices(user);
  }

  @Get(':id')
  async getDevice(@Param('id') id: string) {
    return this.devicesService.getDevice(id);
  }

  @Get(':id/status')
  async getDeviceStatus(@Param('id') id: string) {
    return this.devicesService.getDeviceStatus(id);
  }

  @Get(':id/members')
  async getDeviceMembers(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.getDeviceMembers(id, user);
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Param('id') id: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.createInvite(id, dto, user);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.devicesService.removeMember(id, memberId, user);
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

  @Patch(':id/group-settings')
  @HttpCode(HttpStatus.OK)
  async updateGroupSettings(
    @Param('id') id: string,
    @Body() dto: UpdateGroupSettingsDto,
  ) {
    return this.devicesService.updateGroupSettings(id, dto);
  }
}
