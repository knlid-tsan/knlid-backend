import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnApplicationBootstrap } from '@nestjs/common';
import { City } from './city.entity';
import { Lead } from '../leads/entities/lead.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { ToggleCityDto } from './dto/toggle-city.dto';

const SEED_CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Караганда',
  'Темиртау',
  'Актобе',
  'Тараз',
  'Павлодар',
  'Усть-Каменогорск',
  'Семей',
  'Атырау',
];

const CITY_ALIASES: Record<string, string> = {
  Almaty: 'Алматы',
  Astana: 'Астана',
};

@Injectable()
export class CitiesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
    await this.migrateLeadCities();
    await this.logUnknownCities();
  }

  private async seed(): Promise<void> {
    await this.citiesRepository
      .createQueryBuilder()
      .insert()
      .into(City)
      .values(SEED_CITIES.map((name) => ({ name })))
      .orIgnore()
      .execute();
  }

  private async migrateLeadCities(): Promise<void> {
    for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
      const result = await this.leadsRepository
        .createQueryBuilder()
        .update()
        .set({ city: canonical })
        .where('city = :alias', { alias })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Migrated ${result.affected} lead(s): city "${alias}" → "${canonical}"`,
        );
      }
    }
  }

  private async logUnknownCities(): Promise<void> {
    const rows = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('lead.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('lead.city NOT IN (:...cities)', { cities: SEED_CITIES })
      .groupBy('lead.city')
      .getRawMany<{ city: string; count: string }>();

    for (const row of rows) {
      this.logger.warn(
        `Leads with unknown city: "${row.city}" (${row.count} lead(s)) — not in city reference`,
      );
    }
  }

  findActive(): Promise<City[]> {
    return this.citiesRepository.findBy({ is_active: true });
  }

  async create(dto: CreateCityDto): Promise<City> {
    const existing = await this.citiesRepository.findOneBy({ name: dto.name });
    if (existing) {
      throw new ConflictException(`Город "${dto.name}" уже существует`);
    }
    return this.citiesRepository.save(this.citiesRepository.create({ name: dto.name }));
  }

  async toggle(id: string, dto: ToggleCityDto): Promise<City> {
    const city = await this.citiesRepository.findOneBy({ id });
    if (!city) {
      throw new NotFoundException('Город не найден');
    }
    city.is_active = dto.is_active;
    return this.citiesRepository.save(city);
  }
}
