import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone: string;

  @Column()
  full_name: string;

  @Column()
  city: string;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}
