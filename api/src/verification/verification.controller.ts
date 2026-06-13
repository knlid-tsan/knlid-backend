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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { VerificationService } from './verification.service';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 МБ

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('identity-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = randomUUID();
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
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

    const ip = (req.ip ?? req.socket?.remoteAddress) || null;
    const user = await this.verificationService.uploadDocument(
      req.user.sub,
      file.path,
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
