import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { VerificationService } from './verification.service';
import { StorageService } from '../storage/storage.service';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 МБ

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@Controller('users/me')
export class VerificationController {
  constructor(
    private verificationService: VerificationService,
    private storageService: StorageService,
  ) {}

  @Post('identity-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Допустимые форматы: JPG, PNG, PDF',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не прикреплён');
    }

    const key = await this.storageService.upload(file, 'identity');
    const ip = (req.ip ?? req.socket?.remoteAddress) || null;
    const user = await this.verificationService.uploadDocument(
      req.user.sub,
      key,
      ip,
    );

    return {
      id: user.id,
      status: user.status,
      verification_attempts: user.verification_attempts,
      message: 'Документ загружен, ожидайте проверки',
    };
  }
}
