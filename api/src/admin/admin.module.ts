import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';
import { LeadsModule } from '../leads/leads.module';
import { CitiesModule } from '../cities/cities.module';
import { SettingsModule } from '../settings/settings.module';
import { BanksModule } from '../banks/banks.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, RewardsModule, LeadsModule, CitiesModule, SettingsModule, BanksModule],
  controllers: [AdminController],
})
export class AdminModule {}
