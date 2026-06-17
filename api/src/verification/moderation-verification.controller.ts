import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  NotFoundException,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, UserStatus } from '../users/user.entity';
import { VerificationService } from './verification.service';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { Request } from 'express';
import { StorageService } from '../storage/storage.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('moderation/verifications')
export class ModerationVerificationController {
  constructor(
    private verificationService: VerificationService,
    private storageService: StorageService,
  ) {}

  // Очередь на проверку (по умолчанию — pending)
  @Get()
  async list(@Query('status') status?: string) {
    if (status && status !== UserStatus.PENDING) {
      throw new NotFoundException(`Фильтр status="${status}" не поддерживается`);
    }
    const users = await this.verificationService.listPending();
    return Promise.all(
      users.map(async (u) => ({
        ...u,
        avatar_url: await this.storageService.getUrl(u.avatar_url),
      })),
    );
  }

  // Отдать файл документа (redirect на URL хранилища)
  @Get(':userId/document')
  async getDocument(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const key = await this.verificationService.getDocumentPath(userId);
    const url = await this.storageService.getUrl(key);
    if (!url) throw new NotFoundException('Файл не найден');
    // Absolute URL (S3) — redirect as-is; relative key (local) — make root-relative
    res.redirect(url.startsWith('http') ? url : `/${url}`);
  }

  @Post(':userId/approve')
  approve(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.verificationService.approve(userId, req.user.sub);
  }

  @Post(':userId/reject')
  reject(
    @Param('userId') userId: string,
    @Body() dto: RejectVerificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.verificationService.reject(userId, dto, req.user.sub);
  }
}
