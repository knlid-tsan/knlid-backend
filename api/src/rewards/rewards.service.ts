import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { RewardTariff } from './entities/reward-tariff.entity';
import { RewardMethod } from './enums/reward-method.enum';
import { RewardStatus } from './enums/reward-status.enum';
import { UpsertTariffDto } from './dto/upsert-tariff.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { DisputeRewardDto } from './dto/dispute-reward.dto';
import { Lead } from '../leads/entities/lead.entity';
import { LeadType } from '../leads/enums/lead-type.enum';
import { DisputesService } from '../disputes/disputes.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private rewardsRepository: Repository<Reward>,
    @InjectRepository(RewardTariff)
    private tariffsRepository: Repository<RewardTariff>,
    private disputesService: DisputesService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async listTariffs(): Promise<RewardTariff[]> {
    return this.tariffsRepository.find();
  }

  async upsertTariff(
    leadType: LeadType,
    dto: UpsertTariffDto,
    adminId: string,
  ): Promise<RewardTariff> {
    let tariff = await this.tariffsRepository.findOneBy({ lead_type: leadType });

    if (!tariff) {
      tariff = this.tariffsRepository.create({ lead_type: leadType });
    }

    tariff.method = dto.method;
    tariff.value = String(dto.value);
    tariff.updated_by = adminId;

    return this.tariffsRepository.save(tariff);
  }

  async getTariff(leadType: LeadType): Promise<RewardTariff | null> {
    return this.tariffsRepository.findOneBy({ lead_type: leadType });
  }

  getForLead(leadId: string): Promise<Reward | null> {
    return this.rewardsRepository.findOneBy({ lead_id: leadId });
  }

  // commissionAmount — комиссия исполнителя по сделке; обязательна для percent-тарифа
  validateCommissionAmount(tariff: RewardTariff | null, commissionAmount?: number): void {
    if (
      tariff?.method === RewardMethod.PERCENT &&
      (commissionAmount === undefined || commissionAmount === null)
    ) {
      throw new BadRequestException(
        'Для процентного тарифа необходимо указать commission_amount (комиссию исполнителя)',
      );
    }
  }

  async createForLead(lead: Lead, commissionAmount?: number): Promise<Reward> {
    const tariff = await this.getTariff(lead.type);

    let method: RewardMethod | null = null;
    let value: string | null = null;
    let amount: number | null = null;
    let status = RewardStatus.PENDING;
    let commissionToStore = commissionAmount ?? null;

    if (tariff) {
      method = tariff.method;
      value = tariff.value;

      if (tariff.method === RewardMethod.PERCENT) {
        // reward автора = комиссия исполнителя × процент тарифа
        amount = (commissionAmount! * Number(tariff.value)) / 100;
        commissionToStore = commissionAmount!;
      } else {
        amount = Number(tariff.value);
      }

      status = RewardStatus.AWAITING_PAYMENT;
    }

    const reward = await this.rewardsRepository.save(
      this.rewardsRepository.create({
        lead_id: lead.id,
        author_id: lead.author_id,
        executor_id: lead.executor_id!,
        method,
        value,
        commission_amount: commissionToStore !== null ? String(commissionToStore) : null,
        amount: amount !== null ? String(amount) : null,
        status,
      }),
    );

    await this.auditService.log({
      entityType: 'reward',
      entityId: reward.id,
      action: AuditAction.REWARD_CREATED,
      actorId: lead.author_id,
      metadata: { lead_id: lead.id, amount: reward.amount, status },
    });

    // Уведомляем обе стороны о создании вознаграждения
    await this.notificationsService.send(
      lead.author_id,
      'Вознаграждение создано',
      `По лиду создано вознаграждение${amount !== null ? ` на сумму ${amount}` : ' (требует ручного расчёта)'}.`,
      { reward_id: reward.id, lead_id: lead.id, action: 'reward_created' },
    );

    if (lead.executor_id) {
      await this.notificationsService.send(
        lead.executor_id,
        'Вознаграждение создано',
        `По лиду создано вознаграждение${amount !== null ? ` на сумму ${amount}` : ' (требует ручного расчёта)'}.`,
        { reward_id: reward.id, lead_id: lead.id, action: 'reward_created' },
      );
    }

    return reward;
  }

  async findByLeadId(leadId: string): Promise<Reward | null> {
    return this.rewardsRepository.findOneBy({ lead_id: leadId });
  }

  async findMy(userId: string): Promise<Reward[]> {
    return this.rewardsRepository.find({
      where: [{ author_id: userId }, { executor_id: userId }],
      order: { created_at: 'DESC' },
    });
  }

  async markPaid(rewardId: string, dto: MarkPaidDto, userId: string): Promise<Reward> {
    const reward = await this.getRewardOrFail(rewardId);

    if (reward.executor_id !== userId) {
      throw new ForbiddenException(
        'Только исполнитель может отметить вознаграждение как оплаченное',
      );
    }

    if (reward.status !== RewardStatus.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Нельзя отметить как оплаченное вознаграждение в статусе "${reward.status}"`,
      );
    }

    reward.status = RewardStatus.PAID;
    reward.proof_url = dto.proof_url;
    reward.paid_at = new Date();

    await this.rewardsRepository.save(reward);

    await this.auditService.log({
      entityType: 'reward',
      entityId: rewardId,
      action: AuditAction.REWARD_PAID,
      actorId: userId,
      metadata: { proof_url: dto.proof_url },
    });

    await this.notificationsService.send(
      reward.author_id,
      'Вознаграждение оплачено',
      `Исполнитель подтвердил получение вознаграждения.`,
      { reward_id: rewardId, action: 'reward_paid' },
    );

    return reward;
  }

  async dispute(rewardId: string, dto: DisputeRewardDto, userId: string) {
    const reward = await this.getRewardOrFail(rewardId);
    await this.disputesService.openForReward(reward, dto.reason, userId);

    await this.auditService.log({
      entityType: 'reward',
      entityId: rewardId,
      action: AuditAction.REWARD_DISPUTED,
      actorId: userId,
      metadata: { reason: dto.reason },
    });

    return this.getRewardOrFail(rewardId);
  }

  async getRewardOrFail(rewardId: string): Promise<Reward> {
    const reward = await this.rewardsRepository.findOneBy({ id: rewardId });
    if (!reward) {
      throw new NotFoundException('Вознаграждение не найдено');
    }
    return reward;
  }
}
