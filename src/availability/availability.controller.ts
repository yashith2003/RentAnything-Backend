//RentAnything-Backend/src/availability/availability.controller.ts

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get availability records for a specific item' })
  getByItemId(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.availabilityService.getByItemId(itemId);
  }
}
