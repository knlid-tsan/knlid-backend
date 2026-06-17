import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CompaniesService } from './companies.service';
import { RejectCompanyDto } from './dto/reject-company.dto';
import { CompanyStatus } from './entities/company.entity';
import { StorageService } from '../storage/storage.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('moderation/companies')
export class CompaniesModerationController {
  constructor(
    private companiesService: CompaniesService,
    private storageService: StorageService,
  ) {}

  // GET /moderation/companies?status=pending
  @Get()
  list(@Query('status') status?: CompanyStatus) {
    return this.companiesService.listForModeration(status);
  }

  // GET /moderation/companies/:id/document — redirect на URL хранилища
  @Get(':id/document')
  async getDocument(@Param('id') id: string, @Res() res: Response) {
    const company = await this.companiesService.getForModeration(id);
    if (!company.document_url) throw new NotFoundException('Документ не загружен');
    const url = await this.storageService.getUrl(company.document_url);
    if (!url) throw new NotFoundException('Файл не найден');
    res.redirect(url.startsWith('http') ? url : `/${url}`);
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
