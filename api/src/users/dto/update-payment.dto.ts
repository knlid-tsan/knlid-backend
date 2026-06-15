import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdatePaymentDto {
  @IsUUID()
  bank_id: string;

  @IsString()
  @IsNotEmpty()
  payment_phone: string;
}
