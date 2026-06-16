import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  last_message_at: Date;

  @Column({ type: 'int', default: 0 })
  unread_for_user: number;

  @Column({ type: 'int', default: 0 })
  unread_for_support: number;
}
