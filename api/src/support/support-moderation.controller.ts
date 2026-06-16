import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
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
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('support/admin')
export class SupportModerationController {
  constructor(private readonly supportService: SupportService) {}

  @Get('conversations')
  list() {
    return this.supportService.listConversations();
  }

  @Get('conversations/:id')
  getOne(@Param('id') id: string) {
    return this.supportService.getConversationById(id);
  }

  @Post('conversations/:id/message')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.supportService.sendSupportMessage(id, req.user.sub, dto.text);
  }

  @Post('conversations/:id/read')
  markRead(@Param('id') id: string) {
    return this.supportService.markReadForSupport(id);
  }

  @Get('unread')
  getUnread() {
    return this.supportService.getTotalUnreadForSupport().then(count => ({ count }));
  }
}
