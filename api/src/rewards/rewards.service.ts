import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { RewardTariff } from './entities/reward-tariff.entity';
import { RewardMethod } from './enums/reward-method.enum';
import { RewardStatus } from './enums/reward-status.enum';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { DisputeRewardDto } from './dto/dispute-reward.dto';
import { Lead } from '../leads/entities/lead.entity';
import { LeadType } from '../leads/enums/lead-type.enum';
import { DisputesService } from '../disputes/disputes.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { UpsertTariffV2Dto } from '../admin/dto/upsert-tariff-v2.dto';

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

  // Finds the most specific tariff: city-specific first, then base (city IS NULL).
  async getTariffForLead(lead: Lead): Promise<RewardTariff | null> {
    const cityTariff = await this.tariffsRepository.findOneBy({
      lead_type: lead.type,
      city: lead.city,
    });
    if (cityTariff) return cityTariff;

    return this.tariffsRepository.findOne({
      where: { lead_type: lead.type, city: IsNull() },
    });
  }

  async listTariffsGrouped(): Promise<{ base: RewardTariff[]; overrides: RewardTariff[] }> {
    const all = await this.tariffsRepository.find({
      order: { lead_type: 'ASC', city: 'ASC' },
    });
    return {
      base: all.filter((t) => t.city === null),
      overrides: all.filter((t) => t.city !== null),
    };
  }

  async getTariffById(id: string): Promise<RewardTariff> {
    const tariff = await this.tariffsRepository.findOneBy({ id });
    if (!tariff) throw new NotFoundException('Тариф не найден');
    return tariff;
  }

  async upsertTariff(dto: UpsertTariffV2Dto, adminId: string): Promise<RewardTariff> {
    const city = dto.city?.trim() || null;
    let tariff: RewardTariff | null;

    if (city !== null) {
      tariff = await this.tariffsRepository.findOneBy({ lead_type: dto.lead_type, city });
    } else {
      tariff = await this.tariffsRepository.findOne({
        where: { lead_type: dto.lead_type, city: IsNull() },
      });
    }

    if (!tariff) {
      tariff = this.tariffsRepository.create({ lead_type: dto.lead_type, city });
    }

    tariff.method = dto.method;
    tariff.value = String(dto.value);
    tariff.updated_by = adminId;

    const saved = await this.tariffsRepository.save(tariff);

    await this.auditService.log({
      entityType: 'reward_tariff',
      entityId: saved.id,
      action: AuditAction.TARIFF_UPSERT,
      actorId: adminId,
      metadata: { lead_type: dto.lead_type, city, method: dto.method, value: dto.value },
    });

    return saved;
  }

  async deleteTariff(id: string, adminId: string): Promise<{ deleted: boolean }> {
    const tariff = await this.getTariffById(id);

    if (tariff.city === null) {
      throw new BadRequestException(
        `Нельзя удалить базовый тариф "${tariff.lead_type}". Сначала переназначьте или закройте активные лиды этого типа.`,
      );
    }

    const { lead_type, city } = tariff;
    await this.tariffsRepository.remove(tariff);

    await this.auditService.log({
      entityType: 'reward_tariff',
      entityId: id,
      action: AuditAction.TARIFF_DELETE,
      actorId: adminId,
      metadata: { lead_type, city },
    });

    return { deleted: true };
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

  async createForLead(lead: Lead, commissionAmount?: number, paymentDueAt?: Date): Promise<Reward> {
    const tariff = await this.getTariffForLead(lead);

    let method: RewardMethod | null = null;
    let value: string | null = null;
    let amount: number | null = null;
    let status = RewardStatus.PENDING;
    let commissionToStore = commissionAmount ?? null;

    if (tariff) {
      method = tariff.method;
      value = tariff.value;

      if (tariff.method === RewardMethod.PERCENT) {
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
        payment_due_at: paymentDueAt ?? null,
        guarantor_company_id: null,
      }),
    );

    await this.auditService.log({
      entityType: 'reward',
      entityId: reward.id,
      action: AuditAction.REWARD_CREATED,
      actorId: lead.author_id,
      metadata: { lead_id: lead.id, amount: reward.amount, status },
    });

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

  // Вызывается крон-задачей: помечает reward как overdue и привязывает гаранта если есть
  async markOverdue(rewardId: string, guarantorCompanyId: string | null): Promise<Reward> {
    const reward = await this.getRewardOrFail(rewardId);
    reward.status = RewardStatus.OVERDUE;
    reward.guarantor_company_id = guarantorCompanyId;
    return this.rewardsRepository.save(reward);
  }

  // Вызывается компанией-гарантом при покрытии долга
  async payByGuarantor(
    rewardId: string,
    companyId: string,
    proofUrl: string,
    actorId: string,
  ): Promise<Reward> {
    const reward = await this.getRewardOrFail(rewardId);

    if (reward.guarantor_company_id !== companyId) {
      throw new ForbiddenException('Этот долг не относится к вашей компании');
    }
    if (reward.status !== RewardStatus.OVERDUE) {
      throw new BadRequestException(
        `Нельзя покрыть долг в статусе "${reward.status}"`,
      );
    }

    reward.status = RewardStatus.PAID_BY_GUARANTOR;
    reward.proof_url = proofUrl;
    reward.paid_at = new Date();
    await this.rewardsRepository.save(reward);

    await this.auditService.log({
      entityType: 'reward',
      entityId: rewardId,
      action: AuditAction.DEBT_PAID_BY_COMPANY,
      actorId,
      metadata: {
        company_id: companyId,
        proof_url: proofUrl,
        author_id: reward.author_id,
        executor_id: reward.executor_id,
      },
    });

    await this.notificationsService.send(
      reward.author_id,
      'Долг покрыт компанией-гарантом',
      'Компания-гарант подтвердила выплату вознаграждения.',
      { reward_id: rewardId, action: 'debt_paid_by_company' },
    );

    await this.notificationsService.send(
      reward.executor_id,
      'Долг покрыт компанией-гарантом',
      'Компания-гарант подтвердила выплату вознаграждения автору лида.',
      { reward_id: rewardId, action: 'debt_paid_by_company' },
    );

    return reward;
  }

  // Используется крон-задачей и эндпоинтом /companies/me/debts
  async findOverdueByCompany(companyId: string): Promise<Reward[]> {
    return this.rewardsRepository.find({
      where: { guarantor_company_id: companyId, status: RewardStatus.OVERDUE },
      order: { payment_due_at: 'ASC' },
    });
  }

  // Используется крон: ищет просроченные awaiting_payment
  async findExpiredAwaiting(): Promise<Reward[]> {
    return this.rewardsRepository
      .createQueryBuilder('r')
      .where('r.status = :status', { status: RewardStatus.AWAITING_PAYMENT })
      .andWhere('r.payment_due_at IS NOT NULL')
      .andWhere('r.payment_due_at < NOW()')
      .getMany();
  }
}
