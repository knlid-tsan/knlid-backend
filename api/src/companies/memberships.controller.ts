import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CompaniesService } from './companies.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@Controller('memberships')
export class MembershipsController {
  constructor(private companiesService: CompaniesService) {}

  // GET /memberships/my — текущая привязка и история
  @Get('my')
  getMyMemberships(@Req() req: AuthenticatedRequest) {
    return this.companiesService.getMyMemberships(req.user.sub);
  }

  // POST /memberships/:id/leave — разрыв активной связи специалистом
  @Post(':id/leave')
  leaveMembership(@Param('id') membershipId: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.leaveMembership(membershipId, req.user.sub);
  }
}
