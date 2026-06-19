import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyMembership } from './entities/company-membership.entity';
import { User } from '../users/user.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { OtpCode } from '../auth/otp-code.entity';
import { UserConsent } from '../consents/user-consent.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompaniesModerationController } from './companies-moderation.controller';
import { MembershipsController } from './memberships.controller';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, CompanyMembership, User, Reward, OtpCode, UserConsent]),
    AuthModule,
    RewardsModule,
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController, CompaniesModerationController, MembershipsController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
