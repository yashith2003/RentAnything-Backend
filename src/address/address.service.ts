//src/address/address.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import axios from 'axios';

import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async create(dto: CreateAddressDto, userId: number) {
    const address = this.addressRepository.create({
      address: dto.address,
      lat: dto.lat,
      lng: dto.lng,
      placeId: dto.placeId,
      user: { id: userId } as any,
    });
    return this.addressRepository.save(address);
  }

  async search(query: string) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'lk', // Restrict to Sri Lanka
        },
        headers: {
          'User-Agent': 'RentAnything-App',
        },
      });

      return response.data.map((item: any) => {
        const parts = item.display_name.split(',');
        return {
          address: item.display_name,
          mainText: parts[0].trim(),
          secondaryText: parts.slice(1).join(',').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          placeId: item.place_id.toString(),
        };
      });
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  async findAll(userId: number) {
    const addresses = await this.addressRepository.find({
      where: { user: { id: userId } as any },
      order: { updatedAt: 'DESC' },
    });

    return addresses.map((addr) => {
      const parts = addr.address.split(',');
      return {
        ...addr,
        mainText: parts[0].trim(),
        secondaryText: parts.slice(1).join(',').trim(),
      };
    });
  }
}
