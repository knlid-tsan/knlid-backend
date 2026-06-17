import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Client } from './entities/client.entity';
import { LeadStatusHistory } from './entities/lead-status-history.entity';
import { CompanyMembership, MembershipStatus } from '../companies/entities/company-membership.entity';
import { Company } from '../companies/entities/company.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { DeclineLeadDto } from './dto/decline-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import {
  LeadStatus,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
} from './enums/lead-status.enum';
import { LeadType } from './enums/lead-type.enum';
import { UsersService } from '../users/users.service';
import { Specialization, UserRole, UserStatus } from '../users/user.entity';
import { RewardsService } from '../rewards/rewards.service';
import { RewardStatus } from '../rewards/enums/reward-status.enum';
import { RewardMethod } from '../rewards/enums/reward-method.enum';
import { BanksService } from '../banks/banks.service';
import { DisputesService } from '../disputes/disputes.service';
import { OpenDisputeDto } from '../disputes/dto/open-dispute.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const last2 = digits.slice(-2);
  if (digits.startsWith('7') && digits.length === 11) {
    return `+7 ${digits.slice(1, 4)} •••• •${last2}`;
  }
  return `${phone.slice(0, 3)} •••• •${last2}`;
}

// Переходы статусов, которые может выполнить только исполнитель через PATCH /status
const PROGRESS_TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  [LeadStatus.IN_PROGRESS]: [
    LeadStatus.CONTRACT,
    LeadStatus.DEPOSIT,
    LeadStatus.CLOSED_SUCCESS,
  ],
  [LeadStatus.CONTRACT]: [LeadStatus.DEPOSIT, LeadStatus.CLOSED_SUCCESS],
  [LeadStatus.DEPOSIT]: [LeadStatus.CLOSED_SUCCESS],
};

// Статусы, в которых исполнитель ещё не видит телефон клиента
const HIDE_PHONE_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.PENDING_ACCEPTANCE,
];

// Роли, освобождённые от проверки статуса верификации
const PRIVILEGED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MODERATOR];

// Карта: тип лида → требуемая специализация исполнителя (BRD 2.2.1)
const REQUIRED_SPECIALIZATION: Record<LeadType, Specialization> = {
  [LeadType.OWNER]: Specialization.REALTOR,
  [LeadType.BUYER]: Specialization.REALTOR,
  [LeadType.MORTGAGE]: Specialization.MORTGAGE_BROKER,
  [LeadType.LEGAL]: Specialization.LAWYER,
};

