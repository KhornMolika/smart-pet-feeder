import {
  IsString,
  Matches,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'timeLocal must be in 24-hour HH:MM format',
  })
  @IsOptional()
  timeLocal?: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  @IsOptional()
  daysOfWeek?: number[];

  @IsInt()
  @Min(200)
  @Max(5000)
  @IsOptional()
  durationMs?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
