//src/config/jwt.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRATION || '1d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
