import { IsBoolean } from 'class-validator';

export class ToggleCityDto {
  @IsBoolean()
  is_active: boolean;
}
