//src/availability/availability.controller.ts

import { Post, Body, UseGuards, Controller } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@ApiTags('availability')
@Controller('availability')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Availability creation is now handled through ItemController
  // when creating items with availability data
}
