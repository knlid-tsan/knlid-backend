import { IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { Specialization } from '../user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  full_name?: string;

  @IsOptional()
  @IsEnum(Specialization)
  specialization?: Specialization;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;
}
