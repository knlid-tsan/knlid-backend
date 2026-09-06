import {
  IsOptional,
  IsString,
  Length,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Specialization } from '../user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  full_name?: string;

  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;

  // Обязательно, если специализация меняется на «Другое»
  @ValidateIf((o: UpdateProfileDto) => o.specialization === Specialization.OTHER)
  @IsString()
  @IsNotEmpty({ message: 'Укажите вашу специализацию' })
  @Length(2, 100)
  specialization_other?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;
}
