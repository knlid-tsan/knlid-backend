import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { OtpCode } from './auth/otp-code.entity';
import { LeadsModule } from './leads/leads.module';
import { Lead } from './leads/entities/lead.entity';
import { Client } from './leads/entities/client.entity';
import { LeadStatusHistory } from './leads/entities/lead-status-history.entity';
import { RewardsModule } from './rewards/rewards.module';
import { RewardTariff } from './rewards/entities/reward-tariff.entity';
import { Reward } from './rewards/entities/reward.entity';
import { DisputesModule } from './disputes/disputes.module';
import { Dispute } from './disputes/entities/dispute.entity';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/audit-log.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/notification.entity';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'evgenykobiliastsky',
      password: '',
      database: 'knlid_dev',
      entities: [
        User,
        OtpCode,
        Lead,
        Client,
        LeadStatusHistory,
        RewardTariff,
        Reward,
        Dispute,
        AuditLog,
        Notification,
      ],
      synchronize: true,
    }),
    // Глобальные модули регистрируем первыми
    AuditModule,
    NotificationsModule,
    // Остальные модули
    UsersModule,
    AuthModule,
    LeadsModule,
    RewardsModule,
    DisputesModule,
    AdminModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
