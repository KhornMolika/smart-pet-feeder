import {
  IsString,
  IsNotEmpty,
  Matches,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  label: string = 'Daily Routine';

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'timeLocal must be in 24-hour HH:MM format',
  })
  timeLocal: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(7, { each: true })
  daysOfWeek: number[] = [0, 1, 2, 3, 4, 5, 6];

  @IsInt()
  @Min(200)
  @Max(180000)
  durationMs: number = 60000;

  @IsBoolean()
  @IsOptional()
  enabled: boolean = true;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsInt()
  priority?: number;
}
