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
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateStoreDto, UpdateStoreDto } from './dto';
import { StoreService } from './store.service';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Controller('/stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @Post('/create')
  create(@Body() dto: CreateStoreDto) {
    return this.storeService.create(dto);
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.storeService.findAll();
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.findById(id);
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Patch('/:id')
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storeService.updateById(id, dto);
  }

  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.deleteById(id);
  }
}
