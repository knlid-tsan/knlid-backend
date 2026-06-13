import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { RewardMethod } from '../enums/reward-method.enum';
import { RewardStatus } from '../enums/reward-status.enum';

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  lead_id: string;

  @Column({ type: 'uuid' })
  author_id: string;

  @Column({ type: 'uuid' })
  executor_id: string;

  @Column({ type: 'enum', enum: RewardMethod, nullable: true })
  method: RewardMethod | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  value: string | null;

  // Комиссия исполнителя по сделке — основа для расчёта percent-вознаграждения автора.
  // В БД колонка называется deal_amount (обратная совместимость).
  @Column({ name: 'deal_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  commission_amount: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: string | null;

  @Column({ type: 'enum', enum: RewardStatus, default: RewardStatus.PENDING })
  status: RewardStatus;

  @Column({ type: 'varchar', nullable: true })
  proof_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;
}
