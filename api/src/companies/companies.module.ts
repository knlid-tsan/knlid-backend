import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyMembership } from './entities/company-membership.entity';
import { User } from '../users/user.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompaniesModerationController } from './companies-moderation.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, CompanyMembership, User]),
    AuthModule,
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController, CompaniesModerationController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
