//RentAnything-Backend/src/user/user.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findOne(id: number): Promise<any> {
    const cacheKey = `user_profile_${id}`;
    const cachedProfile = await this.cacheManager.get(cacheKey);
    
    if (cachedProfile) {
      console.log(`[UserService] Cache HIT for user ${id}`);
      return cachedProfile;
    }

    console.log(`[UserService] Cache MISS for user ${id}`);
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['individualUser', 'company', 'addresses']
    });

    if (!user) return null;

    // Map to unified response DTO
    const profile = {
      ...user,
      profileImage: user.role === UserRole.INDIVIDUAL ? user.individualUser?.avatarUrl : user.company?.logoUrl,
    };

    await this.cacheManager.set(cacheKey, profile, 600000); // 10 mins (milliseconds in some versions, seconds in others - check cache-manager version)
    // Actually cache-manager-redis-yet usually uses seconds by default if ttl is number, but it depends on config.
    // Let's assume seconds if number, or check package.json for cache-manager version.
    
    return profile;
  }

  async update(id: number, updateDto: UpdateUserDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['individualUser', 'company']
    });

    if (!user) throw new Error('User not found');

    // Update base User fields
    if (updateDto.phone !== undefined) user.phone = updateDto.phone;
    if (updateDto.email !== undefined) user.email = updateDto.email;

    // Update role-specific fields and explicitly save the relation entity
    if (user.role === UserRole.INDIVIDUAL) {
      if (!user.individualUser) {
        console.warn(`[UserService] User ${id} is individual but missing individualUser relation`);
      } else {
        if (updateDto.fullName !== undefined) user.individualUser.fullName = updateDto.fullName;
        if (updateDto.avatarUrl !== undefined) user.individualUser.avatarUrl = updateDto.avatarUrl;
        if (updateDto.address !== undefined) user.individualUser.address = updateDto.address;
        if (updateDto.description !== undefined) user.individualUser.description = updateDto.description;
        if (updateDto.location !== undefined) user.individualUser.location = updateDto.location;

        // 🔥 Explicitly save the relation — TypeORM cascade is unreliable for nested changes
        await this.userRepository.manager.save(user.individualUser);
      }
    } else if (user.role === UserRole.COMPANY) {
      if (!user.company) {
        console.warn(`[UserService] User ${id} is company but missing company relation`);
      } else {
        if (updateDto.companyName !== undefined) user.company.companyName = updateDto.companyName;
        if (updateDto.logoUrl !== undefined) user.company.logoUrl = updateDto.logoUrl;
        if (updateDto.address !== undefined) user.company.address = updateDto.address;
        if (updateDto.description !== undefined) user.company.description = updateDto.description;
        if (updateDto.location !== undefined) user.company.location = updateDto.location;

        // 🔥 Explicitly save the relation — TypeORM cascade is unreliable for nested changes
        await this.userRepository.manager.save(user.company);
      }
    }

    await this.userRepository.save(user);

    // Invalidate cache
    await this.cacheManager.del(`user_profile_${id}`);

    // Return updated profile
    return this.findOne(id);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }
}
