import { IsString, Length, IsEnum, Matches } from 'class-validator';
import { Specialization } from '../../users/user.entity';

export class AdminCreateSpecialistDto {
  @IsString()
  @Length(2, 200)
  full_name: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Неверный формат телефона' })
  phone: string;

  @IsEnum(Specialization)
  specialization: Specialization;

  @IsString()
  @Length(1, 100)
  city: string;
}
