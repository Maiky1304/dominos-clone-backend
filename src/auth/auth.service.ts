import { Injectable } from '@nestjs/common';
import {LoginUserDto, RegisterUserDto} from "./dto";

@Injectable()
export class AuthService {
    async register(dto: RegisterUserDto) {
        return dto;
    }

    async login(dto: LoginUserDto) {
        return dto;
    }
}
