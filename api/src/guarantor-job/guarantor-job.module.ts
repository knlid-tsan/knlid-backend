import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyMembership } from '../companies/entities/company-membership.entity';
import { Lead } from '../leads/entities/lead.entity';
import { RewardsModule } from '../rewards/rewards.module';
import { LeadsModule } from '../leads/leads.module';
import { GuarantorJobService } from './guarantor-job.service';
import { GuarantorJobController } from './guarantor-job.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyMembership, Lead]),
    RewardsModule,
    LeadsModule,
    AuthModule,
  ],
  providers: [GuarantorJobService],
  controllers: [GuarantorJobController],
  exports: [GuarantorJobService],
})
export class GuarantorJobModule {}
