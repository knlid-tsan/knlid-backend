import { IsEnum, IsOptional, IsString, IsNumber, IsPositive } from 'class-validator';
import { LeadStatus } from '../enums/lead-status.enum';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  // обязателен при переводе в closed_success, если для типа лида настроен процентный тариф
  @IsOptional()
  @IsNumber()
  @IsPositive()
  deal_amount?: number;
}
