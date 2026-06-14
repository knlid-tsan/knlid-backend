import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User, UserStatus } from './user.entity';

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

  // Найти по номеру телефона (любой статус, включая archived)
  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone });
  }

  // Найти активного пользователя по телефону — archived не возвращает
  findActiveByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone, status: Not(UserStatus.ARCHIVED) });
  }

  findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.usersRepository.findBy({ id: In(ids) });
  }
}