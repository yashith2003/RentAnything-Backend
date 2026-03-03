//RentAnything-Backend/src/user/user.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = { id: 1, email: 'test@example.com' };

  const mockUserService = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call service.findOne with req.user.id', async () => {
      const req = { user: { id: 1 } };
      await controller.getProfile(req);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});
