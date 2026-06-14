import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CompanyStatus {
  NEW = 'new',
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  bin: string;

  @Column({ unique: true })
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
