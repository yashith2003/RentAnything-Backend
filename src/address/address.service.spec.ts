import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';

describe('AddressService', () => {
  let service: AddressService;
  let repository;

  const mockAddress = {
    id: 1,
    address: '123 Test St',
    user: { id: 1 },
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockAddress),
    save: jest.fn().mockResolvedValue(mockAddress),
    find: jest.fn().mockResolvedValue([mockAddress]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    repository = module.get(getRepositoryToken(Address));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an address', async () => {
      const dto = { address: '123 Test St' };
      const result = await service.create(dto, 1);
      expect(result).toEqual(mockAddress);
      expect(repository.create).toHaveBeenCalledWith({
        address: dto.address,
        user: { id: 1 },
      });
    });
  });

  describe('findAll', () => {
    it('should return user addresses', async () => {
      const result = await service.findAll(1);
      expect(result).toEqual([mockAddress]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
      });
    });
  });
});
