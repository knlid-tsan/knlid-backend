import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Specialization } from '../../users/user.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEnum(Specialization)
  specialization: Specialization;

  @IsString()
  @IsNotEmpty()
  city: string;
}
