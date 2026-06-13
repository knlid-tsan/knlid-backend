import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { ModerationVerificationController } from './moderation-verification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [VerificationController, ModerationVerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
