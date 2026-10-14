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
  @Min(1, { each: true })
  @Max(7, { each: true })
  daysOfWeek: number[] = [1, 2, 3, 4, 5, 6, 7];

  @IsInt()
  @Min(200)
  @Max(5000)
  durationMs: number = 1500;

  @IsBoolean()
  @IsOptional()
  enabled: boolean = true;
}
