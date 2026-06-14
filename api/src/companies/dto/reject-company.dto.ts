import { IsString, Length } from 'class-validator';

export class RejectCompanyDto {
  @IsString()
  @Length(1, 1000)
  reason: string;
}
