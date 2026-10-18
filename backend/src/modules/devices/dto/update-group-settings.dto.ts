import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateGroupSettingsDto {
  @IsString()
  @IsOptional()
  telegramGroupId?: string | null;

  @IsString()
  @IsOptional()
  telegramGroupName?: string | null;

  @IsBoolean()
  @IsOptional()
  groupFeedEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  groupGuestFeedAllowed?: boolean;
}
