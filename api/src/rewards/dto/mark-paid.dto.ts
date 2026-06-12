import { IsString, IsNotEmpty } from 'class-validator';

export class MarkPaidDto {
  @IsString()
  @IsNotEmpty()
  proof_url: string;
}
