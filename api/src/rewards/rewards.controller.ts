import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { RewardsService } from './rewards.service';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { DisputeRewardDto } from './dto/dispute-reward.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('my')
  findMy(@Req() req: AuthenticatedRequest) {
    return this.rewardsService.findMy(req.user.sub);
  }

  @Post(':id/mark-paid')
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rewardsService.markPaid(id, dto, req.user.sub);
  }

  @Post(':id/dispute')
  dispute(
    @Param('id') id: string,
    @Body() dto: DisputeRewardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rewardsService.dispute(id, dto, req.user.sub);
  }
}
