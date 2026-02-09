import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository;

  const mockCategory = {
    id: 1,
    name: 'Vehicles',
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockCategory),
    save: jest.fn().mockResolvedValue(mockCategory),
    find: jest.fn().mockResolvedValue([mockCategory]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(getRepositoryToken(Category));
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
