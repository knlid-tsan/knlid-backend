import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class SetRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
