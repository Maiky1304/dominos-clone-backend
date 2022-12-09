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
} from '@nestjs/common';
import { CreateStoreDto, UpdateStoreDto } from './dto';

@Controller('/stores')
export class StoreController {
  @HttpCode(HttpStatus.CREATED)
  @Post('/create')
  create(@Body() dto: CreateStoreDto) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {}

  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  findById(@Param('id', ParseIntPipe) id: number) {}

  @HttpCode(HttpStatus.OK)
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStoreDto) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {}
}
