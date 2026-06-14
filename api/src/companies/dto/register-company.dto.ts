import { IsString, Length, Matches } from 'class-validator';

export class RegisterCompanyDto {
  @IsString()
  @Length(1, 200)
  name: string;

  @IsString()
  @Matches(/^\d{12}$/, { message: 'БИН должен содержать ровно 12 цифр' })
  bin: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Неверный формат телефона' })
  phone: string;

  @IsString()
  @Length(1, 100)
  city: string;
}
