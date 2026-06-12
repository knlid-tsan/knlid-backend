import { IsEnum, IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { DisputeOutcome } from '../enums/dispute-outcome.enum';

export class ResolveDisputeDto {
  @IsEnum(DisputeOutcome)
  outcome: DisputeOutcome;

  @IsOptional()
  @IsString()
  resolution_comment?: string;

  // нужен, если до спора лид ни разу не закрывался и для типа лида настроен процентный тариф
  @IsOptional()
  @IsNumber()
  @IsPositive()
  deal_amount?: number;
}
