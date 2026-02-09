import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../src/user/entities/user.entity';
import { Category } from './../src/category/entities/category.entity';
import { Address as AddressEntity } from './../src/address/entities/address.entity';
import { IndividualUser } from './../src/user/entities/individual-user.entity';
import { Item } from './../src/item/entities/item.entity';

describe('ItemModule (e2e)', () => {
  let app: INestApplication;
  let userRepository;
  let categoryRepository;
  let addressRepository;
  let individualRepository;
  let itemRepository;

  let accessToken: string;
  let testCategoryId: number;
  let testAddressId: number;

  const testUser = {
    phone: '+94777654321',
    fullName: 'Item E2E Tester',
    address: 'Item Test Street, Colombo',
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
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    categoryRepository = moduleFixture.get(getRepositoryToken(Category));
    addressRepository = moduleFixture.get(getRepositoryToken(AddressEntity));
    individualRepository = moduleFixture.get(getRepositoryToken(IndividualUser));
    itemRepository = moduleFixture.get(getRepositoryToken(Item));

    await cleanup();

    // 1. Register
    await request(app.getHttpServer())
      .post('/api/auth/register/individual')
      .send(testUser)
      .expect(201);

    // 2. Verify OTP to get Token
    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone: testUser.phone, otp: '1111' })
      .expect(200);
    
    accessToken = verifyRes.body.data.access_token;

    // 3. Create a Category
    const category = await categoryRepository.save(
      categoryRepository.create({ name: 'E2E Test Category' })
    );
    testCategoryId = category.id;

    // 4. Get the Address created during registration
    const user = await userRepository.findOne({ 
      where: { phone: testUser.phone },
      relations: ['addresses']
    });
    testAddressId = user.addresses[0].id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup() {
    const user = await userRepository.findOne({ where: { phone: testUser.phone } });
    if (user) {
      // Find all items by this user and delete them
      const items = await itemRepository.find({ where: { owner: { id: user.id } } });
      await itemRepository.remove(items);

      await addressRepository.delete({ user: { id: user.id } });
      await individualRepository.delete({ user: { id: user.id } });
      await userRepository.remove(user);
    }
    
    const category = await categoryRepository.findOne({ where: { name: 'E2E Test Category' } });
    if (category) {
      await categoryRepository.remove(category);
    }
  }

  it('/api/items (POST) - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'E2E Test Item',
        description: 'Excellent condition',
        categoryId: testCategoryId,
        addressId: testAddressId,
        condition: 'New',
        deliveryAvailable: true,
      });

    if (res.status !== 201) {
      console.log('ITEM CREATION ERROR:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('E2E Test Item');
    expect(res.body.data.id).toBeDefined();
  });

  it('/api/items (GET) - Success', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/items');
    
    if (res.status !== 200) {
      console.log('ITEM FETCH ERROR:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
