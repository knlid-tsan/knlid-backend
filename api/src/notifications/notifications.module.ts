import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { DeviceToken } from './device-token.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NOTIFICATION_PROVIDER } from './notification-provider.interface';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import { FcmNotificationProvider } from './providers/fcm-notification.provider';
import { AuthModule } from '../auth/auth.module';

// Глобальный модуль — NotificationsService доступен во всех модулях без явного импорта
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DeviceToken]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ConsoleNotificationProvider,
    FcmNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      // console (лог, dev) | fcm (боевой push через Firebase)
      useFactory: (
        consoleProvider: ConsoleNotificationProvider,
        fcmProvider: FcmNotificationProvider,
      ) =>
        process.env.NOTIFICATIONS_PROVIDER === 'fcm'
          ? fcmProvider
          : consoleProvider,
      inject: [ConsoleNotificationProvider, FcmNotificationProvider],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
