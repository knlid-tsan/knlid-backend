import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Специализации из BRD раздел 1.4
export enum Specialization {
  REALTOR = 'realtor',           // Риелтор
  MORTGAGE_BROKER = 'mortgage',  // Ипотечный брокер
  LAWYER = 'lawyer',             // Юрист
}

// Статусы пользователя из BRD раздел 4.1
export enum UserStatus {
  NEW = 'new',                   // Новый
  PENDING = 'pending',           // На верификации
  ACTIVE = 'active',             // Активен
  BLOCKED = 'blocked',           // Заблокирован
  ARCHIVED = 'archived',         // Архивирован — номер считается свободным
}

// Роли пользователя — управляют доступом к административным и модераторским разделам
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  COMPANY = 'company',
}

@Index('UQ_users_phone_active', ['phone'], { unique: true, where: `"status" != 'archived'` })
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // уникальный ID, генерируется сам
  id: string;

  @Column()
  phone: string;

  @Column()
  full_name: string;

  @Column({ type: 'enum', enum: Specialization, nullable: true })
  specialization: Specialization | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.NEW })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  identity_photo_url: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ type: 'uuid', nullable: true })
  payment_bank_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  payment_phone: string | null;

  // Причина последнего отклонения верификации — видна пользователю в GET /users/me
  @Column({ type: 'text', nullable: true })
  verification_rejection_reason: string | null;

  // Количество загрузок документа (сбрасывается после approve)
  @Column({ default: 0 })
  verification_attempts: number;

  // После 3-го отклонения повторная загрузка блокируется до этого момента
  @Column({ type: 'timestamp', nullable: true })
  verification_blocked_until: Date | null;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  leads_sent: number;

  @Column({ default: 0 })
  leads_received: number;

  @Column({ default: 0 })
  leads_closed: number;

  @Column({ default: 'ru' })
  language: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string | null;

  @Column({ default: false })
  verified_manually: boolean;

  @CreateDateColumn() // дата создания — заполняется сама
  created_at: Date;

  @UpdateDateColumn() // дата обновления — обновляется сама
  updated_at: Date;
}