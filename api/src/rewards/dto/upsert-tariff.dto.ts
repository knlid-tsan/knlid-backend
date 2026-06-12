import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { RewardMethod } from '../enums/reward-method.enum';

export class UpsertTariffDto {
  @IsEnum(RewardMethod)
  method: RewardMethod;

  @IsNumber()
  @IsPositive()
  value: number;
}
