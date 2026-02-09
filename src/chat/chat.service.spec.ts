import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatThread } from './entities/chat-thread.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('ChatService', () => {
  let service: ChatService;
  let threadRepository;
  let messageRepository;
  let cacheManager;

  const mockThread = { id: 1, buyer: { id: 1 }, seller: { id: 2 } };
  const mockMessage = { id: 1, content: 'Hello', sender: { id: 1 } };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatThread),
          useValue: {
            create: jest.fn().mockReturnValue(mockThread),
            save: jest.fn().mockResolvedValue(mockThread),
            find: jest.fn().mockResolvedValue([mockThread]),
          },
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: {
            create: jest.fn().mockReturnValue(mockMessage),
            save: jest.fn().mockResolvedValue(mockMessage),
            find: jest.fn().mockResolvedValue([mockMessage]),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    threadRepository = module.get(getRepositoryToken(ChatThread));
    messageRepository = module.get(getRepositoryToken(ChatMessage));
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createThread', () => {
    it('should create a chat thread', async () => {
      const result = await service.createThread(1, 1, 2);
      expect(result).toEqual(mockThread);
      expect(threadRepository.create).toHaveBeenCalled();
    });
  });

  describe('saveMessage', () => {
    it('should save a message and invalidate cache', async () => {
      const result = await service.saveMessage(1, 1, 'Hello');
      expect(result).toEqual(mockMessage);
      expect(messageRepository.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith('thread_1_messages');
    });
  });

  describe('getThreadMessages', () => {
    it('should return messages from cache if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockMessage]);
      const result = await service.getThreadMessages(1);
      expect(result).toEqual([mockMessage]);
    });

    it('should fetch from repo and set cache if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const result = await service.getThreadMessages(1);
      expect(result).toEqual([mockMessage]);
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getUserThreads', () => {
    it('should return all threads for a user', async () => {
      const result = await service.getUserThreads(1);
      expect(result).toEqual([mockThread]);
    });
  });
});
