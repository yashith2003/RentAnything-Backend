import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './../src/category/entities/category.entity';

describe('CategoryModule (e2e)', () => {
  let app: INestApplication;
  let categoryRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('CACHE_MANAGER')
    .useValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    categoryRepository = moduleFixture.get(getRepositoryToken(Category));

    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup() {
    const categories = await categoryRepository.find({ where: { name: 'E2E Category' } });
    await categoryRepository.remove(categories);
  }

  it('/api/categories (POST) - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/categories')
      .send({ name: 'E2E Category' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('E2E Category');
    expect(res.body.data.id).toBeDefined();
  });

  it('/api/categories (GET) - Success', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some(c => c.name === 'E2E Category')).toBe(true);
  });
});
