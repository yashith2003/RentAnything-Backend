import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('UserService', () => {
  let service: UserService;
  let repository;
  let cacheManager;

  const mockUser = {
    id: 1,
    phone: '+94771234567',
    email: 'test@example.com',
  };

  const mockRepository = {
    findOne: jest.fn().mockResolvedValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    manager: {
      save: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['individualUser', 'company', 'addresses'],
      });
    });
  });

  describe('findByPhone', () => {
    it('should return a user by phone', async () => {
      const result = await service.findByPhone('+94771234567');
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { phone: '+94771234567' },
      });
    });
  });
});
