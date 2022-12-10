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
    if (
      (await this.prisma.store.findUnique({
        where: { name: dto.name },
      })) ||
      (await this.prisma.store.findUnique({ where: { address: dto.address } }))
    ) {
      throw new ConflictException(
        `Store with this name or address already exists`,
      );
    }

    const store = await this.prisma.store.create({
      data: dto,
    });
    return store;
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
    const query = { where: { id } };
    const store = await this.prisma.store.findUnique(query);

    if (!store) {
      throw new NotFoundException(`Store with id could ${id} not found`);
    }

    return await this.prisma.store.update({
      ...query,
      data: dto,
    });
  }

  async deleteById(id: number) {
    const query = { where: { id } };
    const store = await this.prisma.store.findUnique(query);

    if (!store) {
      throw new NotFoundException(`Store with id could ${id} not found`);
    }

    await this.prisma.store.delete(query);
    return { message: 'Store deleted successfully' };
  }
}
