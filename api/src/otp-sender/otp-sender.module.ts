import { Global, Logger, Module } from '@nestjs/common';
import { OtpSenderService } from './otp-sender.service';
import { ConsoleOtpSenderService } from './console-otp-sender.service';
import { MobizonOtpSenderService } from './mobizon-otp-sender.service';

@Global()
@Module({
  providers: [
    {
      provide: OtpSenderService,
      useFactory: (): OtpSenderService => {
        const provider = process.env.OTP_PROVIDER || 'console';
        switch (provider) {
          case 'mobizon':
            return new MobizonOtpSenderService();
          case 'console':
            return new ConsoleOtpSenderService();
          default:
            new Logger('OtpSender').warn(
              `Неизвестный OTP_PROVIDER="${provider}" — используется console`,
            );
            return new ConsoleOtpSenderService();
        }
      },
    },
  ],
  exports: [OtpSenderService],
})
export class OtpSenderModule {}
