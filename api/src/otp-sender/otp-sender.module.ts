import { Global, Module } from '@nestjs/common';
import { OtpSenderService } from './otp-sender.service';
import { ConsoleOtpSenderService } from './console-otp-sender.service';

@Global()
@Module({
  providers: [
    {
      provide: OtpSenderService,
      // При добавлении провайдера: process.env.OTP_SENDER === 'edna' ? EdnaOtpSenderService : ConsoleOtpSenderService
      useClass: ConsoleOtpSenderService,
    },
  ],
  exports: [OtpSenderService],
})
export class OtpSenderModule {}
