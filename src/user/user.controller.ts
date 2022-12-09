import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { User as UserModel } from '@prisma/client';
import { User } from './decorators/user.decorator';
import { JwtGuard } from '../auth/guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller('/user')
export class UserController {
  @HttpCode(HttpStatus.OK)
  @Get('/identify')
  identify(@User() user: UserModel) {
    return user;
  }

  @Roles('ADMIN')
  @Get('/admin')
  adminOnly() {
    return "you're an admin :)";
  }
}
