//RentAnything-Backend/src/pricing/pricing.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

describe('PricingController', () => {
  let controller: PricingController;
  let service: PricingService;

  const mockPricing = { id: 1, price: 1000 };

  const mockPricingService = {
    create: jest.fn().mockResolvedValue(mockPricing),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
      ],
    }).compile();

    controller = module.get<PricingController>(PricingController);
    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { itemId: 1, rateType: 'daily', price: 1000 };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
