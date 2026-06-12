import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Создать пользователя
  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  // Найти всех пользователей
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Найти одного по ID
  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  // Найти по номеру телефона (пригодится для входа)
  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone });
  }
}