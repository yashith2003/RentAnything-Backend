//src/incident/incident.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentReport } from './entities/incident-report.entity';
import { IncidentMedia } from './entities/incident-media.entity';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { Rental } from '../rental/entities/rental.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IncidentReport, IncidentMedia, Rental, User])],
  controllers: [IncidentController],
  providers: [IncidentService],
})
export class IncidentModule {}
