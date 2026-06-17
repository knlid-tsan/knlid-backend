import {
  Controller,
  Get,
  Post,
  Patch,
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
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { StorageService } from '../storage/storage.service';
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
  constructor(
    private readonly leadsService: LeadsService,
    private readonly storageService: StorageService,
  ) {}

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

  // Must be before :id routes to avoid param capture
  @Get('check-duplicate')
  checkDuplicate(
    @Query('type') type: string,
    @Query('phone') phone: string,
  ) {
    return this.leadsService.checkDuplicate(type, phone);
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

  @Post(':id/submit-proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Допустимые форматы: JPG, PNG, WebP, PDF'), false);
        }
      },
    }),
  )
  async submitProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('Файл не прикреплён');
    const key = await this.storageService.upload(file, 'proofs');
    return this.leadsService.submitProof(id, req.user.sub, key, req.ip);
  }

  @Post(':id/confirm-payment')
  confirmPayment(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.confirmPayment(id, req.user.sub, req.ip);
  }
}
