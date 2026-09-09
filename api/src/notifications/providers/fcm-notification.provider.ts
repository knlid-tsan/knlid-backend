import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { readFileSync } from 'fs';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { NotificationProvider } from '../notification-provider.interface';
import { DeviceToken } from '../device-token.entity';

/**
 * Push через Firebase Cloud Messaging.
 * Ключ сервисного аккаунта — файл по пути FIREBASE_SERVICE_ACCOUNT.
 * Шлёт на все устройства пользователя; мёртвые токены удаляет.
 */
@Injectable()
export class FcmNotificationProvider
  implements NotificationProvider, OnModuleInit
{
  private readonly logger = new Logger('FcmPush');
  private messaging: Messaging | null = null;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokensRepository: Repository<DeviceToken>,
  ) {}

  onModuleInit() {
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!keyPath) {
      this.logger.error(
        'FIREBASE_SERVICE_ACCOUNT не задан — push отправляться не будут',
      );
      return;
    }
    try {
      const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8')) as {
        project_id: string;
      };
      // Провайдер может инстанцироваться несколько раз — firebase-admin
      // допускает лишь один app [DEFAULT], переиспользуем существующий
      const existing = getApps();
      const app: App =
        existing.length > 0
          ? existing[0]
          : initializeApp({ credential: cert(keyPath) });
      this.messaging = getMessaging(app);
      this.logger.log(
        `FCM инициализирован (project: ${serviceAccount.project_id})`,
      );
    } catch (err) {
      this.logger.error(
        `Не удалось инициализировать FCM: ${(err as Error).message}`,
      );
    }
  }

  async send(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<void> {
    if (!this.messaging) return;

    const devices = await this.deviceTokensRepository.findBy({
      user_id: userId,
    });
    if (devices.length === 0) return;

    // FCM data — только строки
    const dataStrings: Record<string, string> = {};
    for (const [k, v] of Object.entries(data ?? {})) {
      if (v !== null && v !== undefined) dataStrings[k] = String(v);
    }

    const response = await this.messaging.sendEachForMulticast({
      tokens: devices.map((d) => d.token),
      notification: { title, body },
      data: dataStrings,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    // Чистим невалидные токены (удалённое приложение, сброс и т.п.)
    const dead: string[] = [];
    response.responses.forEach((r, i) => {
      if (
        !r.success &&
        (r.error?.code === 'messaging/registration-token-not-registered' ||
          r.error?.code === 'messaging/invalid-argument')
      ) {
        dead.push(devices[i].token);
      }
    });
    if (dead.length > 0) {
      await this.deviceTokensRepository.delete({ token: In(dead) });
      this.logger.log(`Удалено мёртвых токенов: ${dead.length}`);
    }

    this.logger.log(
      `Push user ${userId}: ok=${response.successCount}, fail=${response.failureCount}`,
    );
  }
}
