import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';
import { Client } from './entities/client.entity';
import { LeadStatusHistory } from './entities/lead-status-history.entity';
import { CompanyMembership } from '../companies/entities/company-membership.entity';
import { Company } from '../companies/entities/company.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';
import { DisputesModule } from '../disputes/disputes.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Client, LeadStatusHistory, CompanyMembership, Company]),
    UsersModule,
    AuthModule,
    RewardsModule,
    DisputesModule,
    SettingsModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
