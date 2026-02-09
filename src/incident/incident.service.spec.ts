import { Test, TestingModule } from '@nestjs/testing';
import { IncidentService } from './incident.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IncidentReport } from './entities/incident-report.entity';
import { User } from '../user/entities/user.entity';
import { Rental } from '../rental/entities/rental.entity';
import { NotFoundException } from '@nestjs/common';

describe('IncidentService', () => {
  let service: IncidentService;
  let incidentRepository;
  let rentalRepository;
  let userRepository;

  const mockRental = { id: 1 };
  const mockUser = { id: 1 };
  const mockIncident = {
    id: 1,
    description: 'Test Incident',
    rental: mockRental,
    reportedBy: mockUser,
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockIncident),
    save: jest.fn().mockResolvedValue(mockIncident),
    find: jest.fn().mockResolvedValue([mockIncident]),
    findOne: jest.fn().mockResolvedValue(mockIncident),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentService,
        {
          provide: getRepositoryToken(IncidentReport),
          useValue: {
            create: jest.fn().mockReturnValue(mockIncident),
            save: jest.fn().mockResolvedValue(mockIncident),
            find: jest.fn().mockResolvedValue([mockIncident]),
            findOne: jest.fn().mockResolvedValue(mockIncident),
          },
        },
        {
          provide: getRepositoryToken(Rental),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockRental),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<IncidentService>(IncidentService);
    incidentRepository = module.get(getRepositoryToken(IncidentReport));
    rentalRepository = module.get(getRepositoryToken(Rental));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an incident report', async () => {
      const dto = { rentalId: 1, description: 'Test Incident' };
      const result = await service.create(dto, 1);
      expect(result).toEqual(mockIncident);
      expect(rentalRepository.findOne).toHaveBeenCalled();
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(incidentRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if rental not found', async () => {
      rentalRepository.findOne.mockResolvedValue(null);
      await expect(service.create({ rentalId: 999, description: '...' }, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all incidents', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockIncident]);
    });
  });

  describe('findOne', () => {
    it('should return a specific incident', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockIncident);
    });

    it('should throw NotFoundException if incident not found', async () => {
      incidentRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
