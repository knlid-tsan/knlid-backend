import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';
import { RewardTariff } from './entities/reward-tariff.entity';
import { AuthModule } from '../auth/auth.module';
import { DisputesModule } from '../disputes/disputes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, RewardTariff]),
    AuthModule,
    DisputesModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
