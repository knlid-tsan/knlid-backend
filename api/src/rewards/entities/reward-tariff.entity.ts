import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LeadType } from '../../leads/enums/lead-type.enum';
import { RewardMethod } from '../enums/reward-method.enum';

// Two partial indexes because PostgreSQL treats NULL as distinct in UNIQUE constraints:
// without them, multiple rows with the same lead_type and city=NULL would be allowed.
@Entity('reward_tariffs')
@Index('UQ_tariff_base', ['lead_type'], { unique: true, where: '"city" IS NULL' })
@Index('UQ_tariff_city', ['lead_type', 'city'], { unique: true, where: '"city" IS NOT NULL' })
export class RewardTariff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LeadType })
  lead_type: LeadType;

  // null = base tariff for the type; string = city-specific override
  @Column({ type: 'varchar', nullable: true, default: () => 'NULL' })
  city: string | null;

  @Column({ type: 'enum', enum: RewardMethod })
  method: RewardMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: string;

  @Column()
  updated_by: string;

  @UpdateDateColumn()
  updated_at: Date;
}
