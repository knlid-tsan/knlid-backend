import { IsString, IsNotEmpty } from 'class-validator';

export class OpenDisputeDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
