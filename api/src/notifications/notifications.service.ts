import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NOTIFICATION_PROVIDER } from './notification-provider.interface';
import type { NotificationProvider } from './notification-provider.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @Inject(NOTIFICATION_PROVIDER)
    private provider: NotificationProvider,
  ) {}

  async send(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
  ): Promise<Notification> {
    const notification = await this.notificationsRepository.save(
      this.notificationsRepository.create({
        user_id: userId,
        title,
        body,
        data: data ?? null,
      }),
    );

    await this.provider.send(userId, title, body, data);

    return notification;
  }

  async findMy(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Notification[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.notificationsRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOneBy({ id });

    if (!notification || notification.user_id !== userId) {
      throw new NotFoundException('Уведомление не найдено');
    }

    notification.is_read = true;
    return this.notificationsRepository.save(notification);
  }
}
