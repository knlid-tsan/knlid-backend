import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  Equals,
  ValidateNested,
} from 'class-validator';
import { LeadType } from '../enums/lead-type.enum';

class CreateLeadClientDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}

export class CreateLeadDto {
  @IsEnum(LeadType)
  type: LeadType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @ValidateNested()
  @Type(() => CreateLeadClientDto)
  client: CreateLeadClientDto;

  @IsBoolean()
  @Equals(true, { message: 'Необходимо подтвердить согласие клиента на передачу контактных данных' })
  client_consent_confirmed: boolean;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
