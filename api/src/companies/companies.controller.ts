'use strict';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { MembershipStatus } from './entities/company-membership.entity';
import { CompaniesService } from './companies.service';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { PayDebtDto } from './dto/pay-debt.dto';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Post('register')
  register(@Body() dto: RegisterCompanyDto) {
    return this.companiesService.register(dto);
  }

  // ── Company routes (me/*) — must be before :id ────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.getMe(req.user.company_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          cb(null, `company_${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Допустимые форматы: JPG, PNG, PDF'), false);
        }
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Req() req: AuthenticatedRequest) {
    if (!file) throw new BadRequestException('Файл не прикреплён');
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    const company = await this.companiesService.uploadDocument(req.user.company_id, req.user.sub, file.path);
    return { message: 'Документ отправлен на модерацию', status: company.status, document_url: company.document_url };
  }

  // GET /companies/me/applications?status=pending
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me/applications')
  getApplications(@Req() req: AuthenticatedRequest, @Query('status') status?: MembershipStatus) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.getApplications(req.user.company_id, status);
  }

  // POST /companies/me/applications/:membershipId/approve
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/applications/:membershipId/approve')
  approveMembership(@Param('membershipId') membershipId: string, @Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.approveMembership(membershipId, req.user.company_id, req.user.sub);
  }

  // POST /companies/me/applications/:membershipId/reject
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/applications/:membershipId/reject')
  rejectMembership(@Param('membershipId') membershipId: string, @Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.rejectMembership(membershipId, req.user.company_id, req.user.sub);
  }

  // GET /companies/me/specialists
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me/specialists')
  getSpecialists(@Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.getApplications(req.user.company_id, MembershipStatus.ACTIVE);
  }

  // POST /companies/me/specialists/:membershipId/remove
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/specialists/:membershipId/remove')
  removeSpecialist(@Param('membershipId') membershipId: string, @Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.removeSpecialist(membershipId, req.user.company_id, req.user.sub);
  }

  // GET /companies/me/debts — список долгов к покрытию
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me/debts')
  getDebts(@Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.getDebts(req.user.company_id);
  }

  // POST /companies/me/debts/:rewardId/pay — покрытие долга
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/debts/:rewardId/pay')
  payDebt(
    @Param('rewardId') rewardId: string,
    @Body() dto: PayDebtDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');
    return this.companiesService.payDebt(rewardId, req.user.company_id, dto.proof_url, req.user.sub);
  }

  // ── Specialist routes ─────────────────────────────────────────────────────

  // GET /companies — список активных компаний для выбора
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get()
  listActive() {
    return this.companiesService.listActiveCompanies();
  }

  // POST /companies/:id/apply
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Post(':id/apply')
  apply(@Param('id') companyId: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.apply(companyId, req.user.sub);
  }
}
