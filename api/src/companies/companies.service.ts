import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus } from './entities/company.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RejectCompanyDto } from './dto/reject-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async register(dto: RegisterCompanyDto): Promise<{ company: Company; representative_id: string }> {
    const existingBin = await this.companiesRepository.findOneBy({ bin: dto.bin });
    if (existingBin) {
      throw new ConflictException('Компания с таким БИН уже зарегистрирована');
    }

    const existingPhone = await this.usersRepository.findOneBy({ phone: dto.phone });
    if (existingPhone) {
      throw new ConflictException('Этот номер телефона уже используется');
    }

    const company = await this.companiesRepository.save(
      this.companiesRepository.create({
        name: dto.name,
        bin: dto.bin,
        phone: dto.phone,
        city: dto.city,
        status: CompanyStatus.NEW,
      }),
    );

    const rep = await this.usersRepository.save(
      this.usersRepository.create({
        phone: dto.phone,
        full_name: dto.name,
        specialization: null,
        city: dto.city,
        role: UserRole.COMPANY,
        status: UserStatus.ACTIVE,
        company_id: company.id,
      }),
    );

    await this.auditService.log({
      entityType: 'company',
      entityId: company.id,
      action: AuditAction.COMPANY_REGISTERED,
      actorId: rep.id,
      metadata: { name: company.name, bin: company.bin, city: company.city },
    });

    return { company, representative_id: rep.id };
  }

  async uploadDocument(companyId: string, actorId: string, filePath: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id: companyId });
    if (!company) throw new NotFoundException('Компания не найдена');

    if (company.status === CompanyStatus.ACTIVE) {
      throw new BadRequestException('Компания уже верифицирована');
    }
    if (company.status === CompanyStatus.BLOCKED) {
      throw new BadRequestException('Компания заблокирована');
    }

    company.document_url = filePath;
    company.status = CompanyStatus.PENDING;
    company.rejection_reason = null;
    const saved = await this.companiesRepository.save(company);

    await this.auditService.log({
      entityType: 'company',
      entityId: company.id,
      action: AuditAction.COMPANY_DOCUMENT_UPLOADED,
      actorId,
    });

    return saved;
  }

  async getMe(companyId: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id: companyId });
    if (!company) throw new NotFoundException('Компания не найдена');
    return company;
  }

  // ─── Moderation ───────────────────────────────────────────────────────────

  async listForModeration(status?: CompanyStatus): Promise<Company[]> {
    const where = status ? { status } : {};
    return this.companiesRepository.find({
      where,
      order: { created_at: 'ASC' },
    });
  }

  async getForModeration(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Компания не найдена');
    return company;
  }

  async approve(id: string, actorId: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Компания не найдена');

    if (company.status === CompanyStatus.ACTIVE) {
      throw new BadRequestException('Компания уже активна');
    }

    company.status = CompanyStatus.ACTIVE;
    company.rejection_reason = null;
    const saved = await this.companiesRepository.save(company);

    await this.auditService.log({
      entityType: 'company',
      entityId: id,
      action: AuditAction.COMPANY_APPROVED,
      actorId,
    });

    return saved;
  }

  async reject(id: string, dto: RejectCompanyDto, actorId: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Компания не найдена');

    company.status = CompanyStatus.NEW;
    company.rejection_reason = dto.reason;
    const saved = await this.companiesRepository.save(company);

    await this.auditService.log({
      entityType: 'company',
      entityId: id,
      action: AuditAction.COMPANY_REJECTED,
      actorId,
      metadata: { reason: dto.reason },
    });

    return saved;
  }
}
