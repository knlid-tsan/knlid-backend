import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Specialization } from '../../users/user.entity';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  // Поля ниже нужны только при регистрации нового пользователя
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  full_name?: string;

  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;
}
