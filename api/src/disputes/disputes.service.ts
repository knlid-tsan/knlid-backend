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
import { Reward } from '../rewards/entities/reward.entity';
import { RewardTariff } from '../rewards/entities/reward-tariff.entity';
import { RewardMethod } from '../rewards/enums/reward-method.enum';
import { RewardStatus } from '../rewards/enums/reward-status.enum';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/user.entity';

// Статусы, для которых спор открыть нельзя — лид уже окончательно закрыт без возможности пересмотра
const NON_DISPUTABLE_STATUSES = [LeadStatus.CANCELLED, LeadStatus.ARCHIVED];

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
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

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

    const dispute = await this.disputesRepository.save(
      this.disputesRepository.create({
        lead_id: lead.id,
        opened_by: userId,
        reason,
        status: DisputeStatus.OPEN,
      }),
    );

    // Уведомляем вторую сторону лида о споре
    const otherPartyId =
      lead.author_id === userId ? lead.executor_id : lead.author_id;
    if (otherPartyId) {
      await this.notificationsService.send(
        otherPartyId,
        'Открыт спор',
        `По лиду открыт спор. Причина: ${reason}`,
        { lead_id: lead.id, dispute_id: dispute.id, action: 'dispute_opened' },
      );
    }

    // Уведомляем всех модераторов
    const moderators = await this.usersRepository.find({
      where: [{ role: UserRole.MODERATOR }, { role: UserRole.ADMIN }],
    });
    for (const mod of moderators) {
      if (mod.id !== userId) {
        await this.notificationsService.send(
          mod.id,
          'Новый спор',
          `Открыт спор по лиду. Причина: ${reason}`,
          { lead_id: lead.id, dispute_id: dispute.id, action: 'dispute_opened' },
        );
      }
    }

    return dispute;
  }

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

  async resolve(
    disputeId: string,
    dto: ResolveDisputeDto,
    moderatorId: string,
    ip?: string,
  ) {
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
      reward = await this.createRewardForLead(lead, dto.deal_amount);
    }

    await this.auditService.log({
      entityType: 'dispute',
      entityId: disputeId,
      action: AuditAction.DISPUTE_RESOLVED,
      actorId: moderatorId,
      ip: ip ?? null,
      metadata: {
        outcome: dto.outcome,
        lead_id: lead.id,
        resolution_comment: dto.resolution_comment ?? null,
      },
    });

    // Уведомляем обе стороны лида о решении
    for (const userId of [lead.author_id, lead.executor_id].filter(Boolean)) {
      await this.notificationsService.send(
        userId!,
        'Спор решён',
        `Решение: "${outcomeStatus}". ${dto.resolution_comment ?? ''}`,
        { dispute_id: disputeId, lead_id: lead.id, outcome: dto.outcome, action: 'dispute_resolved' },
      );
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
