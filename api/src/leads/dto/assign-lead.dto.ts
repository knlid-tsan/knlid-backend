import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class AssignLeadDto {
  @IsUUID()
  executor_id: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
