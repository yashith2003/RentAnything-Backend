//RentAnything-Backend/src/app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'success',
      message: 'RentAnything API is running',
      version: '1.0.0',
    };
  }
}
