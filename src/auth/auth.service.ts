//src/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/entities/user.entity';
import { IndividualUser } from '../user/entities/individual-user.entity';
import { Company } from '../user/entities/company.entity';
import { Address } from '../address/entities/address.entity';
import { RegisterIndividualDto, RegisterCompanyDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CheckEmailDto } from './dto/check-email.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(IndividualUser)
    private individualUserRepository: Repository<IndividualUser>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async generateTokens(user: User) {
    const payload = { 
      sub: user.id, 
      phone: user.phone, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<any>('jwt.refreshExpiresIn'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async checkEmail(dto: CheckEmailDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (user) {
      throw new ConflictException('Email already registered');
    }
    return { available: true };
  }

  async registerIndividual(dto: RegisterIndividualDto) {
    const existingUserByPhone = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    if (dto.email) {
      const existingUserByEmail = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingUserByEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    // Cache the registration data for 10 minutes (600 seconds * 1000ms)
    await this.cacheManager.set(`reg_ind_${dto.phone}`, dto, 600000);

    return { message: 'OTP sent successfully. Please verify to complete registration.' };
  }

  private async persistIndividual(dto: RegisterIndividualDto) {
    const user = this.userRepository.create({
      phone: dto.phone,
      email: dto.email,
      role: UserRole.INDIVIDUAL,
      status: 'active',
    });

    const savedUser = await this.userRepository.save(user);

    const individual = this.individualUserRepository.create({
      user: savedUser,
      fullName: dto.fullName,
    });
    await this.individualUserRepository.save(individual);

    const address = this.addressRepository.create({
      user: savedUser,
      address: dto.address,
      lat: dto.lat,
      lng: dto.lng,
      placeId: dto.placeId,
    });
    await this.addressRepository.save(address);

    return savedUser;
  }

  async registerCompany(dto: RegisterCompanyDto) {
    const existingUserByPhone = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    if (dto.email) {
      const existingUserByEmail = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingUserByEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    // Cache the registration data for 10 minutes
    await this.cacheManager.set(`reg_comp_${dto.phone}`, dto, 600000);

    return { message: 'OTP sent successfully. Please verify to complete registration.' };
  }

  private async persistCompany(dto: RegisterCompanyDto) {
    const user = this.userRepository.create({
      phone: dto.phone,
      email: dto.email,
      role: UserRole.COMPANY,
      status: 'active',
    });

    const savedUser = await this.userRepository.save(user);

    const company = this.companyRepository.create({
      user: savedUser,
      companyName: dto.companyName,
      registrationNumber: dto.registrationNumber,
    });
    await this.companyRepository.save(company);

    const address = this.addressRepository.create({
      user: savedUser,
      address: dto.officeAddress,
      lat: dto.lat,
      lng: dto.lng,
      placeId: dto.placeId,
    });
    await this.addressRepository.save(address);

    return savedUser;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (!user) {
      throw new NotFoundException('User not found. Please register first.');
    }

    // In a real app, send OTP here. For now, it's mocked to 1111.
    return { message: 'OTP sent successfully', phone: dto.phone };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    console.log(`[AuthService.verifyOtp] START - phone: "${dto.phone}", otp: "${dto.otp}"`);
    if (dto.otp !== '111111') {
      console.warn(`[AuthService.verifyOtp] INVALID OTP - expected 111111, got ${dto.otp}`);
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check for cached registration data first
    const cachedInd = await this.cacheManager.get<RegisterIndividualDto>(`reg_ind_${dto.phone}`);
    if (cachedInd) {
      await this.persistIndividual(cachedInd);
      await this.cacheManager.del(`reg_ind_${dto.phone}`);
    } else {
      const cachedComp = await this.cacheManager.get<RegisterCompanyDto>(`reg_comp_${dto.phone}`);
      if (cachedComp) {
        await this.persistCompany(cachedComp);
        await this.cacheManager.del(`reg_comp_${dto.phone}`);
      }
    }

    console.log(`[AuthService.verifyOtp] Querying for user with phone: "${dto.phone}" (length: ${dto.phone?.length})`);
    const user = await this.userRepository.findOne({ 
      where: { phone: dto.phone },
      relations: ['individualUser', 'company']
    });
    
    if (!user) {
      console.error(`User not found for phone during OTP verification: ${dto.phone}`);
      throw new NotFoundException('User not found. Please register first.');
    }

    console.log(`[AuthService] Found user: id=${user.id}, phone=${user.phone}, role=${user.role}`);
    console.log(`[AuthService] User relations - individualUser: ${!!user.individualUser}, company: ${!!user.company}`);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.role === UserRole.INDIVIDUAL ? user.individualUser?.fullName : user.company?.companyName,
      }
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({ 
        where: { id: payload.sub },
        relations: ['individualUser', 'company']
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
