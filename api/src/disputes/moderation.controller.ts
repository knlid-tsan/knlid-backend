import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { DisputesService } from './disputes.service';
import { DisputeStatus } from './enums/dispute-status.enum';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('moderation/disputes')
export class ModerationController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  list(@Query('status') status?: DisputeStatus) {
    return this.disputesService.list(status);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.disputesService.getDetail(id);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.disputesService.resolve(id, dto, req.user.sub, req.ip);
  }
}
