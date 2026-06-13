import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { LeadType } from '../../leads/enums/lead-type.enum';
import { RewardMethod } from '../../rewards/enums/reward-method.enum';

export class UpsertTariffV2Dto {
  @IsEnum(LeadType)
  lead_type: LeadType;

  // Если не указан — обновляется базовый тариф для типа
  @IsOptional()
  @IsString()
  city?: string;

  @IsEnum(RewardMethod)
  method: RewardMethod;

  @IsNumber()
  @IsPositive()
  value: number;
}
