import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { RejectVerificationDto } from './dto/reject-verification.dto';

const MAX_ATTEMPTS = 3;
const BLOCK_HOURS = 24;

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async uploadDocument(
    userId: string,
    filePath: string,
    ip: string | null,
  ): Promise<User> {
    const user = await this.getUserOrFail(userId);

    if (user.verification_blocked_until) {
      const blockedUntil = new Date(user.verification_blocked_until);

      if (blockedUntil > new Date()) {
        const minutesLeft = Math.ceil(
          (blockedUntil.getTime() - Date.now()) / 60_000,
        );
        throw new ForbiddenException(
          `Превышен лимит попыток. Повторная загрузка доступна через ${minutesLeft} мин.`,
        );
      }

      // Блокировка истекла — сбрасываем счётчик
      user.verification_attempts = 0;
      user.verification_blocked_until = null;
    }

    user.identity_doc_url = filePath;
    user.status = UserStatus.PENDING;
    user.verification_attempts += 1;
    user.verification_rejection_reason = null;
    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: userId,
      action: AuditAction.DOCUMENT_UPLOADED,
      actorId: userId,
      ip,
      metadata: { attempts: user.verification_attempts },
    });

    return user;
  }

  async listPending(): Promise<User[]> {
    return this.usersRepository.find({
      where: { status: UserStatus.PENDING },
      order: { updated_at: 'ASC' },
    });
  }

  async getDocumentPath(userId: string): Promise<string> {
    const user = await this.getUserOrFail(userId);

    if (!user.identity_doc_url) {
      throw new NotFoundException('Документ не найден');
    }

    return user.identity_doc_url;
  }

  async approve(userId: string, moderatorId: string): Promise<User> {
    const user = await this.getUserOrFail(userId);

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException(
        `Нельзя одобрить верификацию: статус пользователя "${user.status}"`,
      );
    }

    user.status = UserStatus.ACTIVE;
    user.verification_rejection_reason = null;
    user.verification_attempts = 0;
    user.verification_blocked_until = null;
    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: userId,
      action: AuditAction.VERIFICATION_APPROVED,
      actorId: moderatorId,
    });

    await this.notificationsService.send(
      userId,
      'Верификация пройдена',
      'Ваш документ подтверждён — вы можете создавать лиды и принимать заявки.',
      { action: 'verification_approved' },
    );

    return user;
  }

  async reject(
    userId: string,
    dto: RejectVerificationDto,
    moderatorId: string,
  ): Promise<User> {
    const user = await this.getUserOrFail(userId);

    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException(
        `Нельзя отклонить верификацию: статус пользователя "${user.status}"`,
      );
    }

    user.status = UserStatus.NEW;
    user.verification_rejection_reason = dto.reason;

    if (user.verification_attempts >= MAX_ATTEMPTS) {
      user.verification_blocked_until = new Date(
        Date.now() + BLOCK_HOURS * 60 * 60 * 1000,
      );
    }

    await this.usersRepository.save(user);

    await this.auditService.log({
      entityType: 'user',
      entityId: userId,
      action: AuditAction.VERIFICATION_REJECTED,
      actorId: moderatorId,
      metadata: { reason: dto.reason, attempts: user.verification_attempts },
    });

    await this.notificationsService.send(
      userId,
      'Верификация отклонена',
      `Причина: ${dto.reason}`,
      { action: 'verification_rejected', reason: dto.reason },
    );

    return user;
  }

  private async getUserOrFail(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }
}
