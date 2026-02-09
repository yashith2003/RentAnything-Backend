import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../src/user/entities/user.entity';

import { IndividualUser } from './../src/user/entities/individual-user.entity';
import { Address as AddressEntity } from './../src/address/entities/address.entity';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let userRepository;
  let individualRepository;
  let addressRepository;

  const testUser = {
    phone: '+94771234567',
    email: 'e2e-test@example.com',
    fullName: 'E2E Test User',
    address: '123 E2E Test St, Colombo',
  };

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

    // Replicate main.ts setup
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    individualRepository = moduleFixture.get(getRepositoryToken(IndividualUser));
    addressRepository = moduleFixture.get(getRepositoryToken(AddressEntity));

    // Cleanup before tests
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup() {
    const user = await userRepository.findOne({ where: { phone: testUser.phone } });
    if (user) {
      // Delete child records first
      await addressRepository.delete({ user: { id: user.id } });
      await individualRepository.delete({ user: { id: user.id } });
      await userRepository.remove(user);
    }
  }

  it('/api/auth/register/individual (POST) - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register/individual')
      .send(testUser);
    
    if (res.status !== 201) {
      console.log('REGISTRATION ERROR:', JSON.stringify(res.body, null, 2));
    }
    
    expect(res.status).toBe(201);
    expect(res.body.data.message).toBe('Individual registration successful');
  });

  it('/api/auth/login (POST) - Success', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        phone: testUser.phone,
      });
    
    if (response.status !== 200) {
      console.log('Login Failure Body:', JSON.stringify(response.body, null, 2));
    }

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe('OTP sent successfully');
    expect(response.body.data.phone).toBe(testUser.phone);
  });

  it('/api/auth/verify-otp (POST) - Success', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({
        phone: testUser.phone,
        otp: '1111',
      });

    if (response.status !== 200) {
      console.log('Verify OTP Failure Body:', JSON.stringify(response.body, null, 2));
    }

    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.data.refresh_token).toBeDefined();
    expect(response.body.data.user.phone).toBe(testUser.phone);
  });
});
