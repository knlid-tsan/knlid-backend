import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
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
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

const AVATAR_MIMES = ['image/jpeg', 'image/png'];

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  // GET /users/me — профиль текущего пользователя (включая identity_photo_url для самого пользователя)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOneProfile(req.user.sub);
  }

  // PATCH /users/me/profile — обновить ФИО / специализацию / город
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Patch('me/profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(req.user.sub, dto);
    await this.auditService.log({
      entityType: 'user',
      entityId: req.user.sub,
      action: AuditAction.PROFILE_UPDATED,
      actorId: req.user.sub,
      metadata: dto as Record<string, unknown>,
    });
    return updated;
  }

  // PATCH /users/me/payment — сохранить платёжные реквизиты
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Patch('me/payment')
  updatePayment(@Req() req: AuthenticatedRequest, @Body() dto: UpdatePaymentDto) {
    return this.usersService.updatePayment(req.user.sub, dto);
  }

  // POST /users/me/avatar — загрузить аватар
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (AVATAR_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Допустимые форматы: JPG, PNG'), false);
        }
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('Файл не прикреплён');
    const key = await this.storageService.upload(file, 'avatars');
    return this.usersService.updateAvatar(req.user.sub, key);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
