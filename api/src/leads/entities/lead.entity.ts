import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { LeadType } from '../enums/lead-type.enum';
import { LeadStatus } from '../enums/lead-status.enum';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LeadType })
  type: LeadType;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column()
  client_id: string;

  @Column()
  author_id: string;

  @Column({ type: 'uuid', nullable: true })
  executor_id: string | null;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ type: 'text' })
  description: string;

  @Column()
  city: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  reward_amount: string | null;

  @Column({ default: false })
  reward_paid: boolean;

  @Column({ default: false })
  is_duplicate: boolean;

  @Column({ type: 'uuid', nullable: true })
  duplicate_of_id: string | null;

  @Column({ default: false })
  client_consent_confirmed: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date | null;
}
