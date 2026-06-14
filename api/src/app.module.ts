import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
        City,
        Company,
        CompanyMembership,
        Setting,
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
    CitiesModule,
    CompaniesModule,
    SettingsModule,
    GuarantorJobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
