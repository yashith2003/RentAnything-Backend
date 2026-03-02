//src/item/services/category-details.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleDetails } from '../entities/vehicle-details.entity';
import { ElectronicsDetails } from '../entities/electronics-details.entity';
import { HomeDetails } from '../entities/home-details.entity';
import { FashionDetails } from '../entities/fashion-details.entity';
import { SportsDetails } from '../entities/sports-details.entity';
import { Item } from '../entities/item.entity';
import { CreateVehicleDetailsDto } from '../dto/create-vehicle-details.dto';
import { CreateElectronicsDetailsDto } from '../dto/create-electronics-details.dto';
import { CreateHomeDetailsDto } from '../dto/create-home-details.dto';
import { CreateFashionDetailsDto } from '../dto/create-fashion-details.dto';
import { CreateSportsDetailsDto } from '../dto/create-sports-details.dto';

@Injectable()
export class CategoryDetailsService {
  constructor(
    @InjectRepository(VehicleDetails)
    private vehicleDetailsRepository: Repository<VehicleDetails>,
    @InjectRepository(ElectronicsDetails)
    private electronicsDetailsRepository: Repository<ElectronicsDetails>,
    @InjectRepository(HomeDetails)
    private homeDetailsRepository: Repository<HomeDetails>,
    @InjectRepository(FashionDetails)
    private fashionDetailsRepository: Repository<FashionDetails>,
    @InjectRepository(SportsDetails)
    private sportsDetailsRepository: Repository<SportsDetails>,
  ) {}

  async saveVehicleDetails(item: Item, dto: CreateVehicleDetailsDto): Promise<VehicleDetails> {
    const vehicleDetails = this.vehicleDetailsRepository.create({
      ...dto,
      item,
    });
    return await this.vehicleDetailsRepository.save(vehicleDetails);
  }

  async saveElectronicsDetails(item: Item, dto: CreateElectronicsDetailsDto): Promise<ElectronicsDetails> {
    const electronicsDetails = this.electronicsDetailsRepository.create({
      ...dto,
      item,
    });
    return await this.electronicsDetailsRepository.save(electronicsDetails);
  }

  async saveHomeDetails(item: Item, dto: CreateHomeDetailsDto): Promise<HomeDetails> {
    const homeDetails = this.homeDetailsRepository.create({
      ...dto,
      item,
    });
    return await this.homeDetailsRepository.save(homeDetails);
  }

  async saveFashionDetails(item: Item, dto: CreateFashionDetailsDto): Promise<FashionDetails> {
    const fashionDetails = this.fashionDetailsRepository.create({
      ...dto,
      item,
    });
    return await this.fashionDetailsRepository.save(fashionDetails);
  }

  async saveSportsDetails(item: Item, dto: CreateSportsDetailsDto): Promise<SportsDetails> {
    const sportsDetails = this.sportsDetailsRepository.create({
      ...dto,
      item,
    });
    return await this.sportsDetailsRepository.save(sportsDetails);
  }

  async getCategoryDetails(itemId: number, categoryName: string): Promise<any> {
    const normalizedCategory = categoryName.toLowerCase();
    
    if (normalizedCategory.includes('vehicle') || normalizedCategory.includes('car') || normalizedCategory.includes('bike') || normalizedCategory.includes('scooter') || normalizedCategory.includes('truck') || normalizedCategory.includes('cycle')) {
      return await this.vehicleDetailsRepository.findOne({ where: { item: { id: itemId } } });
    } else if (normalizedCategory.includes('electronic') || normalizedCategory.includes('phone') || normalizedCategory.includes('computer') || normalizedCategory.includes('tablet') || normalizedCategory.includes('camera') || normalizedCategory.includes('headphone')) {
      return await this.electronicsDetailsRepository.findOne({ where: { item: { id: itemId } } });
    } else if (normalizedCategory.includes('home') || normalizedCategory.includes('furniture') || normalizedCategory.includes('appliance') || normalizedCategory.includes('decoration') || normalizedCategory.includes('kitchen') || normalizedCategory.includes('bedding')) {
      return await this.homeDetailsRepository.findOne({ where: { item: { id: itemId } } });
    } else if (normalizedCategory.includes('fashion') || normalizedCategory.includes('cloth') || normalizedCategory.includes('shoe') || normalizedCategory.includes('men') || normalizedCategory.includes('women') || normalizedCategory.includes('kid') || normalizedCategory.includes('accessor')) {
      return await this.fashionDetailsRepository.findOne({ where: { item: { id: itemId } } });
    } else if (normalizedCategory.includes('sport') || normalizedCategory.includes('gym') || normalizedCategory.includes('cricket') || normalizedCategory.includes('football') || normalizedCategory.includes('tennis') || normalizedCategory.includes('badminton')) {
      return await this.sportsDetailsRepository.findOne({ where: { item: { id: itemId } } });
    }
    
    return null;
  }

  async deleteCategoryDetails(itemId: number, categoryName: string): Promise<void> {
    const normalizedCategory = categoryName.toLowerCase();
    
    if (normalizedCategory.includes('vehicle')) {
      await this.vehicleDetailsRepository.delete({ item: { id: itemId } as any });
    } else if (normalizedCategory.includes('electronic')) {
      await this.electronicsDetailsRepository.delete({ item: { id: itemId } as any });
    } else if (normalizedCategory.includes('home')) {
      await this.homeDetailsRepository.delete({ item: { id: itemId } as any });
    } else if (normalizedCategory.includes('fashion')) {
      await this.fashionDetailsRepository.delete({ item: { id: itemId } as any });
    } else if (normalizedCategory.includes('sport')) {
      await this.sportsDetailsRepository.delete({ item: { id: itemId } as any });
    }
  }
}
