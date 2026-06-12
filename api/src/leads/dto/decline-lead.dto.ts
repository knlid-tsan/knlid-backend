import { IsString, IsNotEmpty } from 'class-validator';

export class DeclineLeadDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
