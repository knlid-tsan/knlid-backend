import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditAction } from './audit-action.enum';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: AuditAction | string;
    actorId: string;
    ip?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    await this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
        actor_id: params.actorId,
        ip_address: params.ip ?? null,
        metadata: params.metadata ?? null,
      }),
    );
  }

  async find(filters: {
    entityId?: string;
    actorId?: string;
    action?: string;
  }): Promise<AuditLog[]> {
    const where: Record<string, string> = {};
    if (filters.entityId) where.entity_id = filters.entityId;
    if (filters.actorId) where.actor_id = filters.actorId;
    if (filters.action) where.action = filters.action;

    return this.auditLogsRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  findByUser(userId: string, limit = 20): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: [{ actor_id: userId }, { entity_id: userId }],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
