import { Test, TestingModule } from '@nestjs/testing';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

describe('AddressController', () => {
  let controller: AddressController;
  let service: AddressService;

  const mockAddress = { id: 1, address: '123 Test St' };

  const mockAddressService = {
    create: jest.fn().mockResolvedValue(mockAddress),
    findAll: jest.fn().mockResolvedValue([mockAddress]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        {
          provide: AddressService,
          useValue: mockAddressService,
        },
      ],
    }).compile();

    controller = module.get<AddressController>(AddressController);
    service = module.get<AddressService>(AddressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { address: '123 Test St' };
      const req = { user: { id: 1 } };
      await controller.create(dto, req);
      expect(service.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const req = { user: { id: 1 } };
      await controller.findAll(req);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });
});
