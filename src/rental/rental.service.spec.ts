import { Test, TestingModule } from '@nestjs/testing';
import { RentalService } from './rental.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';

describe('RentalService', () => {
  let service: RentalService;
  let repository;

  const mockRental = {
    id: 1,
    rentalRequest: { id: 1 },
  };

  const mockRepository = {
    find: jest.fn().mockResolvedValue([mockRental]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalService,
        {
          provide: getRepositoryToken(Rental),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RentalService>(RentalService);
    repository = module.get(getRepositoryToken(Rental));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all rentals with relations', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockRental]);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['rentalRequest'],
      });
    });
  });
});
