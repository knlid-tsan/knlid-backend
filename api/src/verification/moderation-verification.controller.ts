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
} from '@nestjs/common';
import type { Response } from 'express';
import { resolve } from 'path';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, UserStatus } from '../users/user.entity';
import { VerificationService } from './verification.service';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { Req } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('moderation/verifications')
export class ModerationVerificationController {
  constructor(private verificationService: VerificationService) {}

  // Очередь на проверку (по умолчанию — pending)
  @Get()
  list(@Query('status') status?: string) {
    if (status && status !== UserStatus.PENDING) {
      throw new NotFoundException(`Фильтр status="${status}" не поддерживается`);
    }
    return this.verificationService.listPending();
  }

  // Отдать файл документа
  @Get(':userId/document')
  async getDocument(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const filePath = await this.verificationService.getDocumentPath(userId);
    const absolutePath = resolve(process.cwd(), filePath);
    res.sendFile(absolutePath, (err) => {
      if (err) {
        res.status(404).json({ message: 'Файл не найден на диске' });
      }
    });
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
