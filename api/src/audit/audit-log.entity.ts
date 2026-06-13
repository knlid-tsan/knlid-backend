import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entity_type: string;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column()
  action: string;

  @Column({ type: 'uuid' })
  actor_id: string;

  @Column({ type: 'varchar', nullable: true })
  ip_address: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;
}
