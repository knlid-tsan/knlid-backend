import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute } from './entities/dispute.entity';
import { DisputeStatus } from './enums/dispute-status.enum';
import { DisputeOutcome } from './enums/dispute-outcome.enum';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Lead } from '../leads/entities/lead.entity';
import { LeadStatusHistory } from '../leads/entities/lead-status-history.entity';
import { LeadStatus } from '../leads/enums/lead-status.enum';

// Статусы, для которых спор открыть нельзя — лид уже окончательно закрыт без возможности пересмотра
const NON_DISPUTABLE_STATUSES = [LeadStatus.CANCELLED, LeadStatus.ARCHIVED];
import { Reward } from '../rewards/entities/reward.entity';
import { RewardTariff } from '../rewards/entities/reward-tariff.entity';
import { RewardMethod } from '../rewards/enums/reward-method.enum';
import { RewardStatus } from '../rewards/enums/reward-status.enum';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private disputesRepository: Repository<Dispute>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(LeadStatusHistory)
    private historyRepository: Repository<LeadStatusHistory>,
    @InjectRepository(Reward)
    private rewardsRepository: Repository<Reward>,
    @InjectRepository(RewardTariff)
    private tariffsRepository: Repository<RewardTariff>,
  ) {}

  // Открывает спор по лиду: создаёт Dispute, переводит лид в статус dispute
  // и помечает связанное вознаграждение (если есть) как disputed.
  async openForLead(lead: Lead, reason: string, userId: string): Promise<Dispute> {
    if (lead.status === LeadStatus.DISPUTE) {
      throw new BadRequestException('Спор по этому лиду уже открыт');
    }

    if (NON_DISPUTABLE_STATUSES.includes(lead.status)) {
      throw new BadRequestException(
        `Нельзя открыть спор для лида в статусе "${lead.status}"`,
      );
    }

    const from = lead.status;
    lead.status = LeadStatus.DISPUTE;
    await this.leadsRepository.save(lead);

    await this.historyRepository.save(
      this.historyRepository.create({
        lead_id: lead.id,
        from_status: from,
        to_status: LeadStatus.DISPUTE,
        changed_by: userId,
        comment: reason,
      }),
    );

    const reward = await this.rewardsRepository.findOneBy({ lead_id: lead.id });
    if (reward) {
      reward.status = RewardStatus.DISPUTED;
      await this.rewardsRepository.save(reward);
    }

    return this.disputesRepository.save(
      this.disputesRepository.create({
        lead_id: lead.id,
        opened_by: userId,
        reason,
        status: DisputeStatus.OPEN,
      }),
    );
  }

  // Открывает спор по вознаграждению — проверяет права через Reward, дальше делегирует в openForLead.
  async openForReward(reward: Reward, reason: string, userId: string): Promise<Dispute> {
    if (reward.author_id !== userId && reward.executor_id !== userId) {
      throw new ForbiddenException('Нет доступа к этому вознаграждению');
    }

    if (reward.status === RewardStatus.DISPUTED) {
      throw new BadRequestException('Спор по этому вознаграждению уже открыт');
    }

    const lead = await this.leadsRepository.findOneBy({ id: reward.lead_id });
    if (!lead) {
      throw new NotFoundException('Лид не найден');
    }

    return this.openForLead(lead, reason, userId);
  }

  async list(status?: DisputeStatus): Promise<Dispute[]> {
    return this.disputesRepository.find({
      where: status ? { status } : {},
      order: { created_at: 'DESC' },
    });
  }

  async getDetail(disputeId: string) {
    const dispute = await this.getDisputeOrFail(disputeId);

    const lead = await this.leadsRepository.findOne({
      where: { id: dispute.lead_id },
      relations: { client: true },
    });

    const history = await this.historyRepository.find({
      where: { lead_id: dispute.lead_id },
      order: { created_at: 'ASC' },
    });

    const reward = await this.rewardsRepository.findOneBy({ lead_id: dispute.lead_id });

    return { dispute, lead, history, reward };
  }

  async resolve(disputeId: string, dto: ResolveDisputeDto, moderatorId: string) {
    const dispute = await this.getDisputeOrFail(disputeId);

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Спор уже закрыт');
    }

    const lead = await this.leadsRepository.findOneBy({ id: dispute.lead_id });
    if (!lead) {
      throw new NotFoundException('Лид не найден');
    }

    const outcomeStatus =
      dto.outcome === DisputeOutcome.CLOSED_SUCCESS
        ? LeadStatus.CLOSED_SUCCESS
        : LeadStatus.CANCELLED;

    const from = lead.status;
    lead.status = outcomeStatus;
    lead.closed_at = new Date();
    await this.leadsRepository.save(lead);

    await this.historyRepository.save(
      this.historyRepository.create({
        lead_id: lead.id,
        from_status: from,
        to_status: outcomeStatus,
        changed_by: moderatorId,
        comment: dto.resolution_comment ?? null,
      }),
    );

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution_comment = dto.resolution_comment ?? null;
    dispute.resolved_by = moderatorId;
    dispute.resolved_at = new Date();
    await this.disputesRepository.save(dispute);

    let reward = await this.rewardsRepository.findOneBy({ lead_id: lead.id });

    if (reward) {
      if (reward.status === RewardStatus.DISPUTED) {
        reward.status =
          outcomeStatus === LeadStatus.CLOSED_SUCCESS
            ? RewardStatus.AWAITING_PAYMENT
            : RewardStatus.CANCELLED;
        await this.rewardsRepository.save(reward);
      }
    } else if (outcomeStatus === LeadStatus.CLOSED_SUCCESS) {
      // Спор был открыт до того, как лид впервые дошёл до closed_success — создаём Reward сейчас.
      reward = await this.createRewardForLead(lead, dto.deal_amount);
    }

    return { dispute, lead, reward };
  }

  private async createRewardForLead(lead: Lead, dealAmount?: number): Promise<Reward> {
    const tariff = await this.tariffsRepository.findOneBy({ lead_type: lead.type });

    let method: RewardMethod | null = null;
    let value: string | null = null;
    let amount: number | null = null;
    let dealAmountToStore: number | null = dealAmount ?? null;

    if (tariff) {
      method = tariff.method;
      value = tariff.value;

      if (tariff.method === RewardMethod.PERCENT) {
        if (dealAmount != null) {
          amount = (dealAmount * Number(tariff.value)) / 100;
          dealAmountToStore = dealAmount;
        }
      } else {
        amount = Number(tariff.value);
      }
    }

    return this.rewardsRepository.save(
      this.rewardsRepository.create({
        lead_id: lead.id,
        author_id: lead.author_id,
        executor_id: lead.executor_id!,
        method,
        value,
        deal_amount: dealAmountToStore !== null ? String(dealAmountToStore) : null,
        amount: amount !== null ? String(amount) : null,
        status: amount !== null ? RewardStatus.AWAITING_PAYMENT : RewardStatus.PENDING,
      }),
    );
  }

  private async getDisputeOrFail(disputeId: string): Promise<Dispute> {
    const dispute = await this.disputesRepository.findOneBy({ id: disputeId });
    if (!dispute) {
      throw new NotFoundException('Спор не найден');
    }
    return dispute;
  }
}
