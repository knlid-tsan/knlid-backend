import { IsString, IsNotEmpty } from 'class-validator';

export class BootstrapAdminDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  secret: string;
}
