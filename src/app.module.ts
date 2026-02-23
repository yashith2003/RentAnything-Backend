//src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ItemModule } from './item/item.module';
import { PricingModule } from './pricing/pricing.module';
import { AvailabilityModule } from './availability/availability.module';
import { AddressModule } from './address/address.module';
import { RentalModule } from './rental/rental.module';
import { IncidentModule } from './incident/incident.module';
import { ChatModule } from './chat/chat.module';
import { KycModule } from './kyc/kyc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (process.env.NODE_ENV === 'test') {
          return {
            ttl: 600 * 1000, // Memory store (default)
          };
        }
        return {
          store: await redisStore({
            socket: {
              host: configService.get<string>('redis.host'),
              port: configService.get<number>('redis.port'),
            },
            password: configService.get<string>('redis.password'),
            ttl: (configService.get<number>('redis.ttl') || 600) * 1000,
          }),
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for development
      }),
    }),
    AuthModule,
    UserModule,
    CategoryModule,
    ItemModule,
    PricingModule,
    AvailabilityModule,
    AddressModule,
    ChatModule,
    RentalModule,
    IncidentModule,
    KycModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
