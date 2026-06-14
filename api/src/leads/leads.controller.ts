import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { DeclineLeadDto } from './dto/decline-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { OpenDisputeDto } from '../disputes/dto/open-dispute.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Class-level default: USER only. Methods that also allow admin/moderator override below.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: AuthenticatedRequest) {
    return this.leadsService.create(dto, req.user.sub, req.user.role, req.ip);
  }

  @Get('my-created')
  findMyCreated(@Req() req: AuthenticatedRequest) {
    return this.leadsService.findMyCreated(req.user.sub);
  }

  @Get('my-assigned')
  findMyAssigned(@Req() req: AuthenticatedRequest) {
    return this.leadsService.findMyAssigned(req.user.sub);
  }

  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @Get(':id/tariff')
  getTariff(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.getTariff(id, req.user.sub);
  }

  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.findOne(id, req.user.sub, req.user.role, req.ip);
  }

  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.assign(id, dto, req.user.sub, req.user.role, req.ip);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.accept(id, req.user.sub, req.ip);
  }

  @Post(':id/decline')
  decline(
    @Param('id') id: string,
    @Body() dto: DeclineLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.decline(id, dto, req.user.sub, req.ip);
  }

  @Roles(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.updateStatus(id, dto, req.user.sub, req.ip);
  }

  @Post(':id/dispute')
  openDispute(
    @Param('id') id: string,
    @Body() dto: OpenDisputeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.openDispute(id, dto, req.user.sub, req.ip);
  }
}
