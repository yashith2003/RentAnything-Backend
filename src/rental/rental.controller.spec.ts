import { Test, TestingModule } from '@nestjs/testing';
import { RentalController } from './rental.controller';
import { RentalService } from './rental.service';

describe('RentalController', () => {
  let controller: RentalController;
  let service: RentalService;

  const mockRental = { id: 1 };

  const mockRentalService = {
    findAll: jest.fn().mockResolvedValue([mockRental]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentalController],
      providers: [
        {
          provide: RentalService,
          useValue: mockRentalService,
        },
      ],
    }).compile();

    controller = module.get<RentalController>(RentalController);
    service = module.get<RentalService>(RentalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
