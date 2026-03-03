//RentAnything-Backend/src/pricing/pricing.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ItemPricing } from './entities/item-pricing.entity';

describe('PricingService', () => {
  let service: PricingService;
  let repository;

  const mockPricing = {
    id: 1,
    rateType: 'daily',
    price: 1000,
    item: { id: 1 },
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockPricing),
    save: jest.fn().mockResolvedValue(mockPricing),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getRepositoryToken(ItemPricing),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    repository = module.get(getRepositoryToken(ItemPricing));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a pricing record', async () => {
      const dto = { itemId: 1, rateType: 'daily', price: 1000 };
      const result = await service.create(dto);
      expect(result).toEqual(mockPricing);
      expect(repository.create).toHaveBeenCalledWith({
        rateType: dto.rateType,
        price: dto.price,
        item: { id: dto.itemId },
      });
    });
  });
});
