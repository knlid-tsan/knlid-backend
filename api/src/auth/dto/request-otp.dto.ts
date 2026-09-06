import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+77\d{9}$/, { message: 'Доступны только номера Казахстана' })
  phone: string;
}
