import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { SupportService } from './support.service';
import { SupportUserController } from './support-user.controller';
import { SupportModerationController } from './support-moderation.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    AuthModule,
    AuditModule,
  ],
  controllers: [SupportUserController, SupportModerationController],
  providers: [SupportService],
})
export class SupportModule {}
