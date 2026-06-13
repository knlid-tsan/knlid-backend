import { IsEnum, IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { LeadStatus } from '../enums/lead-status.enum';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  // Комиссия исполнителя по сделке (₸). Обязательна при closed_success для percent-тарифа.
  // Вознаграждение автора = commission_amount × tariff.value / 100
  @IsOptional()
  @IsNumber()
  @IsPositive()
  commission_amount?: number;
}
