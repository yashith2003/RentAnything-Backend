//src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    const { sub, isGuest, role } = payload;

    // Handle Guest users - skip DB lookup
    if (isGuest || role === 'guest' || role === 'GUEST') {
      return {
        id: sub,
        role: 'guest',
        isActive: true,
      };
    }

    // For registered users, ensure sub is a valid integer before querying
    if (isNaN(Number(sub))) {
      throw new UnauthorizedException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({ 
      where: { id: Number(sub) },
      relations: ['individualUser', 'company']
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
