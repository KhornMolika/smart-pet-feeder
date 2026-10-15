import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInviteDto {
  @IsIn(['family', 'guest'])
  role: 'family' | 'guest';

  @IsString()
  @IsOptional()
  @MaxLength(64)
  note?: string;
}
