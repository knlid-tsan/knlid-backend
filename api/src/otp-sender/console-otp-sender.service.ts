import { Injectable, Logger } from '@nestjs/common';
import { OtpSenderService } from './otp-sender.service';

@Injectable()
export class ConsoleOtpSenderService extends OtpSenderService {
  private readonly logger = new Logger('OtpSender');

  async send(phone: string, code: string): Promise<void> {
    this.logger.log(`OTP для ${phone}: ${code} (действует 5 мин)`);
  }
}
