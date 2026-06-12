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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { DeclineLeadDto } from './dto/decline-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: AuthenticatedRequest) {
    return this.leadsService.create(dto, req.user.sub);
  }

  @Get('my-created')
  findMyCreated(@Req() req: AuthenticatedRequest) {
    return this.leadsService.findMyCreated(req.user.sub);
  }

  @Get('my-assigned')
  findMyAssigned(@Req() req: AuthenticatedRequest) {
    return this.leadsService.findMyAssigned(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.findOne(id, req.user.sub);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.assign(id, dto, req.user.sub);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.accept(id, req.user.sub);
  }

  @Post(':id/decline')
  decline(
    @Param('id') id: string,
    @Body() dto: DeclineLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.decline(id, dto, req.user.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.updateStatus(id, dto, req.user.sub);
  }
}
