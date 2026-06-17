import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ConsentType } from './consent-type.enum';

@Entity('user_consents')
export class UserConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar' })
  consent_type: ConsentType;

  @Column({ type: 'varchar', default: '1.0' })
  document_version: string;

  @CreateDateColumn({ type: 'timestamptz' })
  agreed_at: Date;
}
