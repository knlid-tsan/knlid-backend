import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, RewardsModule],
  controllers: [AdminController],
})
export class AdminModule {}
