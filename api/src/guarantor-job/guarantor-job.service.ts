import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// Nil UUID — используется как actorId для системных (автоматических) действий
const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyMembership, MembershipStatus } from '../companies/entities/company-membership.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadStatus } from '../leads/enums/lead-status.enum';
import { LeadsService } from '../leads/leads.service';
import { RewardsService } from '../rewards/rewards.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GuarantorJobService {
  private readonly logger = new Logger(GuarantorJobService.name);

  constructor(
    @InjectRepository(CompanyMembership)
    private membershipsRepository: Repository<CompanyMembership>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    private leadsService: LeadsService,
    private rewardsService: RewardsService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  // Ежедневно в 02:00 — ищет просроченные невыплаченные вознаграждения
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkOverdueRewards(): Promise<void> {
    this.logger.log('Запуск проверки просроченных вознаграждений');

    const expired = await this.rewardsService.findExpiredAwaiting();
    if (!expired.length) {
      this.logger.log('Просроченных вознаграждений не найдено');
      return;
    }

    this.logger.log(`Найдено ${expired.length} просроченных вознаграждений`);

    for (const reward of expired) {
      // Ищем активную membership специалиста (гарант)
      const activeMembership = await this.membershipsRepository.findOne({
        where: { user_id: reward.executor_id, status: MembershipStatus.ACTIVE },
      });

      const guarantorCompanyId = activeMembership?.company_id ?? null;

      // Помечаем как overdue и привязываем гаранта
      await this.rewardsService.markOverdue(reward.id, guarantorCompanyId);

      await this.auditService.log({
        entityType: 'reward',
        entityId: reward.id,
        action: AuditAction.REWARD_OVERDUE,
        actorId: SYSTEM_ACTOR_ID,
        metadata: {
          lead_id: reward.lead_id,
          executor_id: reward.executor_id,
          payment_due_at: reward.payment_due_at,
          guarantor_company_id: guarantorCompanyId,
        },
      });

      // Уведомляем автора: выплата просрочена
      await this.notificationsService.send(
        reward.author_id,
        'Выплата просрочена',
        'Исполнитель не подтвердил выплату вознаграждения в срок.',
        { reward_id: reward.id, action: 'reward_overdue' },
      );

      // Уведомляем исполнителя
      await this.notificationsService.send(
        reward.executor_id,
        'Срок выплаты пропущен',
        'Вы не подтвердили выплату вознаграждения в срок.',
        { reward_id: reward.id, action: 'reward_overdue' },
      );

      if (guarantorCompanyId) {
        await this.auditService.log({
          entityType: 'reward',
          entityId: reward.id,
          action: AuditAction.DEBT_TRANSFERRED_TO_COMPANY,
          actorId: SYSTEM_ACTOR_ID,
          metadata: {
            company_id: guarantorCompanyId,
            executor_id: reward.executor_id,
            amount: reward.amount,
          },
        });

        // Уведомляем компанию: появился долг
        const companyRepId = activeMembership!.company_id; // используем как маркер, уведомление придёт представителю
        await this.notificationsService.send(
          reward.executor_id, // пока executor — в будущем можно отдельный endpoint для company rep
          'Появился долг к покрытию',
          `Ваш специалист не оплатил вознаграждение. Сумма: ${reward.amount ?? 'не указана'}.`,
          { reward_id: reward.id, company_id: companyRepId, action: 'debt_transferred' },
        );
      }

      this.logger.log(
        `Reward ${reward.id} → overdue; guarantor: ${guarantorCompanyId ?? 'нет'}`,
      );
    }
  }

  // Метод для ручного запуска в тестах (вызываем через endpoint или напрямую)
  async runManually(): Promise<{ processed: number }> {
    const expired = await this.rewardsService.findExpiredAwaiting();
    await this.checkOverdueRewards();
    return { processed: expired.length };
  }

  // Ежедневно в 03:00 — авто-подтверждение выплат если автор молчал 5 дней
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async checkAutoConfirmPayments(): Promise<void> {
    this.logger.log('Запуск авто-подтверждения выплат (5 дней без ответа автора)');

    const AUTO_CONFIRM_DAYS = 5;
    const paidRewards = await this.rewardsService.findPaidOlderThan(AUTO_CONFIRM_DAYS);

    if (!paidRewards.length) {
      this.logger.log('Нет вознаграждений для авто-подтверждения');
      return;
    }

    this.logger.log(`Найдено ${paidRewards.length} вознаграждений для авто-подтверждения`);

    for (const reward of paidRewards) {
      const lead = await this.leadsRepository.findOne({
        where: { id: reward.lead_id },
        relations: { client: true },
      });

      if (!lead || lead.status !== LeadStatus.CLOSED_SUCCESS) {
        this.logger.log(`Lead ${reward.lead_id}: пропущен (статус: ${lead?.status ?? 'не найден'})`);
        continue;
      }

      try {
        await this.leadsService.archiveLead(lead, SYSTEM_ACTOR_ID, null);

        await this.notificationsService.send(
          reward.author_id,
          'Получение подтверждено автоматически',
          'Вы не подтвердили получение вознаграждения в течение 5 дней — оно подтверждено автоматически.',
          { lead_id: lead.id, action: 'payment_auto_confirmed' },
        );

        this.logger.log(`Lead ${lead.id} → archived (авто-подтверждение)`);
      } catch (err) {
        this.logger.error(`Ошибка авто-подтверждения лида ${lead.id}: ${(err as Error).message}`);
      }
    }
  }

  // Ручной запуск авто-подтверждения (для тестирования)
  async runAutoConfirmManually(days = 5): Promise<{ processed: number }> {
    const rewards = await this.rewardsService.findPaidOlderThan(days);
    await this.checkAutoConfirmPayments();
    return { processed: rewards.length };
  }
}
