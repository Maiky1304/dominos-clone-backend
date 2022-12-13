import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { Session } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateSessionDto) {
    const session = await this.prisma.session.findUnique({
      where: {
        userId: dto.userId,
      },
    });
    if (session) {
      await this.prisma.session.delete({
        where: { userId: dto.userId },
      });
    }

    return await this.prisma.session.create({
      data: dto,
    });
  }

  async invalidateSession(session: Session) {
    await this.prisma.session.delete({
      where: {
        id: session.id,
      },
    });
  }
}
