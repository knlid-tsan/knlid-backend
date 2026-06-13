import { IsEnum, IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { DisputeOutcome } from '../enums/dispute-outcome.enum';

export class ResolveDisputeDto {
  @IsEnum(DisputeOutcome)
  outcome: DisputeOutcome;

  @IsOptional()
  @IsString()
  resolution_comment?: string;

  // Комиссия исполнителя по сделке (₸). Обязательна для percent-тарифа при outcome closed_success.
  @IsOptional()
  @IsNumber()
  @IsPositive()
  commission_amount?: number;
}
