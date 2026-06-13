import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

// Глобальный модуль — AuditService доступен во всех модулях без явного импорта
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
