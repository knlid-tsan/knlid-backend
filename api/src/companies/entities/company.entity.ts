import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CompanyStatus {
  NEW = 'new',
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Index('UQ_companies_phone_active', ['phone'], { unique: true, where: `"status" != 'rejected'` })
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  bin: string;

  @Column()
  phone: string;

  @Column()
  city: string;

  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.NEW })
  status: CompanyStatus;

  @Column({ type: 'varchar', nullable: true })
  document_url: string | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
