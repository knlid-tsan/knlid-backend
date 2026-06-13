import { Injectable, Logger } from '@nestjs/common';
import { NotificationProvider } from '../notification-provider.interface';

@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async send(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<void> {
    this.logger.log(
      `Push -> user ${userId}: "${title}" — ${body}${data ? ` ${JSON.stringify(data)}` : ''}`,
    );
  }
}
