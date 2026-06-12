import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
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
import { UpsertTariffDto } from '../rewards/dto/upsert-tariff.dto';
import { RewardsService } from '../rewards/rewards.service';
import { LeadType } from '../leads/enums/lead-type.enum';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('tariffs')
  getTariffs() {
    return this.rewardsService.listTariffs();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('tariffs/:lead_type')
  upsertTariff(
    @Param('lead_type') leadType: string,
    @Body() dto: UpsertTariffDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!Object.values(LeadType).includes(leadType as LeadType)) {
      throw new BadRequestException(`Неизвестный тип лида "${leadType}"`);
    }

    return this.rewardsService.upsertTariff(leadType as LeadType, dto, req.user.sub);
  }
}
