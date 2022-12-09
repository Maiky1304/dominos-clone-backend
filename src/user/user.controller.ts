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
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorators/roles.decorator';
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

  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @Get('/:id')
  find(@Param('id', ParseIntPipe) id: number) {
    return this.userService.find(id);
  }

  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UserUpdateDto) {
    return this.userService.update(id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id);
  }
}
