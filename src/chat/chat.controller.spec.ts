import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockThread = { id: 1 };
  const mockMessage = { id: 1, content: 'Hello' };

  const mockChatService = {
    createThread: jest.fn().mockResolvedValue(mockThread),
    getUserThreads: jest.fn().mockResolvedValue([mockThread]),
    getThreadMessages: jest.fn().mockResolvedValue([mockMessage]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createThread', () => {
    it('should call service.createThread', async () => {
      const req = { user: { id: 1 } };
      await controller.createThread(1, 2, req);
      expect(service.createThread).toHaveBeenCalledWith(1, 1, 2);
    });
  });

  describe('getUserThreads', () => {
    it('should call service.getUserThreads', async () => {
      const req = { user: { id: 1 } };
      await controller.getUserThreads(req);
      expect(service.getUserThreads).toHaveBeenCalledWith(1);
    });
  });

  describe('getThreadMessages', () => {
    it('should call service.getThreadMessages', async () => {
      await controller.getThreadMessages(1);
      expect(service.getThreadMessages).toHaveBeenCalledWith(1);
    });
  });
});
