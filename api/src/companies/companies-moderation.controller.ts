import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CompaniesService } from './companies.service';
import { RejectCompanyDto } from './dto/reject-company.dto';
import { CompanyStatus } from './entities/company.entity';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('moderation/companies')
export class CompaniesModerationController {
  constructor(private companiesService: CompaniesService) {}

  // GET /moderation/companies?status=pending
  @Get()
  list(@Query('status') status?: CompanyStatus) {
    return this.companiesService.listForModeration(status);
  }

  // GET /moderation/companies/:id
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.companiesService.getForModeration(id);
  }

  // POST /moderation/companies/:id/approve
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.approve(id, req.user.sub);
  }

  // POST /moderation/companies/:id/reject
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectCompanyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companiesService.reject(id, dto, req.user.sub);
  }
}
