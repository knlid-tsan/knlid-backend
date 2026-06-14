import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { OtpCode } from './otp-code.entity';
import { UsersService } from '../users/users.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';

const OTP_TTL_MINUTES = 5;
const OTP_REQUEST_LIMIT = 3;
const OTP_REQUEST_WINDOW_MINUTES = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(OtpCode)
    private otpCodesRepository: Repository<OtpCode>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async requestOtp(phone: string): Promise<{ message: string }> {
    const windowStart = new Date(
      Date.now() - OTP_REQUEST_WINDOW_MINUTES * 60 * 1000,
    );
    const recentRequests = await this.otpCodesRepository.count({
      where: { phone, created_at: MoreThan(windowStart) },
    });

    if (recentRequests >= OTP_REQUEST_LIMIT) {
      throw new HttpException(
        `Слишком много запросов кода. Попробуйте через ${OTP_REQUEST_WINDOW_MINUTES} минут`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const otp = this.otpCodesRepository.create({ phone, code, expires_at });
    await this.otpCodesRepository.save(otp);

    this.logger.log(`OTP для ${phone}: ${code} (действует ${OTP_TTL_MINUTES} мин)`);

    return { message: 'Код отправлен' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ access_token: string }> {
    const otp = await this.otpCodesRepository.findOne({
      where: { phone: dto.phone, code: dto.code },
      order: { created_at: 'DESC' },
    });

    if (!otp) {
      throw new UnauthorizedException('Неверный код');
    }

    if (otp.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Код истёк, запросите новый');
    }

    let user = await this.usersService.findByPhone(dto.phone);
    let isNewUser = false;

    if (!user) {
      if (!dto.full_name || !dto.specialization || !dto.city) {
        throw new BadRequestException(
          'Для регистрации нужны full_name, specialization и city',
        );
      }

      user = await this.usersService.create({
        phone: dto.phone,
        full_name: dto.full_name,
        specialization: dto.specialization,
        city: dto.city,
      });
      isNewUser = true;
    }

    await this.otpCodesRepository.delete({ phone: dto.phone });

    if (isNewUser) {
      await this.auditService.log({
        entityType: 'user',
        entityId: user.id,
        action: AuditAction.USER_REGISTERED,
        actorId: user.id,
        metadata: { phone: user.phone, specialization: user.specialization },
      });
    }

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
      ...(user.company_id ? { company_id: user.company_id } : {}),
    });

    return { access_token };
  }
}
