//src/auth/auth.service.ts

import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    });
    await this.addressRepository.save(address);

    return { message: 'Individual registration successful' };
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
    });
    await this.addressRepository.save(address);

    return { message: 'Company registration successful' };
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
    if (dto.otp !== '1111') {
      throw new UnauthorizedException('Invalid OTP');
    }

    const user = await this.userRepository.findOne({ 
      where: { phone: dto.phone },
      relations: ['individualUser', 'company']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

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
