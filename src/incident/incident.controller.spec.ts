//RentAnything-Backend/src/incident/incident.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

describe('IncidentController', () => {
  let controller: IncidentController;
  let service: IncidentService;

  const mockIncident = { id: 1, description: 'Test' };

  const mockIncidentService = {
    create: jest.fn().mockResolvedValue(mockIncident),
    findAll: jest.fn().mockResolvedValue([mockIncident]),
    findOne: jest.fn().mockResolvedValue(mockIncident),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentController],
      providers: [
        {
          provide: IncidentService,
          useValue: mockIncidentService,
        },
      ],
    }).compile();

    controller = module.get<IncidentController>(IncidentController);
    service = module.get<IncidentService>(IncidentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { rentalId: 1, description: 'Test' };
      await controller.create(dto, 1);
      expect(service.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});
