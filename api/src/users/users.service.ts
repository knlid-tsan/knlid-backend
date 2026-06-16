import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';
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

  // Найти профиль с живыми счётчиками лидов (для GET /users/me)
  async findOneProfile(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) return null;

    const [stats] = await this.usersRepository.manager.query<
      [{ leads_sent: number; leads_received: number; leads_closed: number }]
    >(
      `SELECT
         COUNT(CASE WHEN author_id = $1 THEN 1 END)::int          AS leads_sent,
         COUNT(CASE WHEN executor_id = $1::uuid THEN 1 END)::int  AS leads_received,
         COUNT(CASE WHEN executor_id = $1::uuid
                     AND status IN ('closed_success', 'archived')
                    THEN 1 END)::int                               AS leads_closed
       FROM leads`,
      [id],
    );

    user.leads_sent     = Number(stats.leads_sent);
    user.leads_received = Number(stats.leads_received);
    user.leads_closed   = Number(stats.leads_closed);

    return user;
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

  findCandidates(specialization: string, city: string, excludeUserId?: string): Promise<User[]> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('user.specialization = :spec', { spec: specialization })
      .andWhere('user.city ILIKE :city', { city })
      .orderBy('user.rating', 'DESC')
      .addOrderBy('user.leads_closed', 'DESC');
    if (excludeUserId) {
      qb.andWhere('user.id != :excludeId', { excludeId: excludeUserId });
    }
    return qb.getMany();
  }

  async adminCreateSpecialist(
    data: { full_name: string; phone: string; specialization: string; city: string },
  ): Promise<User> {
    const existing = await this.findActiveByPhone(data.phone);
    if (existing) throw new ConflictException('Этот номер телефона уже используется');

    const user = this.usersRepository.create({
      phone: data.phone,
      full_name: data.full_name,
      specialization: data.specialization as User['specialization'],
      city: data.city,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      verified_manually: true,
    });
    return this.usersRepository.save(user);
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

  async moderatorSetAvatar(userId: string, filePath: string): Promise<{ avatar_url: string }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Пользователь не найден');
    user.avatar_url = filePath;
    await this.usersRepository.save(user);
    return { avatar_url: filePath };
  }

  async moderatorRemoveAvatar(userId: string): Promise<{ avatar_url: null }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Пользователь не найден');
    user.avatar_url = null as unknown as string;
    await this.usersRepository.save(user);
    return { avatar_url: null };
  }
}