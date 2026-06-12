import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { LeadStatus } from '../enums/lead-status.enum';

@Entity('lead_status_history')
export class LeadStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column()
  lead_id: string;

  @Column({ type: 'enum', enum: LeadStatus, nullable: true })
  from_status: LeadStatus | null;

  @Column({ type: 'enum', enum: LeadStatus })
  to_status: LeadStatus;

  @Column()
  changed_by: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  created_at: Date;
}
