import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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
}

// Роли пользователя — управляют доступом к административным и модераторским разделам
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Entity('users') // создаст таблицу "users" в базе данных
export class User {
  @PrimaryGeneratedColumn('uuid') // уникальный ID, генерируется сам
  id: string;

  @Column({ unique: true }) // unique — два одинаковых телефона невозможны
  phone: string;

  @Column()
  full_name: string;

  @Column({ type: 'enum', enum: Specialization })
  specialization: Specialization;

  @Column()
  city: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.NEW })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true }) // nullable — поле может быть пустым
  identity_doc_url: string;

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

  @CreateDateColumn() // дата создания — заполняется сама
  created_at: Date;

  @UpdateDateColumn() // дата обновления — обновляется сама
  updated_at: Date;
}