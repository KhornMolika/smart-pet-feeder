import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';

export class ClaimDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  claimToken: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  petName: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  petEmoji?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  room?: string;
}
