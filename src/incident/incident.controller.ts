//src/incident/incident.controller.ts

import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { GetUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IncidentReport } from './entities/incident-report.entity';

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new incident report' })
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @GetUser('id') userId: number,
  ): Promise<IncidentReport> {
    return await this.incidentService.create(createIncidentDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all incident reports' })
  async findAll(): Promise<IncidentReport[]> {
    return await this.incidentService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific incident report by ID' })
  async findOne(@Param('id') id: number): Promise<IncidentReport> {
    return await this.incidentService.findOne(id);
  }
}
