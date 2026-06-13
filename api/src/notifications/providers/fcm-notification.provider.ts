import { Injectable } from '@nestjs/common';
import { NotificationProvider } from '../notification-provider.interface';

// TODO: подключить Firebase Cloud Messaging — инициализация admin SDK,
// отправка push через messaging().send() по device token пользователя
@Injectable()
export class FcmNotificationProvider implements NotificationProvider {
  async send(
    _userId: string,
    _title: string,
    _body: string,
    _data?: Record<string, unknown> | null,
  ): Promise<void> {
    // TODO: реализовать после подключения Firebase
  }
}
