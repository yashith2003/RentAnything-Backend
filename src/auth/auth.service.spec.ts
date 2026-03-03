//RentAnything-Backend/src/auth/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../user/entities/user.entity';
import { IndividualUser } from '../user/entities/individual-user.entity';
import { Company } from '../user/entities/company.entity';
import { Address } from '../address/entities/address.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository;
  let jwtService;

  const mockUser = {
    id: 1,
    phone: '+94771234567',
    email: 'test@example.com',
    role: UserRole.INDIVIDUAL,
    status: 'active',
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockIndividualUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCompanyRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAddressRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.refreshSecret') return 'refresh-secret';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return null;
    }),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(IndividualUser),
          useValue: mockIndividualUserRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return a success message if user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.login({ phone: mockUser.phone });
      expect(result).toEqual({ message: 'OTP sent successfully', phone: mockUser.phone });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.login({ phone: '123' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyOtp', () => {
    it('should return tokens if OTP is correct', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.verifyOtp({ phone: mockUser.phone, otp: '111111' });
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException if OTP is incorrect', async () => {
      await expect(
        service.verifyOtp({ phone: mockUser.phone, otp: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
