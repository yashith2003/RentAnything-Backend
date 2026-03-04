//RentAnything-Backend/src/item/item.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile, UsePipes, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ItemService } from './item.service';
import { ImageProcessingService } from '../common/services/image-processing.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FilterItemsSchema } from './dto/filter-items.schema';
import type { FilterItemsDto } from './dto/filter-items.schema';

@ApiTags('items')
@Controller('items')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

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
    storage: memoryStorage()
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload an item image (for new items, no ID yet)' })
  async uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
    console.log('[Upload] Received file buffer size:', file?.size);
    if (!file) {
      throw new BadRequestException('No file was uploaded. Make sure you are sending a multipart/form-data request with a "file" field.');
    }
    
    const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
    const relativePath = `items/${req.user.id}/${randomName}.webp`;

    const savedPath = await this.imageProcessingService.processAndSave(file.buffer, relativePath, {
      format: 'webp',
      quality: 80,
      maxWidth: 1600,
      watermarkText: 'RentAnything',
    });

    console.log('[Upload] Saved item image at:', savedPath);
    return { url: savedPath };
  }

  // Item-specific upload — saves to uploads/item/:id/
  @Post(':id/upload-image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage()
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload an image for an existing item — saves to uploads/item/:id/' })
  async uploadItemImage(@Param('id') id: string, @Request() req: any, @UploadedFile() file: Express.Multer.File) {
    console.log(`[Upload] Received image buffer size for item ${id}:`, file?.size);
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }

    const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
    const relativePath = `items/${req.user.id}/${id}/${randomName}.webp`;

    const savedPath = await this.imageProcessingService.processAndSave(file.buffer, relativePath, {
      format: 'webp',
      quality: 80,
      maxWidth: 1600,
      watermarkText: 'RentAnything',
    });

    console.log('[Upload] Saved item image at:', savedPath);
    return { url: savedPath };
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

  @Get('trending')
  @ApiOperation({ summary: 'Get trending items with advanced ranking' })
  @UsePipes(new ZodValidationPipe(FilterItemsSchema))
  findTrending(@Query() query: FilterItemsDto) {
    const { cat, ...filters } = query;
    return this.itemService.findTrending(cat ? +cat : undefined, filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search items using hybrid full-text and similarity ranking' })
  @UsePipes(new ZodValidationPipe(FilterItemsSchema))
  search(@Query() query: FilterItemsDto) {
    const { q, page, limit, ...filters } = query;
    const catId = query.cat || query.categoryId || query.category;
    return this.itemService.search(
      q || '', 
      catId ? +catId : undefined, 
      page ? +page : 1, 
      limit ? +limit : 20, 
      filters
    );
  }

  @Post(':id/interact')
  @ApiOperation({ summary: 'Record a user interaction with an item (VIEW, CALL, CHAT)' })
  async recordInteraction(
    @Param('id') id: string,
    @Body('type') type: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'] || 'anonymous'; // Fallback for guest sessions
    await this.itemService.recordInteraction(+id, type, userId, sessionId as string);
    return { success: true };
  }

  @Get('my-items')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get items listed by the current user' })
  findMyItems(@Request() req) {
    console.log(`[ItemController] User ${req.user.id} is requesting their listings`);
    return this.itemService.findMyItems(req.user.id);
  }

  @Get('my-items/reviews')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my items with review statistics' })
  findMyItemsWithReviews(@Request() req) {
    return this.itemService.findMyItemsWithReviewStats(req.user.id);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get items listed by a specific owner' })
  findItemsByOwner(@Param('ownerId') ownerId: string) {
    return this.itemService.findByOwner(+ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific item by ID' })
  findOne(@Param('id') id: string) {
    const numericId = +id;
    if (isNaN(numericId)) {
        throw new BadRequestException('Invalid item ID');
    }
    return this.itemService.findOne(numericId);
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
