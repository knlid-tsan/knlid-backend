import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { GuarantorJobService } from './guarantor-job.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/jobs')
export class GuarantorJobController {
  constructor(private guarantorJobService: GuarantorJobService) {}

  // POST /admin/jobs/check-overdue — ручной запуск крон-задачи (для тестов и дежурства)
  @Post('check-overdue')
  runCheckOverdue() {
    return this.guarantorJobService.runManually();
  }

  // POST /admin/jobs/auto-confirm-payments?days=0 — ручной запуск авто-подтверждения
  // days=0 → подтверждает все paid-вознаграждения (для тестирования без ожидания)
  @Post('auto-confirm-payments')
  runAutoConfirm(@Query('days') days?: string) {
    const d = days !== undefined ? parseInt(days, 10) : 5;
    return this.guarantorJobService.runAutoConfirmManually(d);
  }
}
