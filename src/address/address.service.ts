//src/address/address.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

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
      user: { id: userId } as any,
    });
    return this.addressRepository.save(address);
  }

  async findAll(userId: number) {
    return this.addressRepository.find({
      where: { user: { id: userId } as any },
    });
  }
}
