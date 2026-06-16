import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { SenderType } from './enums/sender-type.enum';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepo: Repository<Message>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  // ─── User side ───────────────────────────────────────────────────────────────

  async getOrCreateConversation(userId: string): Promise<Conversation> {
    let conv = await this.conversationsRepo.findOne({ where: { user_id: userId } });
    if (!conv) {
      conv = await this.conversationsRepo.save(
        this.conversationsRepo.create({ user_id: userId }),
      );
      await this.auditService.log({
        entityType: 'conversation',
        entityId: conv.id,
        action: AuditAction.SUPPORT_CONVERSATION_CREATED,
        actorId: userId,
      });
    }
    return conv;
  }

  async getConversationWithMessages(userId: string) {
    const conv = await this.getOrCreateConversation(userId);
    const messages = await this.messagesRepo.find({
      where: { conversation_id: conv.id },
      order: { created_at: 'ASC' },
    });
    return { conversation: conv, messages };
  }

  async sendUserMessage(userId: string, text: string, ip?: string) {
    const conv = await this.getOrCreateConversation(userId);
    const message = await this.messagesRepo.save(
      this.messagesRepo.create({
        conversation_id: conv.id,
        sender_type: SenderType.USER,
        sender_id: userId,
        text,
      }),
    );
    await this.conversationsRepo.update(conv.id, {
      unread_for_support: () => 'unread_for_support + 1',
      last_message_at: new Date(),
    });
    return message;
  }

  async markReadForUser(userId: string) {
    const conv = await this.conversationsRepo.findOne({ where: { user_id: userId } });
    if (!conv) return;
    await this.messagesRepo
      .createQueryBuilder()
      .update()
      .set({ is_read: true })
      .where('conversation_id = :id AND sender_type = :type AND is_read = false', {
        id: conv.id,
        type: SenderType.SUPPORT,
      })
      .execute();
    await this.conversationsRepo.update(conv.id, { unread_for_user: 0 });
  }

  async getUnreadForUser(userId: string): Promise<number> {
    const conv = await this.conversationsRepo.findOne({ where: { user_id: userId } });
    return conv?.unread_for_user ?? 0;
  }

  // ─── Moderation side ─────────────────────────────────────────────────────────

  async listConversations() {
    return this.dataSource.query<unknown[]>(`
      SELECT
        c.id,
        c.last_message_at,
        c.unread_for_support,
        c.unread_for_user,
        c.created_at,
        u.id          AS user_id,
        u.full_name   AS user_full_name,
        u.phone       AS user_phone,
        u.role        AS user_role,
        (SELECT m.text FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC LIMIT 1) AS last_message_text
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.last_message_at DESC
    `);
  }

  async getConversationById(id: string) {
    const rows = await this.dataSource.query<unknown[]>(`
      SELECT
        c.id,
        c.last_message_at,
        c.unread_for_support,
        c.unread_for_user,
        c.created_at,
        u.id        AS user_id,
        u.full_name AS user_full_name,
        u.phone     AS user_phone,
        u.role      AS user_role
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = $1
    `, [id]);

    if (!rows.length) throw new NotFoundException('Диалог не найден');

    const messages = await this.messagesRepo.find({
      where: { conversation_id: id },
      order: { created_at: 'ASC' },
    });

    return { conversation: rows[0], messages };
  }

  async sendSupportMessage(conversationId: string, moderatorId: string, text: string) {
    const conv = await this.conversationsRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Диалог не найден');

    const message = await this.messagesRepo.save(
      this.messagesRepo.create({
        conversation_id: conversationId,
        sender_type: SenderType.SUPPORT,
        sender_id: moderatorId,
        text,
      }),
    );
    await this.conversationsRepo.update(conv.id, {
      unread_for_user: () => 'unread_for_user + 1',
      last_message_at: new Date(),
    });
    return message;
  }

  async markReadForSupport(conversationId: string) {
    const conv = await this.conversationsRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Диалог не найден');
    await this.messagesRepo
      .createQueryBuilder()
      .update()
      .set({ is_read: true })
      .where('conversation_id = :id AND sender_type = :type AND is_read = false', {
        id: conversationId,
        type: SenderType.USER,
      })
      .execute();
    await this.conversationsRepo.update(conversationId, { unread_for_support: 0 });
  }

  async getTotalUnreadForSupport(): Promise<number> {
    const result = await this.conversationsRepo
      .createQueryBuilder('c')
      .select('COUNT(*)::int', 'count')
      .where('c.unread_for_support > 0')
      .getRawOne<{ count: number }>();
    return result?.count ?? 0;
  }
}
