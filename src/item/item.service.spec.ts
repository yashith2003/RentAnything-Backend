import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { Address } from '../address/entities/address.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ItemPricing } from '../pricing/entities/item-pricing.entity';
import { Availability } from '../availability/entities/availability.entity';
import { CategoryDetailsService } from './services/category-details.service';
import { NotFoundException } from '@nestjs/common';

describe('ItemService', () => {
  let service: ItemService;
  let itemRepository;
  let cacheManager;

  const mockItem = {
    id: 1,
    title: 'Test Item',
    description: 'Description',
    category: { id: 1 },
    owner: { id: 1, totalListings: 0 },
    averageRating: 0,
    reviewCount: 0,
    categoryDetails: undefined,
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockItem),
    save: jest.fn().mockResolvedValue(mockItem),
    find: jest.fn().mockResolvedValue([mockItem]),
    findOne: jest.fn().mockResolvedValue(mockItem),
    count: jest.fn().mockResolvedValue(0),
    remove: jest.fn().mockResolvedValue(mockItem),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockItem]),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [mockItem],
        raw: [{}],
      }),
    }),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockCategoryDetailsService = {
    saveVehicleDetails: jest.fn(),
    saveElectronicsDetails: jest.fn(),
    saveHomeDetails: jest.fn(),
    saveFashionDetails: jest.fn(),
    saveSportsDetails: jest.fn(),
    getCategoryDetails: jest.fn(),
    deleteCategoryDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            ...mockRepository,
            query: jest.fn().mockResolvedValue([{ id: 1 }]),
          },
        },
        {
          provide: getRepositoryToken(Address),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ItemPricing),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: mockRepository,
        },
        {
          provide: CategoryDetailsService,
          useValue: mockCategoryDetailsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    itemRepository = module.get(getRepositoryToken(Item));
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return an item', async () => {
      const dto = { title: 'Test Item', categoryId: 1, addressId: 1 } as any;
      const result = await service.create(dto, 1);
      expect(result).toEqual(mockItem);
      expect(itemRepository.create).toHaveBeenCalled();
      expect(itemRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return items from cache if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockItem]);
      const result = await service.findAll();
      expect(result).toEqual([mockItem]);
      expect(mockCacheManager.get).toHaveBeenCalledWith('all_items');
    });

    it('should fetch from repo and set cache if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await service.findAll(1);
      expect(result).toEqual([mockItem]);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an item', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and invalidate cache', async () => {
      mockRepository.findOne.mockResolvedValue(mockItem);
      const dto = { title: 'Updated' } as any;
      const result = await service.update(1, dto);
      expect(result).toEqual(mockItem);
      expect(mockCacheManager.del).toHaveBeenCalledWith('all_items');
    });
  });

  describe('remove', () => {
    it('should remove and invalidate cache', async () => {
      mockRepository.findOne.mockResolvedValue(mockItem);
      const result = await service.remove(1);
      expect(result).toEqual(mockItem);
      expect(itemRepository.remove).toHaveBeenCalled();
    });
  });
});
