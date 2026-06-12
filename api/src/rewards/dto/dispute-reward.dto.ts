import { IsString, IsNotEmpty } from 'class-validator';

export class DisputeRewardDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
