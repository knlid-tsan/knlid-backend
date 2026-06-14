import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CompaniesService } from './companies.service';
import { RegisterCompanyDto } from './dto/register-company.dto';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  // POST /companies/register — публичный, без токена
  @Post('register')
  register(@Body() dto: RegisterCompanyDto) {
    return this.companiesService.register(dto);
  }

  // GET /companies/me — профиль своей компании
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    if (!req.user.company_id) {
      throw new BadRequestException('Аккаунт не привязан к компании');
    }
    return this.companiesService.getMe(req.user.company_id);
  }

  // POST /companies/me/document — загрузка документа юрлица
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @Post('me/document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          cb(null, `company_${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Допустимые форматы: JPG, PNG, PDF'), false);
        }
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('Файл не прикреплён');
    if (!req.user.company_id) throw new BadRequestException('Аккаунт не привязан к компании');

    const company = await this.companiesService.uploadDocument(
      req.user.company_id,
      req.user.sub,
      file.path,
    );

    return {
      message: 'Документ отправлен на модерацию',
      status: company.status,
      document_url: company.document_url,
    };
  }
}
