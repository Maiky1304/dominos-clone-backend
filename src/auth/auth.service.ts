import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../session/session.service';
import { Credentials } from './types';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: SessionService,
  ) {}

  async register(dto: RegisterUserDto) {
    const hashedPassword = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
        },
      });
      delete user.password;

      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
    }
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user || !(await argon.verify(user.password, dto.password))) {
      throw new ForbiddenException(
        'No account could be found with this email or password',
      );
    }

    const { id } = await this.sessions.createSession({
      userId: user.id,
    });
    const credentials = await this.createCredentials(user, id);
    await this.prisma.session.update({
      where: { id },
      data: credentials,
    });

    return {
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    };
  }

  async createCredentials(user: User, sid: string): Promise<Credentials> {
    const payload = {
      sub: sid,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get('JWT_VALIDITY'),
      secret: this.config.get('JWT_SECRET'),
    });
    const refreshToken = await this.jwtService.signAsync(
      { refresh: true, ...payload },
      {
        expiresIn: this.config.get('JWT_REFRESH_VALIDITY'),
        secret: this.config.get('JWT_REFRESH_SECRET'),
      },
    );
    return { accessToken, refreshToken };
  }

  async refresh(authorization: string) {
    const header = authorization.substring('Bearer '.length);

    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken: header,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.sessions.invalidateSession(session);

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });

    const { id } = await this.sessions.createSession({
      userId: user.id,
    });
    const credentials = await this.createCredentials(user, id);
    await this.prisma.session.update({
      where: { id },
      data: credentials,
    });

    return {
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    };
  }

  async logout(user: User) {
    const session = await this.prisma.session.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.sessions.invalidateSession(session);
  }
}
