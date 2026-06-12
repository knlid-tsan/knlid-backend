import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '../enums/lead-status.enum';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
