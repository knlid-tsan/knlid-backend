import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone: string;

  @Column()
  code: string;

  @Column()
  expires_at: Date;

  @Column({ type: 'int', default: 0 })
  verify_attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  verify_blocked_until: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
