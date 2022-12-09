import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { User as UserModel } from '@prisma/client';
import { User } from './decorators/user.decorator';
import { JwtGuard } from '../auth/guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserUpdateDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/identify')
  identify(@User() user: UserModel) {
    return user;
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Roles('ADMIN')
  @Get('/:id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.userService.find(id);
  }

  @Roles('ADMIN')
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UserUpdateDto) {
    return this.userService.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id);
  }
}
