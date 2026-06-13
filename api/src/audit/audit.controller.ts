import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AuditService } from './audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  find(
    @Query('entity_id') entityId?: string,
    @Query('actor_id') actorId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.find({ entityId, actorId, action });
  }
}
