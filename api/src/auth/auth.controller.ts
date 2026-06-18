import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';

@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/request-otp — запросить код подтверждения
  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    return this.authService.requestOtp(dto.phone);
  }

  // POST /auth/confirm-phone — проверить OTP и продлить TTL (шаг перед формой регистрации)
  @Post('confirm-phone')
  confirmPhone(@Body() dto: VerifyOtpDto): Promise<{ ok: true }> {
    return this.authService.confirmPhone(dto);
  }

  // POST /auth/verify-otp — войти (только существующий пользователь)
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ access_token: string }> {
    return this.authService.verifyOtp(dto);
  }

  // POST /auth/register — зарегистрировать нового специалиста
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ access_token: string }> {
    return this.authService.registerUser(dto);
  }
}
