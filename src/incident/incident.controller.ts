//src/incident/incident.controller.ts

import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { GetUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IncidentReport } from './entities/incident-report.entity';

@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @GetUser('id') userId: number,
  ): Promise<IncidentReport> {
    return await this.incidentService.create(createIncidentDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<IncidentReport[]> {
    return await this.incidentService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<IncidentReport> {
    return await this.incidentService.findOne(id);
  }
}
