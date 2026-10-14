import { IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt()
  @Min(200)
  @Max(2000)
  @IsOptional()
  defaultDurationMs?: number;

  @IsInt()
  @Min(500)
  @Max(3000)
  @IsOptional()
  maxDurationMs?: number;

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  cooldownSeconds?: number;

  @IsBoolean()
  @IsOptional()
  buzzerEnabled?: boolean;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  maxFeedsPerDay?: number;
}
