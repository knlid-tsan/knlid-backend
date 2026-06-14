import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// Nil UUID — используется как actorId для системных (автоматических) действий
const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyMembership, MembershipStatus } from '../companies/entities/company-membership.entity';
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
}
