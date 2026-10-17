import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Specialization } from '../../users/user.entity';

// Редактирование профиля пользователя админом/модератором
export class AdminUpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  full_name?: string;

  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;

  // Уточнение для «Другое»; при смене на конкретную специализацию очищается
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization_other?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city?: string;
}
