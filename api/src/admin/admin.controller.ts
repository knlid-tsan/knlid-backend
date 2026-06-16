import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { BanksService } from '../banks/banks.service';
import { CreateBankDto } from '../banks/dto/create-bank.dto';
import { UpdateBankDto } from '../banks/dto/update-bank.dto';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { UpsertTariffV2Dto } from './dto/upsert-tariff-v2.dto';
import { UsersService } from '../users/users.service';
import { RewardsService } from '../rewards/rewards.service';
import { LeadsService } from '../leads/leads.service';
import { CompaniesService } from '../companies/companies.service';
import { AdminCreateCompanyDto } from './dto/admin-create-company.dto';
import { CitiesService } from '../cities/cities.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { CreateCityDto } from '../cities/dto/create-city.dto';
import { ToggleCityDto } from '../cities/dto/toggle-city.dto';
import { AdminLeadsQueryDto } from './dto/admin-leads-query.dto';
import { AdminClientsQueryDto } from './dto/admin-clients-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { SetRoleDto } from './dto/set-role.dto';
import { UpdatePaymentDeadlineDto } from './dto/update-payment-deadline.dto';
import { BOOTSTRAP_ADMIN_SECRET } from './constants';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private rewardsService: RewardsService,
    private leadsService: LeadsService,
    private citiesService: CitiesService,
    private settingsService: SettingsService,
    private auditService: AuditService,
    private banksService: BanksService,
    private companiesService: CompaniesService,
    private dataSource: DataSource,
  ) {}

  // POST /admin/bootstrap-admin — назначить первого админа по секретному ключу
  @Post('bootstrap-admin')
  async bootstrapAdmin(@Body() dto: BootstrapAdminDto) {
    if (dto.secret !== BOOTSTRAP_ADMIN_SECRET) {
      throw new UnauthorizedException('Неверный секретный ключ');
    }

    const user = await this.usersRepository.findOneBy({ phone: dto.phone });
    if (!user) {
      throw new NotFoundException('Пользователь с таким телефоном не найден');
    }

    user.role = UserRole.ADMIN;
    await this.usersRepository.save(user);

    return { id: user.id, phone: user.phone, role: user.role };
  }

  // ─── Тарифы ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('tariffs')
  getTariffs() {
    return this.rewardsService.listTariffsGrouped();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('tariffs')
  upsertTariff(@Body() dto: UpsertTariffV2Dto, @Req() req: AuthenticatedRequest) {
    return this.rewardsService.upsertTariff(dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('tariffs/:id')
  async deleteTariff(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const tariff = await this.rewardsService.getTariffById(id);

    if (tariff.city === null) {
      const hasActive = await this.leadsService.hasActiveLeadsOfType(tariff.lead_type);
      if (hasActive) {
        throw new BadRequestException(
          `Нельзя удалить базовый тариф "${tariff.lead_type}": есть активные лиды этого типа. Сначала закройте или переведите их.`,
        );
      }
    }

    return this.rewardsService.deleteTariff(id, req.user.sub);
  }

  // ─── Города ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('cities')
  createCity(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('cities/:id')
  toggleCity(@Param('id') id: string, @Body() dto: ToggleCityDto) {
    return this.citiesService.toggle(id, dto);
  }

  // ─── Клиенты ──────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('clients')
  adminClients(@Query() query: AdminClientsQueryDto) {
    return this.leadsService.adminFindClients(
      { search: query.search },
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  // ─── Пользователи ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('users')
  async adminUsers(@Query() query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC');

    if (query.status) qb.andWhere('user.status = :status', { status: query.status });
    if (query.specialization) qb.andWhere('user.specialization = :spec', { spec: query.specialization });
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.city) qb.andWhere('user.city ILIKE :city', { city: `%${query.city}%` });
    if (query.search) {
      qb.andWhere('(user.full_name ILIKE :search OR user.phone ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = users.map(({ identity_photo_url: _, ...u }) => u);
    return { data, total, page, limit };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('users/:id')
  async adminUser(@Param('id') id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const [statsRow] = await this.dataSource.query<
      [{ leads_created: number; leads_assigned: number; leads_closed: number }]
    >(
      `SELECT
        COUNT(CASE WHEN author_id = $1 THEN 1 END)::int          AS leads_created,
        COUNT(CASE WHEN executor_id = $1::uuid THEN 1 END)::int  AS leads_assigned,
        COUNT(CASE WHEN executor_id = $1::uuid AND status = 'closed_success' THEN 1 END)::int AS leads_closed
      FROM leads`,
      [id],
    );

    const recentActions = await this.auditService.findByUser(id, 20);

    const { identity_photo_url: _, ...userFields } = user;
    return {
      ...userFields,
      stats: {
        leads_created: statsRow.leads_created,
        leads_assigned: statsRow.leads_assigned,
        leads_closed: statsRow.leads_closed,
      },
      recent_actions: recentActions,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('users/:id/block')
  async blockUser(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (id === req.user.sub) {
      throw new BadRequestException('Нельзя заблокировать собственный аккаунт');
    }
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.status = UserStatus.BLOCKED;
    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: id,
      action: AuditAction.USER_BLOCKED,
      actorId: req.user.sub,
    });

    return { id, status: user.status };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('users/:id/unblock')
  async unblockUser(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.status = UserStatus.ACTIVE;
    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: id,
      action: AuditAction.USER_UNBLOCKED,
      actorId: req.user.sub,
    });

    return { id, status: user.status };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('users/:id/role')
  async setUserRole(
    @Param('id') id: string,
    @Body() dto: SetRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (id === req.user.sub) {
      throw new BadRequestException('Нельзя изменить собственную роль');
    }
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const prevRole = user.role;
    user.role = dto.role;
    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: id,
      action: AuditAction.USER_ROLE_CHANGED,
      actorId: req.user.sub,
      metadata: { from: prevRole, to: dto.role },
    });

    return { id, role: user.role };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('users/:id/request-reverification')
  async requestReverification(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.verification_attempts = 0;
    user.verification_blocked_until = null;
    if (user.status === UserStatus.ACTIVE) {
      user.status = UserStatus.NEW;
    }
    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: id,
      action: AuditAction.USER_REVERIFICATION_REQUESTED,
      actorId: req.user.sub,
    });

    return { id, status: user.status };
  }

  // ─── Настройки ────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('settings/payment-deadline')
  async getPaymentDeadline() {
    const days = await this.settingsService.getPaymentDeadlineDays();
    return { key: 'payment_deadline_days', value: days };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('settings/payment-deadline')
  async setPaymentDeadline(@Body() dto: UpdatePaymentDeadlineDto, @Req() req: AuthenticatedRequest) {
    return this.settingsService.setPaymentDeadlineDays(dto.days, req.user.sub);
  }

  // ─── Лиды ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('leads')
  adminLeads(@Query() query: AdminLeadsQueryDto) {
    return this.leadsService.adminFindAll(
      { status: query.status, type: query.type, city: query.city },
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('leads/:id')
  adminLead(@Param('id') id: string) {
    return this.leadsService.adminFindOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('leads/:id/candidates')
  adminLeadCandidates(@Param('id') id: string) {
    return this.leadsService.adminFindCandidates(id);
  }

  // ─── Аватар пользователя (модератор/админ) ───────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('users/:id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Допустимые форматы: JPG, PNG'), false);
        }
      },
    }),
  )
  async moderatorUploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл не прикреплён');
    return this.usersService.moderatorSetAvatar(id, file.path);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Delete('users/:id/avatar')
  moderatorRemoveAvatar(@Param('id') id: string) {
    return this.usersService.moderatorRemoveAvatar(id);
  }

  // ─── Банки ────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('banks')
  listBanks() {
    return this.banksService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('banks')
  createBank(@Body() dto: CreateBankDto) {
    return this.banksService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('banks/:id')
  updateBank(@Param('id') id: string, @Body() dto: UpdateBankDto) {
    return this.banksService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('banks/:id')
  deleteBank(@Param('id') id: string) {
    return this.banksService.remove(id);
  }

  // ─── Создание компании модератором/админом ────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('companies')
  createCompany(
    @Body() dto: AdminCreateCompanyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.companiesService.adminCreateCompany(
      { name: dto.name, phone: dto.phone, city: dto.city },
      req.user.sub,
    );
  }

  // ─── Привязка к компании (модератор) ─────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('users/:id/membership')
  getUserMembership(@Param('id') id: string) {
    return this.companiesService.getUserMembership(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('users/:id/membership/assign')
  async moderatorAssignMembership(
    @Param('id') id: string,
    @Body('company_id') companyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!companyId) throw new BadRequestException('company_id обязателен');
    return this.companiesService.moderatorAssignMembership(id, companyId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Delete('users/:id/membership')
  async moderatorRemoveMembership(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.companiesService.moderatorRemoveMembership(id, req.user.sub);
    return { ok: true };
  }
}
