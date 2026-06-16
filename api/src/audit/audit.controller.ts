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
    @Query('entity_type') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.auditService.findPaginated({
      entityId,
      actorId,
      action,
      entityType,
      page: pageNum,
      limit: limitNum,
    });
  }
}
