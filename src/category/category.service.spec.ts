import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { FilterConfig } from './entities/filter-config.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository;
  let filterConfigRepository;
  let cacheManager;

  const mockCategory = {
    id: 1,
    name: 'Vehicles',
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockCategory),
    save: jest.fn().mockResolvedValue(mockCategory),
    find: jest.fn().mockResolvedValue([mockCategory]),
    findOne: jest.fn().mockResolvedValue(mockCategory),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(FilterConfig),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(getRepositoryToken(Category));
    filterConfigRepository = module.get(getRepositoryToken(FilterConfig));
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Vehicles' };
      const result = await service.create(dto);
      expect(result).toEqual(mockCategory);
      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        parentCategory: null,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
    });
  });
});
