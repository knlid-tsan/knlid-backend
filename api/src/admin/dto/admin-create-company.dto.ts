import { IsString, Length, Matches } from 'class-validator';

export class AdminCreateCompanyDto {
  @IsString()
  @Length(1, 200)
  name: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Неверный формат телефона' })
  phone: string;

  @IsString()
  @Length(1, 100)
  city: string;
}
