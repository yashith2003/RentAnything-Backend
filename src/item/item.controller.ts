import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@ApiTags('items')
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new item' })
  create(@Body() dto: CreateItemDto, @Request() req) {
    return this.itemService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items' })
  findAll(@Query('cat') categoryId?: string) {
    return this.itemService.findAll(categoryId ? +categoryId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific item by ID' })
  findOne(@Param('id') id: string) {
    return this.itemService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing item' })
  update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an item' })
  remove(@Param('id') id: string) {
    return this.itemService.remove(+id);
  }
}
