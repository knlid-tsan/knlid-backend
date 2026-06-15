import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/request-otp — запросить код подтверждения
  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    return this.authService.requestOtp(dto.phone);
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
