import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Not, In } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Client } from './entities/client.entity';
import { LeadStatusHistory } from './entities/lead-status-history.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { DeclineLeadDto } from './dto/decline-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import {
  LeadStatus,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
} from './enums/lead-status.enum';
import { UsersService } from '../users/users.service';
import { RewardsService } from '../rewards/rewards.service';
import { DisputesService } from '../disputes/disputes.service';
import { OpenDisputeDto } from '../disputes/dto/open-dispute.dto';

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

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(LeadStatusHistory)
    private historyRepository: Repository<LeadStatusHistory>,
    private usersService: UsersService,
    private rewardsService: RewardsService,
    private disputesService: DisputesService,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateLeadDto, authorId: string) {
    const duplicate = await this.findActiveDuplicate(
      dto.type,
      dto.client.phone,
    );

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

    return this.serializeLead(lead, authorId);
  }

  async assign(leadId: string, dto: AssignLeadDto, userId: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.author_id !== userId) {
      throw new ForbiddenException(
        'Только автор лида может назначить исполнителя',
      );
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

    const from = lead.status;
    lead.executor_id = dto.executor_id;
    lead.status = LeadStatus.PENDING_ACCEPTANCE;
    await this.leadsRepository.save(lead);
    await this.recordHistory(lead.id, from, lead.status, userId);

    return this.serializeLead(lead, userId);
  }

  async accept(leadId: string, userId: string) {
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

    return this.serializeLead(lead, userId);
  }

  async decline(leadId: string, dto: DeclineLeadDto, userId: string) {
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

    return this.serializeLead(lead, userId);
  }

  async updateStatus(leadId: string, dto: UpdateLeadStatusDto, userId: string) {
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
      if (!ACTIVE_STATUSES.includes(from)) {
        throw new BadRequestException(
          `Нельзя отменить лид в статусе "${from}"`,
        );
      }
      if (!isAuthor) {
        throw new ForbiddenException('Отменить лид может только автор');
      }
    } else if (PROGRESS_TRANSITIONS[from]?.includes(to)) {
      if (!isExecutor) {
        throw new ForbiddenException(
          'Этот переход может выполнить только исполнитель',
        );
      }

      if (to === LeadStatus.CLOSED_SUCCESS) {
        const tariff = await this.rewardsService.getTariff(lead.type);
        this.rewardsService.validateDealAmountForTariff(tariff, dto.deal_amount);
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

    if (to === LeadStatus.CLOSED_SUCCESS) {
      await this.rewardsService.createForLead(lead, dto.deal_amount);
    }

    return this.serializeLead(lead, userId);
  }

  async openDispute(leadId: string, dto: OpenDisputeDto, userId: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.author_id !== userId && lead.executor_id !== userId) {
      throw new ForbiddenException('Нет доступа к этому лиду');
    }

    await this.disputesService.openForLead(lead, dto.reason, userId);

    return this.serializeLead(lead, userId);
  }

  async findMyCreated(userId: string) {
    const leads = await this.leadsRepository.find({
      where: { author_id: userId },
      order: { created_at: 'DESC' },
    });

    return leads.map((lead) => this.serializeLead(lead, userId));
  }

  async findMyAssigned(userId: string) {
    const leads = await this.leadsRepository.find({
      where: { executor_id: userId },
      order: { created_at: 'DESC' },
    });

    return leads.map((lead) => this.serializeLead(lead, userId));
  }

  async findOne(leadId: string, userId: string) {
    const lead = await this.getLeadOrFail(leadId);

    if (lead.author_id !== userId && lead.executor_id !== userId) {
      throw new ForbiddenException('Нет доступа к этому лиду');
    }

    const history = await this.historyRepository.find({
      where: { lead_id: leadId },
      order: { created_at: 'ASC' },
    });

    return { ...this.serializeLead(lead, userId), history };
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
            phone: showPhone ? lead.client.phone : undefined,
          }
        : lead.client,
    };
  }
}
