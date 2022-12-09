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

@UseGuards(JwtGuard)
@Controller('/user')
export class UserController {
  @HttpCode(HttpStatus.OK)
  @Get('/identify')
  identify(@User() user: UserModel) {
    return user;
  }
}
