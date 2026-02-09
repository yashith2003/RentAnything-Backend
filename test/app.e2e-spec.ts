import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api');
    
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      status: 'success',
      message: 'RentAnything API is running',
      version: '1.0.0',
    });
  });
});
