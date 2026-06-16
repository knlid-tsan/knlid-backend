import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { SupportService } from './support.service';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.COMPANY)
@Controller('support')
export class SupportUserController {
  constructor(private readonly supportService: SupportService) {}

  @Get('conversation')
  getConversation(@Req() req: AuthenticatedRequest) {
    return this.supportService.getConversationWithMessages(req.user.sub);
  }

  @Post('message')
  sendMessage(@Req() req: AuthenticatedRequest, @Body() dto: SendMessageDto) {
    return this.supportService.sendUserMessage(req.user.sub, dto.text, req.ip);
  }

  @Post('read')
  markRead(@Req() req: AuthenticatedRequest) {
    return this.supportService.markReadForUser(req.user.sub);
  }

  @Get('unread')
  getUnread(@Req() req: AuthenticatedRequest) {
    return this.supportService.getUnreadForUser(req.user.sub).then(count => ({ count }));
  }
}
