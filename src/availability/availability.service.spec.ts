//RentAnything-Backend/src/availability/availability.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Availability } from './entities/availability.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let repository;

  const mockAvailability = {
    id: 1,
    availableDate: '2026-02-10',
    item: { id: 1 },
    isAvailable: true,
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockAvailability),
    save: jest.fn().mockResolvedValue([mockAvailability]),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(Availability),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    repository = module.get(getRepositoryToken(Availability));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
