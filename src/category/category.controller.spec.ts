import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategory = {
    id: 1,
    name: 'Vehicles',
  };

  const mockCategoryService = {
    create: jest.fn().mockResolvedValue(mockCategory),
    findAll: jest.fn().mockResolvedValue([mockCategory]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'Vehicles' };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
