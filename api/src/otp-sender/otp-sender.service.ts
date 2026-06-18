export abstract class OtpSenderService {
  abstract send(phone: string, code: string): Promise<void>;
}