const SPECIALIZATION_LABEL: Record<Specialization, string> = {
  [Specialization.REALTOR]: 'Риелтор',
  [Specialization.MORTGAGE_BROKER]: 'Ипотечный брокер',
  [Specialization.LAWYER]: 'Юрист',
};

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(LeadStatusHistory)
    private historyRepository: Repository<LeadStatusHistory>,
    @InjectRepository(CompanyMembership)
    private membershipsRepository: Repository<CompanyMembership>,
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    private usersService: UsersService,
    private rewardsService: RewardsService,
    private banksService: BanksService,
    private disputesService: DisputesService,
    private dataSource: DataSource,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private settingsService: SettingsService,
  ) {}

  async create(dto: CreateLeadDto, authorId: string, authorRole: UserRole, ip?: string) {
    // Блок 1: только верифицированные пользователи могут создавать лиды
    if (!PRIVILEGED_ROLES.includes(authorRole)) {
      const author = await this.usersService.findOne(authorId);
      if (!author || author.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException(
          'Только верифицированные пользователи могут создавать лиды',
        );
      }
    }

    const duplicate = await this.findActiveDuplicate(dto.type, dto.client.phone);

    if (duplicate && !dto.force) {
      throw new ConflictException({
        message:
          'Найден активный лид такого же типа с этим номером телефона клиента',
        existingLead: {
          id: duplicate.id,
          type: duplicate.type,
          status: duplicate.status,
          created_at: duplicate.created_at,
        },
      });
    }

    const lead = await this.dataSource.transaction(async (manager) => {
      const client = manager.create(Client, {
        phone: dto.client.phone,
        full_name: dto.client.full_name,
        city: dto.client.city,
        created_by: authorId,
      });
      await manager.save(client);

      const isDuplicate = !!duplicate && !!dto.force;

      const lead = manager.create(Lead, {
        type: dto.type,
        description: dto.description,
        city: dto.city,
        client_id: client.id,
        client,
        author_id: authorId,
        status: LeadStatus.NEW,
        is_duplicate: isDuplicate,
        duplicate_of_id: isDuplicate ? duplicate!.id : null,
        client_consent_confirmed: dto.client_consent_confirmed,
      });
      await manager.save(lead);

      await manager.save(
        manager.create(LeadStatusHistory, {
          lead_id: lead.id,
          from_status: null,
          to_status: LeadStatus.NEW,
          changed_by: authorId,
          comment: null,
        }),
      );

      return lead;
    });

    await this.auditService.log({
      entityType: 'lead',
      entityId: lead.id,
      action: AuditAction.LEAD_CREATED,
      actorId: authorId,
      ip: ip ?? null,
      metadata: { type: lead.type, city: lead.city },
    });

    return this.serializeLead(lead, authorId);
  }

  async assign(leadId: string, dto: AssignLeadDto, userId: string, userRole: UserRole, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    const isModerator = PRIVILEGED_ROLES.includes(userRole);

    if (!isModerator && lead.author_id !== userId) {
      throw new ForbiddenException('Только автор лида или модератор может назначить исполнителя');
    }

    if (lead.status !== LeadStatus.NEW) {
      throw new BadRequestException(
        `Назначить исполнителя можно только для лида в статусе "${LeadStatus.NEW}"`,
      );
    }

    if (dto.executor_id === lead.author_id) {
      throw new BadRequestException('Нельзя назначить себя исполнителем');
    }

    const executor = await this.usersService.findOne(dto.executor_id);
    if (!executor) {
      throw new BadRequestException('Указанный исполнитель не найден');
    }

    if (
      !PRIVILEGED_ROLES.includes(executor.role) &&
      executor.status !== UserStatus.ACTIVE
    ) {
      throw new ForbiddenException('Исполнитель должен пройти верификацию для принятия лидов');
    }

    // Проверки специализации и города (BRD 2.2.1)
    const requiredSpec = REQUIRED_SPECIALIZATION[lead.type as LeadType];
    const specMismatch = executor.specialization !== requiredSpec;
    const cityMismatch = executor.city?.toLowerCase() !== lead.city?.toLowerCase();
    const overriddenRules: string[] = [];

    if (isModerator) {
      if (specMismatch) overriddenRules.push('specialization');
      if (cityMismatch) overriddenRules.push('city');
    } else {
      // Автор: специализация — жёстко, обойти нельзя
      if (specMismatch) {
        throw new BadRequestException(
          `Исполнитель должен быть: ${SPECIALIZATION_LABEL[requiredSpec]}`,
        );
      }
      // Автор: город — с подтверждением через force
      if (cityMismatch) {
        if (!dto.force) {
          throw new ConflictException({
            message: 'Город исполнителя не совпадает с городом лида',
            executor_city: executor.city,
            lead_city: lead.city,
            hint: 'Передайте force: true чтобы назначить несмотря на несовпадение города',
          });
        }
        overriddenRules.push('city');
      }
    }

    if (overriddenRules.length > 0) {
      await this.auditService.log({
        entityType: 'lead',
        entityId: leadId,
        action: AuditAction.ASSIGNMENT_OVERRIDE,
        actorId: userId,
        ip: ip ?? null,
        metadata: {
          executor_id: dto.executor_id,
          bypassed: overriddenRules,
          by_moderator: isModerator,
        },
      });
    }

    // Проверка платёжных реквизитов автора (нужны исполнителю для перевода вознаграждения)
    const author = await this.usersService.findOne(lead.author_id);
    if (!author?.payment_bank_id || !author?.payment_phone?.trim()) {
      throw new ForbiddenException(
        'Автор должен заполнить платёжные реквизиты для передачи лида',
      );
    }

    const from = lead.status;
    lead.executor_id = dto.executor_id;
    lead.status = LeadStatus.PENDING_ACCEPTANCE;
    await this.leadsRepository.save(lead);
    await this.recordHistory(lead.id, from, lead.status, userId);

    await this.auditService.log({
      entityType: 'lead',
      entityId: leadId,
      action: AuditAction.LEAD_ASSIGNED,
      actorId: userId,
      ip: ip ?? null,
      metadata: { executor_id: dto.executor_id },
    });

    await this.notificationsService.send(
      dto.executor_id,
      'Вам назначен лид',
      `Лид типа "${lead.type}" ожидает вашего подтверждения.`,
      { lead_id: lead.id, action: 'lead_assigned' },
    );

    return this.serializeLead(lead, userId);
  }

  async accept(leadId: string, userId: string, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.executor_id !== userId) {
      throw new ForbiddenException(
        'Только назначенный исполнитель может принять лид',
      );
    }

    if (lead.status !== LeadStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException(
        `Принять можно только лид в статусе "${LeadStatus.PENDING_ACCEPTANCE}"`,
      );
    }

    const from = lead.status;
    lead.status = LeadStatus.IN_PROGRESS;
    await this.leadsRepository.save(lead);
    await this.recordHistory(lead.id, from, lead.status, userId);

    await this.auditService.log({
      entityType: 'lead',
      entityId: leadId,
      action: AuditAction.LEAD_ACCEPTED,
      actorId: userId,
      ip: ip ?? null,
    });

    await this.notificationsService.send(
      lead.author_id,
      'Лид принят',
      `Исполнитель принял ваш лид типа "${lead.type}".`,
      { lead_id: lead.id, action: 'lead_accepted' },
    );

    return this.serializeLead(lead, userId);
  }

  async decline(leadId: string, dto: DeclineLeadDto, userId: string, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.executor_id !== userId) {
      throw new ForbiddenException(
        'Только назначенный исполнитель может отклонить лид',
      );
    }

    if (lead.status !== LeadStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException(
        `Отклонить можно только лид в статусе "${LeadStatus.PENDING_ACCEPTANCE}"`,
      );
    }

    const from = lead.status;
    lead.status = LeadStatus.NEW;
    lead.executor_id = null;
    await this.leadsRepository.save(lead);
    await this.recordHistory(lead.id, from, lead.status, userId, dto.reason);

    await this.auditService.log({
      entityType: 'lead',
      entityId: leadId,
      action: AuditAction.LEAD_DECLINED,
      actorId: userId,
      ip: ip ?? null,
      metadata: { reason: dto.reason },
    });

    await this.notificationsService.send(
      lead.author_id,
      'Лид отклонён',
      `Исполнитель отклонил ваш лид. Причина: ${dto.reason}`,
      { lead_id: lead.id, action: 'lead_declined' },
    );

    return this.serializeLead(lead, userId);
  }

  async updateStatus(
    leadId: string,
    dto: UpdateLeadStatusDto,
    userId: string,
    ip?: string,
  ) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.status === LeadStatus.DISPUTE) {
      throw new BadRequestException(
        'Лид находится в споре, изменения заблокированы до решения модератора',
      );
    }

    const isAuthor = lead.author_id === userId;
    const isExecutor = lead.executor_id === userId;

    if (!isAuthor && !isExecutor) {
      throw new ForbiddenException('Нет доступа к этому лиду');
    }

    const from = lead.status;
    const to = dto.status;

    if (to === LeadStatus.DISPUTE) {
      throw new BadRequestException(
        'Для открытия спора используйте POST /leads/:id/dispute',
      );
    }

    if (to === LeadStatus.CANCELLED) {
      const EXECUTOR_CANCEL_FROM: LeadStatus[] = [
        LeadStatus.IN_PROGRESS,
        LeadStatus.CONTRACT,
        LeadStatus.DEPOSIT,
      ];
      if (isAuthor) {
        if (!ACTIVE_STATUSES.includes(from)) {
          throw new BadRequestException(
            `Нельзя отменить лид в статусе "${from}"`,
          );
        }
      } else if (isExecutor && EXECUTOR_CANCEL_FROM.includes(from)) {
        if (!dto.comment?.trim()) {
          throw new BadRequestException(
            'Укажите причину отмены',
          );
        }
      } else if (isExecutor) {
        throw new ForbiddenException(
          'Исполнитель может отменить лид только со статусов: в работе, договор, задаток',
        );
      } else {
        throw new ForbiddenException('Нет доступа к этому лиду');
      }
    } else if (PROGRESS_TRANSITIONS[from]?.includes(to)) {
      if (!isExecutor) {
        throw new ForbiddenException(
          'Этот переход может выполнить только исполнитель',
        );
      }

      if (to === LeadStatus.CLOSED_SUCCESS) {
        const tariff = await this.rewardsService.getTariffForLead(lead);
        this.rewardsService.validateCommissionAmount(tariff, dto.commission_amount);
      }
    } else {
      throw new BadRequestException(
        `Переход из статуса "${from}" в "${to}" запрещён`,
      );
    }

    lead.status = to;
    if (to === LeadStatus.CLOSED_SUCCESS || to === LeadStatus.CANCELLED) {
      lead.closed_at = new Date();
    }
    await this.leadsRepository.save(lead);
    await this.recordHistory(lead.id, from, to, userId, dto.comment);

    await this.auditService.log({
      entityType: 'lead',
      entityId: leadId,
      action: AuditAction.LEAD_STATUS_CHANGED,
      actorId: userId,
      ip: ip ?? null,
      metadata: { from, to, commission_amount: dto.commission_amount ?? null },
    });

    // Уведомляем другую сторону о смене статуса
    const notifyUserId = isAuthor ? lead.executor_id : lead.author_id;
    if (notifyUserId) {
      await this.notificationsService.send(
        notifyUserId,
        'Статус лида изменён',
        `Статус лида изменён: "${from}" → "${to}".`,
        { lead_id: lead.id, from, to, action: 'lead_status_changed' },
      );
    }

    if (to === LeadStatus.CLOSED_SUCCESS) {
      const deadlineDays = await this.settingsService.getPaymentDeadlineDays();
      const paymentDueAt = new Date(lead.closed_at!);
      paymentDueAt.setDate(paymentDueAt.getDate() + deadlineDays);
      await this.rewardsService.createForLead(lead, dto.commission_amount, paymentDueAt);
    }

    return this.serializeLead(lead, userId);
  }

  async openDispute(leadId: string, dto: OpenDisputeDto, userId: string, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    // Only the author can open a dispute
    if (lead.author_id !== userId) {
      throw new ForbiddenException('Открыть спор может только автор лида');
    }

    const DISPUTE_ALLOWED: LeadStatus[] = [
      LeadStatus.IN_PROGRESS,
      LeadStatus.CONTRACT,
      LeadStatus.DEPOSIT,
      LeadStatus.CLOSED_SUCCESS,
      LeadStatus.CANCELLED,
    ];
    if (!DISPUTE_ALLOWED.includes(lead.status)) {
      throw new BadRequestException(
        `Спор нельзя открыть на статусе "${lead.status}"`,
      );
    }

    // Anti-fraud: for cancelled — only if lead was previously accepted (has in_progress in history)
    if (lead.status === LeadStatus.CANCELLED) {
      const wasAccepted = await this.historyRepository.findOne({
        where: { lead_id: leadId, to_status: LeadStatus.IN_PROGRESS },
      });
      if (!wasAccepted) {
        throw new ForbiddenException(
          'Спор недоступен: лид не был принят исполнителем',
        );
      }
    }

    await this.disputesService.openForLead(lead, dto.reason, userId);

    await this.auditService.log({
      entityType: 'lead',
      entityId: leadId,
      action: AuditAction.DISPUTE_OPENED,
      actorId: userId,
      ip: ip ?? null,
      metadata: { reason: dto.reason },
    });

    return this.serializeLead(lead, userId);
  }

  async getTariff(leadId: string, userId: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.author_id !== userId && lead.executor_id !== userId) {
      throw new ForbiddenException('Нет доступа к этому лиду');
    }

    const tariff = await this.rewardsService.getTariffForLead(lead);

    if (!tariff) {
      return { method: null, value: null, description: 'Тариф не установлен' };
    }

    const val = parseFloat(tariff.value);
    const description =
      tariff.method === RewardMethod.PERCENT
        ? `${Math.round(val)}% от комиссии исполнителя`
        : `${Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸ фиксированно`;

    return { method: tariff.method, value: tariff.value, description };
  }

  async findMyCreated(userId: string) {
    const leads = await this.leadsRepository.find({
      where: { author_id: userId },
      relations: { client: true },
      order: { created_at: 'DESC' },
    });

    const executorIds = [...new Set(
      leads.filter((l) => l.executor_id).map((l) => l.executor_id!),
    )];
    const users = executorIds.length
      ? await this.usersService.findByIds(executorIds)
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return leads.map((lead) => ({
      ...this.serializeLead(lead, userId),
      executor_name: lead.executor_id
        ? (userMap.get(lead.executor_id)?.full_name ?? null)
        : null,
    }));
  }

  async findMyAssigned(userId: string) {
    const leads = await this.leadsRepository.find({
      where: { executor_id: userId },
      relations: { client: true },
      order: { created_at: 'DESC' },
    });

    const authorIds = [...new Set(leads.map((l) => l.author_id))];
    const users = authorIds.length
      ? await this.usersService.findByIds(authorIds)
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return leads.map((lead) => ({
      ...this.serializeLead(lead, userId),
      author_name: userMap.get(lead.author_id)?.full_name ?? null,
    }));
  }

  async findOne(leadId: string, userId: string, userRole: UserRole, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.author_id !== userId && lead.executor_id !== userId) {
      throw new ForbiddenException('Нет доступа к этому лиду');
    }

    const history = await this.historyRepository.find({
      where: { lead_id: leadId },
      order: { created_at: 'ASC' },
    });

    // VIEW_CLIENT_PHONE — фиксируем когда исполнитель впервые видит телефон клиента
    const isExecutor = lead.executor_id === userId;
    const isAuthor = lead.author_id === userId;
    const phoneVisible =
      isExecutor && !HIDE_PHONE_STATUSES.includes(lead.status);

    if (phoneVisible) {
      await this.auditService.log({
        entityType: 'lead',
        entityId: leadId,
        action: AuditAction.VIEW_CLIENT_PHONE,
        actorId: userId,
        ip: ip ?? null,
        metadata: { lead_status: lead.status },
      });
    }

    const [guarantor, participants] = await Promise.all([
      this.getGuarantorInfo(lead.executor_id),
      this.usersService.findByIds([
        lead.author_id,
        ...(lead.executor_id ? [lead.executor_id] : []),
      ]),
    ]);
    const participantMap = new Map(participants.map((u) => [u.id, u]));

    // Для закрытых/архивных лидов — подтягиваем вознаграждение один раз
    let author_payment: { bank_name: string | null; phone: string | null; reward_amount: string | null } | null = null;
    let reward_status: string | null = null;
    let reward_proof_url: string | null = null;

    const isPaymentPhase =
      lead.status === LeadStatus.CLOSED_SUCCESS || lead.status === LeadStatus.ARCHIVED;

    if (isPaymentPhase) {
      const reward = await this.rewardsService.getForLead(lead.id);
      if (reward) {
        reward_status = reward.status;

        if (isExecutor && lead.status === LeadStatus.CLOSED_SUCCESS) {
          const author = participantMap.get(lead.author_id);
          if (author?.payment_bank_id) {
            const bank = await this.banksService.findOne(author.payment_bank_id);
            author_payment = {
              bank_name: bank?.name ?? null,
              phone: author.payment_phone ?? null,
              reward_amount: reward.amount ?? null,
            };
          }
        }

        // Автор видит чек (proof_url) когда исполнитель его прикрепил
        if (isAuthor && reward.status === RewardStatus.PAID) {
          reward_proof_url = reward.proof_url;
        }
      }
    }

    return {
      ...this.serializeLead(lead, userId),
      author_name: participantMap.get(lead.author_id)?.full_name ?? null,
      executor_name: lead.executor_id
        ? (participantMap.get(lead.executor_id)?.full_name ?? null)
        : null,
      history,
      guarantor,
      ...(author_payment !== null ? { author_payment } : {}),
      ...(reward_status !== null ? { reward_status } : {}),
      ...(reward_proof_url !== null ? { reward_proof_url } : {}),
    };
  }

  async checkDuplicate(type: string, phone: string) {
    if (!type || !phone) return { duplicate: false };
    const validTypes = Object.values(LeadType) as string[];
    if (!validTypes.includes(type)) return { duplicate: false };
    const lead = await this.findActiveDuplicate(type as LeadType, phone);
    if (!lead) return { duplicate: false };
    return {
      duplicate: true,
      lead: {
        id: lead.id,
        type: lead.type,
        status: lead.status,
        created_at: lead.created_at,
      },
    };
  }

  private async findActiveDuplicate(type: Lead['type'], phone: string) {
    return this.leadsRepository
      .createQueryBuilder('lead')
      .innerJoin('lead.client', 'client')
      .where('lead.type = :type', { type })
      .andWhere('client.phone = :phone', { phone })
      .andWhere('lead.status NOT IN (:...statuses)', {
        statuses: TERMINAL_STATUSES,
      })
      .orderBy('lead.created_at', 'DESC')
      .getOne();
  }

  private async getLeadOrFail(leadId: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id: leadId },
      relations: { client: true },
    });

    if (!lead) {
      throw new NotFoundException('Лид не найден');
    }

    return lead;
  }

  private async recordHistory(
    leadId: string,
    from: LeadStatus | null,
    to: LeadStatus,
    changedBy: string,
    comment?: string | null,
  ) {
    await this.historyRepository.save(
      this.historyRepository.create({
        lead_id: leadId,
        from_status: from,
        to_status: to,
        changed_by: changedBy,
        comment: comment ?? null,
      }),
    );
  }

  async adminFindAll(
    filters: { status?: string; type?: string; city?: string },
    page: number,
    limit: number,
  ) {
    const qb = this.leadsRepository
      .createQueryBuilder('lead')
      .orderBy('lead.created_at', 'DESC');

    if (filters.status) {
      qb.andWhere('lead.status = :status', { status: filters.status });
    }
    if (filters.type) {
      qb.andWhere('lead.type = :type', { type: filters.type });
    }
    if (filters.city) {
      qb.andWhere('lead.city ILIKE :city', { city: `%${filters.city}%` });
    }

    const [leads, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const userIds = [
      ...new Set([
        ...leads.map((l) => l.author_id),
        ...leads.filter((l) => l.executor_id).map((l) => l.executor_id!),
      ]),
    ];
    const users = await this.usersService.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = leads.map((lead) => ({
      id: lead.id,
      type: lead.type,
      status: lead.status,
      city: lead.city,
      created_at: lead.created_at,
      closed_at: lead.closed_at,
      reward_amount: lead.reward_amount,
      reward_paid: lead.reward_paid,
      author: userMap.has(lead.author_id)
        ? {
            id: lead.author_id,
            full_name: userMap.get(lead.author_id)!.full_name,
            phone: userMap.get(lead.author_id)!.phone,
          }
        : null,
      executor:
        lead.executor_id && userMap.has(lead.executor_id)
          ? {
              id: lead.executor_id,
              full_name: userMap.get(lead.executor_id)!.full_name,
              phone: userMap.get(lead.executor_id)!.phone,
            }
          : null,
    }));

    return { data, total, page, limit };
  }

  async adminFindOne(leadId: string) {
    const lead = await this.leadsRepository.findOne({
      where: { id: leadId },
      relations: { client: true },
    });
    if (!lead) {
      throw new NotFoundException('Лид не найден');
    }

    const history = await this.historyRepository.find({
      where: { lead_id: leadId },
      order: { created_at: 'ASC' },
    });

    const userIds = [
      ...new Set([
        lead.author_id,
        ...(lead.executor_id ? [lead.executor_id] : []),
        ...history.map((h) => h.changed_by),
      ]),
    ];
    const users = await this.usersService.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const historyWithUser = history.map((h) => ({
      id: h.id,
      from_status: h.from_status,
      to_status: h.to_status,
      created_at: h.created_at,
      comment: h.comment,
      changed_by_user: userMap.has(h.changed_by)
        ? { id: h.changed_by, full_name: userMap.get(h.changed_by)!.full_name }
        : null,
    }));

    const [reward, dispute, guarantor] = await Promise.all([
      this.rewardsService.getForLead(lead.id),
      this.disputesService.getOpenForLead(lead.id),
      this.getGuarantorInfo(lead.executor_id),
    ]);

    const authorUser = userMap.get(lead.author_id);
    const executorUser = lead.executor_id ? userMap.get(lead.executor_id) : undefined;

    return {
      id: lead.id,
      type: lead.type,
      status: lead.status,
      city: lead.city,
      description: lead.description,
      created_at: lead.created_at,
      closed_at: lead.closed_at,
      reward_amount: lead.reward_amount,
      reward_paid: lead.reward_paid,
      is_duplicate: lead.is_duplicate,
      duplicate_of_id: lead.duplicate_of_id,
      client: lead.client,
      author: authorUser
        ? {
            id: authorUser.id,
            full_name: authorUser.full_name,
            phone: authorUser.phone,
            specialization: authorUser.specialization,
            city: authorUser.city,
          }
        : null,
      executor: executorUser
        ? {
            id: executorUser.id,
            full_name: executorUser.full_name,
            phone: executorUser.phone,
            specialization: executorUser.specialization,
            city: executorUser.city,
            guarantor,
          }
        : null,
      history: historyWithUser,
      reward: reward ?? null,
      dispute: dispute ?? null,
    };
  }

  async adminFindClients(
    filters: { search?: string },
    page: number,
    limit: number,
  ) {
    const searchParam = filters.search?.trim() ? `%${filters.search.trim()}%` : null;
    const offset = (page - 1) * limit;

    interface RawClientRow {
      id: string;
      full_name: string;
      city: string;
      phone: string;
      created_at: Date;
      total: number;
      active: number;
      closed_success: number;
      cancelled: number;
    }

    const rows: RawClientRow[] = await this.dataSource.query(
      `SELECT
        c.id,
        c.full_name,
        c.city,
        c.phone,
        c.created_at,
        COUNT(l.id)::int AS total,
        SUM(CASE WHEN l.status IN ('new','pending_acceptance','in_progress','contract','deposit','dispute') THEN 1 ELSE 0 END)::int AS active,
        SUM(CASE WHEN l.status = 'closed_success' THEN 1 ELSE 0 END)::int AS closed_success,
        SUM(CASE WHEN l.status IN ('cancelled','archived') THEN 1 ELSE 0 END)::int AS cancelled
      FROM clients c
      LEFT JOIN leads l ON l.client_id = c.id
      WHERE ($1::text IS NULL OR c.full_name ILIKE $1 OR c.city ILIKE $1)
      GROUP BY c.id, c.full_name, c.city, c.phone, c.created_at
      ORDER BY COUNT(l.id) DESC, c.created_at DESC
      LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset],
    );

    const [countRow] = await this.dataSource.query<[{ total: string }]>(
      `SELECT COUNT(DISTINCT c.id)::int AS total FROM clients c
       WHERE ($1::text IS NULL OR c.full_name ILIKE $1 OR c.city ILIKE $1)`,
      [searchParam],
    );

    const data = rows.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      city: r.city,
      phone_masked: maskPhone(r.phone),
      created_at: r.created_at,
      leads: {
        total: r.total,
        active: r.active,
        closed_success: r.closed_success,
        cancelled: r.cancelled,
      },
    }));

    return { data, total: Number(countRow.total), page, limit };
  }

  async submitProof(leadId: string, userId: string, filePath: string, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.executor_id !== userId) {
      throw new ForbiddenException('Только исполнитель может прикрепить чек');
    }
    if (lead.status !== LeadStatus.CLOSED_SUCCESS) {
      throw new BadRequestException('Чек можно прикрепить только к закрытому лиду');
    }

    try {
      await this.rewardsService.attachProof(leadId, filePath);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    await this.auditService.log({
      entityType: 'reward',
      entityId: leadId,
      action: AuditAction.REWARD_PROOF_ATTACHED,
      actorId: userId,
      ip: ip ?? null,
      metadata: { proof_url: filePath },
    });

    return this.serializeLead(lead, userId);
  }

  async confirmPayment(leadId: string, userId: string, ip?: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.author_id !== userId) {
      throw new ForbiddenException('Только автор может подтвердить получение');
    }
    if (lead.status !== LeadStatus.CLOSED_SUCCESS) {
      throw new BadRequestException('Подтвердить можно только закрытый лид');
    }

    const reward = await this.rewardsService.getForLead(leadId);
    if (!reward || reward.status !== RewardStatus.PAID) {
      throw new BadRequestException('Вознаграждение ещё не оплачено исполнителем');
    }

    await this.archiveLead(lead, userId, ip ?? null);
    return this.serializeLead(lead, userId);
  }

  // Общий метод архивирования — используется и автором, и cron-задачей
  async archiveLead(lead: Lead, actorId: string, ip: string | null) {
    const from = lead.status;
    lead.status = LeadStatus.ARCHIVED;
    lead.closed_at = new Date();
    await this.leadsRepository.save(lead);
    await this.recordHistory(lead.id, from, LeadStatus.ARCHIVED, actorId);

    await this.auditService.log({
      entityType: 'lead',
      entityId: lead.id,
      action: actorId === SYSTEM_ACTOR_ID ? AuditAction.REWARD_AUTO_CONFIRMED : AuditAction.REWARD_CONFIRMED,
      actorId,
      ip,
      metadata: { lead_id: lead.id },
    });

    if (lead.executor_id && actorId !== SYSTEM_ACTOR_ID) {
      await this.notificationsService.send(
        lead.executor_id,
        'Получение подтверждено',
        'Автор подтвердил получение вознаграждения. Лид переведён в архив.',
        { lead_id: lead.id, action: 'payment_confirmed' },
      );
    }
  }

  async adminFindCandidates(leadId: string) {
    const lead = await this.getLeadOrFail(leadId);
    const requiredSpec = REQUIRED_SPECIALIZATION[lead.type as LeadType];

    const candidates = await this.usersService.findCandidates(
      requiredSpec,
      lead.city,
      lead.author_id,
    );

    // Batch-load active memberships for all candidates (один запрос, не N)
    let companyNameByUserId = new Map<string, string>();
    if (candidates.length > 0) {
      const userIds = candidates.map((u) => u.id);
      const memberships = await this.membershipsRepository.find({
        where: { user_id: In(userIds), status: MembershipStatus.ACTIVE },
      });
      if (memberships.length > 0) {
        const companyIds = [...new Set(memberships.map((m) => m.company_id))];
        const companies = await this.companiesRepository.find({ where: { id: In(companyIds) } });
        const companyMap = new Map(companies.map((c) => [c.id, c.name]));
        for (const m of memberships) {
          const name = companyMap.get(m.company_id);
          if (name) companyNameByUserId.set(m.user_id, name);
        }
      }
    }

    return {
      lead_id: lead.id,
      lead_city: lead.city,
      required_specialization: requiredSpec,
      required_specialization_label: SPECIALIZATION_LABEL[requiredSpec],
      candidates: candidates.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        phone: u.phone,
        city: u.city,
        specialization: u.specialization,
        rating: u.rating,
        leads_closed: u.leads_closed,
        company_name: companyNameByUserId.get(u.id) ?? null,
      })),
    };
  }

  hasActiveLeadsOfType(type: LeadType): Promise<boolean> {
    return this.leadsRepository
      .findOne({ where: { type, status: In(ACTIVE_STATUSES as LeadStatus[]) } })
      .then((lead) => lead !== null);
  }

  private serializeLead(lead: Lead, userId: string) {
    const isAuthor = lead.author_id === userId;
    const isExecutor = lead.executor_id === userId;
    const showPhone =
      isAuthor || (isExecutor && !HIDE_PHONE_STATUSES.includes(lead.status));

    return {
      ...lead,
      client: lead.client
        ? {
            ...lead.client,
            full_name: showPhone ? lead.client.full_name : null,
            phone: showPhone ? lead.client.phone : undefined,
          }
        : lead.client,
    };
  }

  async getGuarantorInfo(
    executorId: string | null,
  ): Promise<{ active: boolean; company_name: string } | null> {
    if (!executorId) return null;
    const membership = await this.membershipsRepository.findOne({
      where: { user_id: executorId, status: MembershipStatus.ACTIVE },
    });
    if (!membership) return null;
    const company = await this.companiesRepository.findOneBy({ id: membership.company_id });
    return company ? { active: true, company_name: company.name } : null;
  }
}
