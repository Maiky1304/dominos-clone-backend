import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: any) {
    // Only allow if token is refresh token
    if (!payload.refresh) {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        user: true,
      },
    });
    if (!session) {
      return null;
    }

    delete session.user.password;
    return session.user;
  }
}
