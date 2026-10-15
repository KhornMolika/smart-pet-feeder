import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class TriggerFeedDto {
  @IsInt()
  @Min(200)
  @Max(180000)
  durationMs: number = 60000;

  @IsOptional()
  commandId?: string;
}
