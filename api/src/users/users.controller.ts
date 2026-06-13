import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me — профиль текущего пользователя с причиной отклонения верификации
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(req.user.sub);
  }

  @Post()
  create(@Body() data: Partial<User>): Promise<User> {
    return this.usersService.create(data);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }
}
