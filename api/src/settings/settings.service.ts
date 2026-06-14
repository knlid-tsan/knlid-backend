import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';

const DEFAULT_PAYMENT_DEADLINE_DAYS = 3;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    private auditService: AuditService,
  ) {}

  async getPaymentDeadlineDays(): Promise<number> {
    const setting = await this.settingsRepository.findOneBy({ key: 'payment_deadline_days' });
    if (!setting) return DEFAULT_PAYMENT_DEADLINE_DAYS;
    const v = parseInt(setting.value, 10);
    return isNaN(v) || v < 1 ? DEFAULT_PAYMENT_DEADLINE_DAYS : v;
  }

  async setPaymentDeadlineDays(days: number, actorId: string): Promise<{ key: string; value: number }> {
    let setting = await this.settingsRepository.findOneBy({ key: 'payment_deadline_days' });
    if (!setting) {
      setting = this.settingsRepository.create({ key: 'payment_deadline_days' });
    }
    const oldValue = setting.value;
    setting.value = String(days);
    setting.updated_by = actorId;
    await this.settingsRepository.save(setting);

    await this.auditService.log({
      entityType: 'setting',
      entityId: randomUUID(),
      action: AuditAction.SETTING_UPDATED,
      actorId,
      metadata: { key: 'payment_deadline_days', old_value: oldValue ?? null, new_value: days },
    });

    return { key: 'payment_deadline_days', value: days };
  }
}
