import { IsUUID } from 'class-validator';

export class AssignLeadDto {
  @IsUUID()
  executor_id: string;
}
