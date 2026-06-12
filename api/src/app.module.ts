import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { OtpCode } from './auth/otp-code.entity';
import { LeadsModule } from './leads/leads.module';
import { Lead } from './leads/entities/lead.entity';
import { Client } from './leads/entities/client.entity';
import { LeadStatusHistory } from './leads/entities/lead-status-history.entity';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'evgenykobiliastsky',
      password: '',
      database: 'knlid_dev',
      entities: [User, OtpCode, Lead, Client, LeadStatusHistory],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}