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
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { UpsertTariffV2Dto } from './dto/upsert-tariff-v2.dto';
import { RewardsService } from '../rewards/rewards.service';
import { LeadsService } from '../leads/leads.service';
import { CitiesService } from '../cities/cities.service';
import { CreateCityDto } from '../cities/dto/create-city.dto';
import { ToggleCityDto } from '../cities/dto/toggle-city.dto';
import { AdminLeadsQueryDto } from './dto/admin-leads-query.dto';
import { BOOTSTRAP_ADMIN_SECRET } from './constants';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rewardsService: RewardsService,
    private leadsService: LeadsService,
    private citiesService: CitiesService,
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
}
