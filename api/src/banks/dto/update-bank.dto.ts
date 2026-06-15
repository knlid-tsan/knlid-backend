import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBankDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
