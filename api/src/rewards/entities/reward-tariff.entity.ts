import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { LeadType } from '../../leads/enums/lead-type.enum';
import { RewardMethod } from '../enums/reward-method.enum';

@Entity('reward_tariffs')
export class RewardTariff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LeadType, unique: true })
  lead_type: LeadType;

  @Column({ type: 'enum', enum: RewardMethod })
  method: RewardMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: string;

  @Column()
  updated_by: string;

  @UpdateDateColumn()
  updated_at: Date;
}
