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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdatePaymentDto } from './dto/update-payment.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

const AVATAR_MIMES = ['image/jpeg', 'image/png'];

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me — профиль текущего пользователя (включая identity_photo_url для самого пользователя)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOneProfile(req.user.sub);
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
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
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
    return this.usersService.updateAvatar(req.user.sub, file.path);
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
