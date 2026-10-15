import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  inviteToken: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  userName?: string;
}
