import {
  IsString,
  IsNotEmpty,
  IsEnum,
  Length,
  ValidateIf,
} from 'class-validator';
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

  // Обязательно при specialization = other, иначе игнорируется
  @ValidateIf((o: RegisterDto) => o.specialization === Specialization.OTHER)
  @IsString()
  @IsNotEmpty({ message: 'Укажите вашу специализацию' })
  @Length(2, 100)
  specialization_other?: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}
