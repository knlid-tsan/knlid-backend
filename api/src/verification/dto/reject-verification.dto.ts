import { IsString, IsNotEmpty } from 'class-validator';

export class RejectVerificationDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
