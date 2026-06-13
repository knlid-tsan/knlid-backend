import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NOTIFICATION_PROVIDER } from './notification-provider.interface';
import { ConsoleNotificationProvider } from './providers/console-notification.provider';
import { AuthModule } from '../auth/auth.module';

// Глобальный модуль — NotificationsService доступен во всех модулях без явного импорта
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification]), AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATION_PROVIDER,
      useClass: ConsoleNotificationProvider,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
