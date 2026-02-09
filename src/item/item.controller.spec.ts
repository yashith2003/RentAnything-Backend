import { Test, TestingModule } from '@nestjs/testing';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';

describe('ItemController', () => {
  let controller: ItemController;
  let service: ItemService;

  const mockItem = { id: 1, title: 'Test Item' };

  const mockItemService = {
    create: jest.fn().mockResolvedValue(mockItem),
    findAll: jest.fn().mockResolvedValue([mockItem]),
    findOne: jest.fn().mockResolvedValue(mockItem),
    update: jest.fn().mockResolvedValue(mockItem),
    remove: jest.fn().mockResolvedValue(mockItem),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [
        {
          provide: ItemService,
          useValue: mockItemService,
        },
      ],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    service = module.get<ItemService>(ItemService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { title: 'Test Item' } as any;
      const req = { user: { id: 1 } };
      await controller.create(dto, req);
      expect(service.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      await controller.findAll('1');
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { title: 'Updated' } as any;
      await controller.update('1', dto);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
