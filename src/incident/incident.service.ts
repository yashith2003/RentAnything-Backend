//RentAnything-Backend/src/incident/incident.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentReport } from './entities/incident-report.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { User } from '../user/entities/user.entity';
import { Rental } from '../rental/entities/rental.entity';
import { IncidentMedia } from './entities/incident-media.entity';

@Injectable()
export class IncidentService {
  constructor(
    @InjectRepository(IncidentReport)
    private readonly incidentRepository: Repository<IncidentReport>,
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto, reporterId: number | string): Promise<IncidentReport> {
    if (typeof reporterId === 'string' && reporterId.startsWith('guest')) {
      throw new BadRequestException('Guests cannot report incidents. Please signup.');
    }
    const numericReporterId = Number(reporterId);
    const rental = await this.rentalRepository.findOne({ where: { id: createIncidentDto.rentalId } });
    if (!rental) {
      throw new NotFoundException(`Rental with ID ${createIncidentDto.rentalId} not found`);
    }

    const reporter = await this.userRepository.findOne({ where: { id: numericReporterId } });
    if (!reporter) {
      throw new NotFoundException(`User with ID ${numericReporterId} not found`);
    }

    const incident = this.incidentRepository.create({
      rental,
      reportedBy: reporter,
      description: createIncidentDto.description,
      media: createIncidentDto.media?.map(m => {
        const media = new IncidentMedia();
        media.mediaType = m.mediaType;
        media.mediaUrl = m.mediaUrl;
        return media;
      })
    });

    return await this.incidentRepository.save(incident);
  }

  async findAll(): Promise<IncidentReport[]> {
    return await this.incidentRepository.find({ relations: ['rental', 'reportedBy', 'media'] });
  }

  async findOne(id: number): Promise<IncidentReport> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['rental', 'reportedBy', 'media'],
    });
    if (!incident) {
      throw new NotFoundException(`Incident report with ID ${id} not found`);
    }
    return incident;
  }
}
