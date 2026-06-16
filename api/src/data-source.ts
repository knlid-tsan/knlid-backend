import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { OtpCode } from './auth/otp-code.entity';
import { Lead } from './leads/entities/lead.entity';
import { Client } from './leads/entities/client.entity';
import { LeadStatusHistory } from './leads/entities/lead-status-history.entity';
import { RewardTariff } from './rewards/entities/reward-tariff.entity';
import { Reward } from './rewards/entities/reward.entity';
import { Dispute } from './disputes/entities/dispute.entity';
import { AuditLog } from './audit/audit-log.entity';
import { Notification } from './notifications/notification.entity';
import { City } from './cities/city.entity';
import { Company } from './companies/entities/company.entity';
import { CompanyMembership } from './companies/entities/company-membership.entity';
import { Setting } from './settings/setting.entity';
import { Conversation } from './support/entities/conversation.entity';
import { Message } from './support/entities/message.entity';

export const AppDataSource = new DataSource({
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
    Conversation,
    Message,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
