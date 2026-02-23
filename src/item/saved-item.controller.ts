//RentAnything-Backend/src/item/saved-item.controller.ts

import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SavedItemService } from './saved-item.service';

@ApiTags('items')
@Controller('items/saved')
export class SavedItemController {
  constructor(private readonly savedItemService: SavedItemService) {}

  @Post(':id/toggle')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle save status of an item' })
  toggle(@Param('id') id: string, @Request() req) {
    return this.savedItemService.toggle(req.user.id, +id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all saved items for the current user' })
  findAll(@Request() req) {
    return this.savedItemService.findAll(req.user.id);
  }

  @Get(':id/check')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if an item is saved by the current user' })
  check(@Param('id') id: string, @Request() req) {
    return this.savedItemService.isSaved(req.user.id, +id);
  }
}
