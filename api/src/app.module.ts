import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from './storage/storage.module';
import { OtpSenderModule } from './otp-sender/otp-sender.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { CitiesModule } from './cities/cities.module';
import { City } from './cities/city.entity';
import { CompaniesModule } from './companies/companies.module';
import { Company } from './companies/entities/company.entity';
import { CompanyMembership } from './companies/entities/company-membership.entity';
import { Setting } from './settings/setting.entity';
import { SettingsModule } from './settings/settings.module';
import { GuarantorJobModule } from './guarantor-job/guarantor-job.module';
import { BanksModule } from './banks/banks.module';
import { Bank } from './banks/bank.entity';
import { SupportModule } from './support/support.module';
import { Conversation } from './support/entities/conversation.entity';
import { Message } from './support/entities/message.entity';
import { UserConsent } from './consents/user-consent.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // 1 minute window
        limit: 120,    // 120 req / min per IP — global flood protection
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,     // 10 req / min per IP on /auth/* routes
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host:     process.env.DB_HOST     || 'localhost',
      port:     Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'evgenykobiliastsky',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'knlid_dev',
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
        City,
        Company,
        CompanyMembership,
        Setting,
        Bank,
        Conversation,
        Message,
        UserConsent,
      ],
      synchronize: false,
    }),
    // Глобальные модули регистрируем первыми
    StorageModule,
    OtpSenderModule,
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
    CitiesModule,
    CompaniesModule,
    SettingsModule,
    GuarantorJobModule,
    BanksModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
