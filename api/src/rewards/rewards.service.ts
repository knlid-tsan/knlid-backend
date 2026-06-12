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

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private rewardsRepository: Repository<Reward>,
    @InjectRepository(RewardTariff)
    private tariffsRepository: Repository<RewardTariff>,
    private disputesService: DisputesService,
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

  // Бросает 400, если для процентного тарифа не передан deal_amount.
  // Вызывается ДО смены статуса лида, чтобы не закрыть лид при некорректном запросе.
  validateDealAmountForTariff(tariff: RewardTariff | null, dealAmount?: number): void {
    if (tariff?.method === RewardMethod.PERCENT && (dealAmount === undefined || dealAmount === null)) {
      throw new BadRequestException(
        'Для процентного тарифа необходимо указать deal_amount',
      );
    }
  }

  // Создаёт Reward при переводе лида в closed_success.
  async createForLead(lead: Lead, dealAmount?: number): Promise<Reward> {
    const tariff = await this.getTariff(lead.type);

    let method: RewardMethod | null = null;
    let value: string | null = null;
    let amount: number | null = null;
    let status = RewardStatus.PENDING;
    let dealAmountToStore = dealAmount ?? null;

    if (tariff) {
      method = tariff.method;
      value = tariff.value;

      if (tariff.method === RewardMethod.PERCENT) {
        amount = (dealAmount! * Number(tariff.value)) / 100;
        dealAmountToStore = dealAmount!;
      } else {
        amount = Number(tariff.value);
      }

      status = RewardStatus.AWAITING_PAYMENT;
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
        status,
      }),
    );
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

    return this.rewardsRepository.save(reward);
  }

  async dispute(rewardId: string, dto: DisputeRewardDto, userId: string) {
    const reward = await this.getRewardOrFail(rewardId);
    await this.disputesService.openForReward(reward, dto.reason, userId);
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
