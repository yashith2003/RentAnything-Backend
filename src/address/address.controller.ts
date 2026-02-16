//src/address/address.controller.ts

import { Get, Post, Body, UseGuards, Request, Controller, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new address' })
  create(@Body() dto: CreateAddressDto, @Request() req) {
    return this.addressService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user addresses' })
  findAll(@Request() req) {
    return this.addressService.findAll(req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for addresses using Nominatim' })
  search(@Query('q') q: string) {
    return this.addressService.search(q);
  }
}
