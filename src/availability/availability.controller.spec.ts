import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let service: AvailabilityService;

  const mockAvailability = { id: 1, availableDate: '2026-02-10' };

  const mockAvailabilityService = {
    create: jest.fn().mockResolvedValue([mockAvailability]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: mockAvailabilityService,
        },
      ],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    service = module.get<AvailabilityService>(AvailabilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { itemId: 1, fromDate: '2026-02-10', toDate: '2026-02-11' };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
