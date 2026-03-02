//src/user/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { IndividualUser } from './entities/individual-user.entity';
import { Company } from './entities/company.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, IndividualUser, Company]),
    CommonModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
