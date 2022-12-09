import {Body, Controller, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {LoginUserDto, RegisterUserDto} from "./dto";
import {AuthService} from "./auth.service";

@Controller('/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

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
}
