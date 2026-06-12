import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationController } from './moderation.controller';
import { DisputesService } from './disputes.service';
import { Dispute } from './entities/dispute.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadStatusHistory } from '../leads/entities/lead-status-history.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { RewardTariff } from '../rewards/entities/reward-tariff.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispute, Lead, LeadStatusHistory, Reward, RewardTariff]),
    AuthModule,
  ],
  controllers: [ModerationController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
