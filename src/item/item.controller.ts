//RentAnything-Backend/src/item/item.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile, UsePipes, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FilterItemsSchema } from './dto/filter-items.schema';
import type { FilterItemsDto } from './dto/filter-items.schema';

const uploadDir = join(process.cwd(), 'uploads');
const itemUploadDir = join(process.cwd(), 'uploads', 'item');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(itemUploadDir)) {
  fs.mkdirSync(itemUploadDir, { recursive: true });
}

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
  
  // General upload — used for new items (no ID yet), saves to uploads/item/
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, itemUploadDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload an item image (for new items, no ID yet)' })
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('[Upload] Received file:', file);
    if (!file) {
      throw new BadRequestException('No file was uploaded. Make sure you are sending a multipart/form-data request with a "file" field.');
    }
    const url = `uploads/item/${file.filename}`;
    console.log('[Upload] Saved item image at:', url);
    return { url };
  }

  // Item-specific upload — saves to uploads/item/:id/
  @Post(':id/upload-image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const itemDir = join(process.cwd(), 'uploads', 'item', String(req.params.id));
        if (!fs.existsSync(itemDir)) {
          fs.mkdirSync(itemDir, { recursive: true });
        }
        cb(null, itemDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload an image for an existing item — saves to uploads/item/:id/' })
  uploadItemImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    console.log(`[Upload] Received image for item ${id}:`, file);
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }
    const url = `uploads/item/${id}/${file.filename}`;
    console.log('[Upload] Saved item image at:', url);
    return { url };
  }


  @Get()
  @ApiOperation({ summary: 'Get all items with optional category and dynamic filters' })
  @UsePipes(new ZodValidationPipe(FilterItemsSchema))
  findAll(@Query() query: FilterItemsDto) {
    const { cat, ...filters } = query;
    return this.itemService.findAll(cat ? +cat : undefined, filters);
  }

  @Get('map')
  @ApiOperation({ summary: 'Get items for map view' })
  @UsePipes(new ZodValidationPipe(FilterItemsSchema))
  getMapItems(@Query() query: FilterItemsDto) {
    const { cat, neLat, neLng, swLat, swLng, ...filters } = query as any;
    return this.itemService.findWithinBounds(
      { neLat: +neLat, neLng: +neLng, swLat: +swLat, swLng: +swLng },
      cat ? +cat : undefined,
      filters,
    );
  }

  @Get('my-items')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get items listed by the current user' })
  findMyItems(@Request() req) {
    console.log(`[ItemController] User ${req.user.id} is requesting their listings`);
    return this.itemService.findMyItems(req.user.id);
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
