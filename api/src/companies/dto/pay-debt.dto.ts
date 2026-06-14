import { IsUrl, IsNotEmpty } from 'class-validator';

export class PayDebtDto {
  @IsNotEmpty()
  @IsUrl()
  proof_url: string;
}
