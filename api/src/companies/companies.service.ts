import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Company, CompanyStatus } from './entities/company.entity';
import { CompanyMembership, MembershipStatus } from './entities/company-membership.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action.enum';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RejectCompanyDto } from './dto/reject-company.dto';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    @InjectRepository(CompanyMembership)
    private membershipsRepository: Repository<CompanyMembership>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
    private rewardsService: RewardsService,
  ) {}

  // ─── Registration & profile ───────────────────────────────────────────────

  async register(dto: RegisterCompanyDto): Promise<{ company: Company; representative_id: string }> {
    const existingBin = await this.companiesRepository.findOneBy({ bin: dto.bin });
    if (existingBin) throw new ConflictException('Компания с таким БИН уже зарегистрирована');

    const existingPhone = await this.usersRepository.findOneBy({ phone: dto.phone });
    if (existingPhone) throw new ConflictException('Этот номер телефона уже используется');

    const company = await this.companiesRepository.save(
      this.companiesRepository.create({
        name: dto.name, bin: dto.bin, phone: dto.phone, city: dto.city,
        status: CompanyStatus.NEW,
      }),
    );

    const rep = await this.usersRepository.save(
      this.usersRepository.create({
        phone: dto.phone, full_name: dto.name, specialization: null,
        city: dto.city, role: UserRole.COMPANY, status: UserStatus.ACTIVE,
        company_id: company.id,
      }),
    );

    await this.auditService.log({
      entityType: 'company', entityId: company.id,
      action: AuditAction.COMPANY_REGISTERED, actorId: rep.id,
      metadata: { name: company.name, bin: company.bin, city: company.city },
    });

    return { company, representative_id: rep.id };
  }

  async uploadDocument(companyId: string, actorId: string, filePath: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id: companyId });
    if (!company) throw new NotFoundException('Компания не найдена');
    if (company.status === CompanyStatus.ACTIVE) throw new BadRequestException('Компания уже верифицирована');
    if (company.status === CompanyStatus.BLOCKED) throw new BadRequestException('Компания заблокирована');

    company.document_url = filePath;
    company.status = CompanyStatus.PENDING;
    company.rejection_reason = null;
    const saved = await this.companiesRepository.save(company);

    await this.auditService.log({
      entityType: 'company', entityId: company.id,
      action: AuditAction.COMPANY_DOCUMENT_UPLOADED, actorId,
    });

    return saved;
  }

  async getMe(companyId: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id: companyId });
    if (!company) throw new NotFoundException('Компания не найдена');
    return company;
  }

  // ─── Specialist-facing ────────────────────────────────────────────────────

  async listActiveCompanies(): Promise<{ id: string; name: string; city: string }[]> {
    const companies = await this.companiesRepository.find({
      where: { status: CompanyStatus.ACTIVE },
      order: { name: 'ASC' },
    });
    return companies.map(({ id, name, city }) => ({ id, name, city }));
  }

  async apply(companyId: string, userId: string): Promise<CompanyMembership> {
    const company = await this.companiesRepository.findOneBy({ id: companyId });
    if (!company) throw new NotFoundException('Компания не найдена');
    if (company.status !== CompanyStatus.ACTIVE)
      throw new BadRequestException('Подать заявку можно только в активную компанию');

    const existingActive = await this.membershipsRepository.findOne({
      where: [
        { user_id: userId, company_id: companyId, status: MembershipStatus.PENDING },
        { user_id: userId, company_id: companyId, status: MembershipStatus.ACTIVE },
      ],
    });
    if (existingActive) throw new ConflictException('Вы уже состоите или подали заявку в эту компанию');

    const membership = await this.membershipsRepository.save(
      this.membershipsRepository.create({
        user_id: userId, company_id: companyId, status: MembershipStatus.PENDING,
      }),
    );

    await this.auditService.log({
      entityType: 'company_membership', entityId: membership.id,
      action: AuditAction.MEMBERSHIP_APPLIED, actorId: userId,
      metadata: { company_id: companyId, company_name: company.name },
    });

    return membership;
  }

  async getMyMemberships(userId: string) {
    const memberships = await this.membershipsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    if (!memberships.length) return [];

    const companyIds = [...new Set(memberships.map((m) => m.company_id))];
    const companies = await this.companiesRepository.find({ where: { id: In(companyIds) } });
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    return memberships.map((m) => ({
      id: m.id,
      company_id: m.company_id,
      company_name: companyMap.get(m.company_id)?.name ?? null,
      company_city: companyMap.get(m.company_id)?.city ?? null,
      status: m.status,
      created_at: m.created_at,
      ended_at: m.ended_at,
    }));
  }

  async leaveMembership(membershipId: string, userId: string): Promise<CompanyMembership> {
    const membership = await this.membershipsRepository.findOneBy({ id: membershipId });
    if (!membership) throw new NotFoundException('Членство не найдено');
    if (membership.user_id !== userId) throw new ForbiddenException('Нет доступа');
    if (membership.status !== MembershipStatus.ACTIVE)
      throw new BadRequestException('Разорвать можно только активную связь');

    return this.endMembership(membership, userId, AuditAction.MEMBERSHIP_LEFT);
  }

  // ─── Company-facing ───────────────────────────────────────────────────────

  async getApplications(companyId: string, status?: MembershipStatus) {
    const where: Record<string, unknown> = { company_id: companyId };
    if (status) where.status = status;

    const memberships = await this.membershipsRepository.find({
      where,
      order: { created_at: 'ASC' },
    });
    if (!memberships.length) return [];

    const userIds = memberships.map((m) => m.user_id);
    const users = await this.usersRepository.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return memberships.map((m) => {
      const u = userMap.get(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        user_name: u?.full_name ?? null,
        user_specialization: u?.specialization ?? null,
        user_city: u?.city ?? null,
        user_rating: u?.rating ?? null,
        status: m.status,
        created_at: m.created_at,
        ended_at: m.ended_at,
      };
    });
  }

  async approveMembership(membershipId: string, companyId: string, actorId: string): Promise<CompanyMembership> {
    const membership = await this.membershipsRepository.findOneBy({ id: membershipId });
    if (!membership) throw new NotFoundException('Заявка не найдена');
    if (membership.company_id !== companyId) throw new ForbiddenException('Нет доступа к этой заявке');
    if (membership.status !== MembershipStatus.PENDING)
      throw new BadRequestException('Заявка уже обработана');

    // Авторазрыв предыдущей активной связи специалиста
    const prevActive = await this.membershipsRepository.findOne({
      where: { user_id: membership.user_id, status: MembershipStatus.ACTIVE },
    });
    if (prevActive) {
      await this.endMembership(prevActive, actorId, AuditAction.MEMBERSHIP_AUTO_ENDED, {
        replaced_by_membership: membershipId,
        new_company_id: companyId,
      });
    }

    membership.status = MembershipStatus.ACTIVE;
    const saved = await this.membershipsRepository.save(membership);

    await this.auditService.log({
      entityType: 'company_membership', entityId: membershipId,
      action: AuditAction.MEMBERSHIP_APPROVED, actorId,
      metadata: { user_id: membership.user_id },
    });

    return saved;
  }

  async rejectMembership(membershipId: string, companyId: string, actorId: string): Promise<CompanyMembership> {
    const membership = await this.membershipsRepository.findOneBy({ id: membershipId });
    if (!membership) throw new NotFoundException('Заявка не найдена');
    if (membership.company_id !== companyId) throw new ForbiddenException('Нет доступа к этой заявке');
    if (membership.status !== MembershipStatus.PENDING)
      throw new BadRequestException('Заявка уже обработана');

    membership.status = MembershipStatus.REJECTED;
    const saved = await this.membershipsRepository.save(membership);

    await this.auditService.log({
      entityType: 'company_membership', entityId: membershipId,
      action: AuditAction.MEMBERSHIP_REJECTED, actorId,
      metadata: { user_id: membership.user_id },
    });

    return saved;
  }

  async removeSpecialist(membershipId: string, companyId: string, actorId: string): Promise<CompanyMembership> {
    const membership = await this.membershipsRepository.findOneBy({ id: membershipId });
    if (!membership) throw new NotFoundException('Членство не найдено');
    if (membership.company_id !== companyId) throw new ForbiddenException('Нет доступа');
    if (membership.status !== MembershipStatus.ACTIVE)
      throw new BadRequestException('Можно разорвать только активную связь');

    return this.endMembership(membership, actorId, AuditAction.MEMBERSHIP_REMOVED, {
      user_id: membership.user_id,
    });
  }

  // ─── Moderation ───────────────────────────────────────────────────────────

  async listForModeration(status?: CompanyStatus): Promise<Company[]> {
    const where = status ? { status } : {};
    return this.companiesRepository.find({ where, order: { created_at: 'ASC' } });
  }

  async getForModeration(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Компания не найдена');
    return company;
  }

  async approve(id: string, actorId: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Компания не найдена');
    if (company.status === CompanyStatus.ACTIVE) throw new BadRequestException('Компания уже активна');

    company.status = CompanyStatus.ACTIVE;
    company.rejection_reason = null;
    const saved = await this.companiesRepository.save(company);

    await this.auditService.log({
      entityType: 'company', entityId: id,
      action: AuditAction.COMPANY_APPROVED, actorId,
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
      entityType: 'company', entityId: id,
      action: AuditAction.COMPANY_REJECTED, actorId,
      metadata: { reason: dto.reason },
    });

    return saved;
  }

  // ─── Долги гаранта ───────────────────────────────────────────────────────

  async getDebts(companyId: string) {
    const rewards = await this.rewardsService.findOverdueByCompany(companyId);
    if (!rewards.length) return [];

    const executorIds = [...new Set(rewards.map((r) => r.executor_id))];
    const authorIds   = [...new Set(rewards.map((r) => r.author_id))];
    const userIds = [...new Set([...executorIds, ...authorIds])];

    const users = await this.usersRepository.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rewards.map((r) => ({
      reward_id:    r.id,
      lead_id:      r.lead_id,
      amount:       r.amount,
      payment_due_at: r.payment_due_at,
      executor: userMap.has(r.executor_id)
        ? { id: r.executor_id, full_name: userMap.get(r.executor_id)!.full_name }
        : null,
      author: userMap.has(r.author_id)
        ? { id: r.author_id, full_name: userMap.get(r.author_id)!.full_name }
        : null,
    }));
  }

  async payDebt(rewardId: string, companyId: string, proofUrl: string, actorId: string) {
    return this.rewardsService.payByGuarantor(rewardId, companyId, proofUrl, actorId);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async endMembership(
    membership: CompanyMembership,
    actorId: string,
    action: AuditAction,
    metadata?: Record<string, unknown>,
  ): Promise<CompanyMembership> {
    membership.status = MembershipStatus.ENDED;
    membership.ended_at = new Date();
    const saved = await this.membershipsRepository.save(membership);

    await this.auditService.log({
      entityType: 'company_membership', entityId: membership.id,
      action, actorId, metadata,
    });

    return saved;
  }
}
