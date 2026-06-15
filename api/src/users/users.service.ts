import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User, UserStatus } from './user.entity';
import { BanksService } from '../banks/banks.service';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private banksService: BanksService,
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

  async updatePayment(userId: string, dto: UpdatePaymentDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const bank = await this.banksService.findOne(dto.bank_id);
    if (!bank || !bank.is_active) {
      throw new BadRequestException('Банк не найден или недоступен');
    }

    user.payment_bank_id = dto.bank_id;
    user.payment_phone = dto.payment_phone;
    return this.usersRepository.save(user);
  }

  async updateAvatar(userId: string, filePath: string): Promise<{ avatar_url: string }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Пользователь не найден');

    user.avatar_url = filePath;
    await this.usersRepository.save(user);
    return { avatar_url: filePath };
  }
}