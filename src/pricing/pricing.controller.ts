//src/pricing/pricing.controller.ts

import { Post, Body, UseGuards, Controller } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';

@ApiTags('pricing')
@Controller('pricing')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @ApiOperation({ summary: 'Set pricing for an item' })
  create(@Body() dto: CreatePricingDto) {
    return this.pricingService.create(dto);
  }
}
