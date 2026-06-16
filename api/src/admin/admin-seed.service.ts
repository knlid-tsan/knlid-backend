import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/user.entity';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const phone = process.env.INITIAL_ADMIN_PHONE;
    if (!phone) return;

    const activeAdminCount = await this.usersRepository.count({
      where: {
        role: UserRole.ADMIN,
        status: Not(In([UserStatus.ARCHIVED, UserStatus.BLOCKED])),
      },
    });
    if (activeAdminCount > 0) return;

    const existing = await this.usersRepository.findOneBy({ phone });
    if (existing) {
      existing.role = UserRole.ADMIN;
      existing.status = UserStatus.ACTIVE;
      await this.usersRepository.save(existing);
      console.log(`[seed] Upgraded existing user to admin: ${phone}`);
      return;
    }

    const admin = this.usersRepository.create({
      phone,
      full_name: 'Администратор',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await this.usersRepository.save(admin);
    console.log(`[seed] Created initial admin: ${phone}`);
  }
}
