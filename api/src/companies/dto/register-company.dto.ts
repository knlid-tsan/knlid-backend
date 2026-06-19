import { IsString, Length, Matches, IsNotEmpty } from 'class-validator';

export class RegisterCompanyDto {
  @IsString()
  @Length(1, 200)
  name: string;

  @IsString()
  @Length(1, 100)
  city: string;

  @IsString()
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;

  @IsString()
  @Length(1, 200)
  contactName: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Неверный формат телефона контактного лица' })
  contactPhone: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
