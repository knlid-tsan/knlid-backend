import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from './bank.entity';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(Bank)
    private banksRepository: Repository<Bank>,
  ) {}

  findAll(): Promise<Bank[]> {
    return this.banksRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  findOne(id: string): Promise<Bank | null> {
    return this.banksRepository.findOneBy({ id });
  }

  create(dto: CreateBankDto): Promise<Bank> {
    const bank = this.banksRepository.create(dto);
    return this.banksRepository.save(bank);
  }

  async update(id: string, dto: UpdateBankDto): Promise<Bank> {
    const bank = await this.getBankOrFail(id);
    Object.assign(bank, dto);
    return this.banksRepository.save(bank);
  }

  async remove(id: string): Promise<{ id: string }> {
    const bank = await this.getBankOrFail(id);
    await this.banksRepository.remove(bank);
    return { id };
  }

  private async getBankOrFail(id: string): Promise<Bank> {
    const bank = await this.banksRepository.findOneBy({ id });
    if (!bank) throw new NotFoundException('Банк не найден');
    return bank;
  }
}
