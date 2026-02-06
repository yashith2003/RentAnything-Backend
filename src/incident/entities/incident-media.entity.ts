//src/incident/entities/incident-media.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { IncidentReport } from './incident-report.entity';

@Entity('incident_media')
export class IncidentMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => IncidentReport, (incident) => incident.media)
  @JoinColumn({ name: 'incident_id' })
  incident: IncidentReport;

  @Column({ name: 'media_type' })
  mediaType: string;

  @Column({ name: 'media_url' })
  mediaUrl: string;
}
