import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoreDto, UpdateStoreDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStoreDto) {
    try {
      const store = await this.prisma.store.create({
        data: dto,
      });
      return store;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Store with this name or address already exists',
        );
      }
    }
  }

  async findAll() {
    const stores = await this.prisma.store.findMany();
    return stores;
  }

  async findById(id: number) {
    const store = await this.prisma.store.findUnique({
      where: {
        id,
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with id could ${id} not found`);
    }

    return store;
  }

  async updateById(id: number, dto: UpdateStoreDto) {
    const store = await this.prisma.store.update({
      where: {
        id,
      },
      data: dto,
    });

    if (!store) {
      throw new NotFoundException(`Store with id could ${id} not found`);
    }

    return store;
  }

  async deleteById(id: number) {
    const store = await this.prisma.store.delete({
      where: {
        id,
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with id could ${id} not found`);
    }

    return { message: 'Store deleted successfully' };
  }
}
