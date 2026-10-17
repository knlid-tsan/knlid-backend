import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeadType } from '../../leads/enums/lead-type.enum';

// Редактирование лида админом/модератором: все поля опциональны,
// применяются только переданные
export class AdminUpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadType)
  type?: LeadType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  client_full_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  client_phone?: string;
}
