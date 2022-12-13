import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto';
import { AuthService } from './auth.service';
import { JwtGuard, RefreshJwtGuard } from './guard';
import { User } from '../user/decorators/user.decorator';
import { User as UserModel } from '@prisma/client';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  @UseGuards(RefreshJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/refresh')
  refresh(@Headers('Authorization') authorization: string) {
    return this.authService.refresh(authorization);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  logout(@User() user: UserModel) {
    return this.authService.logout(user);
  }
}
