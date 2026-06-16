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

  async findPaginated(filters: {
    action?: string;
    actorId?: string;
    entityId?: string;
    entityType?: string;
    page: number;
    limit: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.action)     { conditions.push(`al.action = $${idx++}`);          params.push(filters.action); }
    if (filters.actorId)    { conditions.push(`al.actor_id = $${idx++}`);         params.push(filters.actorId); }
    if (filters.entityId)   { conditions.push(`al.entity_id = $${idx++}`);        params.push(filters.entityId); }
    if (filters.entityType) { conditions.push(`al.entity_type = $${idx++}`);      params.push(filters.entityType); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRows, [{ total }]] = await Promise.all([
      this.auditLogsRepository.manager.query<unknown[]>(
        `SELECT
           al.id, al.entity_type, al.entity_id, al.action,
           al.actor_id, al.ip_address, al.metadata, al.created_at,
           actor.full_name AS actor_name,
           actor.phone     AS actor_phone,
           eu.full_name    AS entity_name
         FROM audit_logs al
         LEFT JOIN users actor ON actor.id = al.actor_id
         LEFT JOIN users eu    ON eu.id = al.entity_id AND al.entity_type = 'user'
         ${where}
         ORDER BY al.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, filters.limit, (filters.page - 1) * filters.limit],
      ),
      this.auditLogsRepository.manager.query<[{ total: number }]>(
        `SELECT COUNT(*)::int AS total FROM audit_logs al ${where}`,
        params,
      ),
    ]);

    return { data: dataRows, total, page: filters.page, limit: filters.limit };
  }

  findByUser(userId: string, limit = 20): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: [{ actor_id: userId }, { entity_id: userId }],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
