import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class TokenService {
  private redis: Redis;

  constructor(private readonly jwtService: JwtService, private readonly config: ConfigService) {
    this.redis = new Redis(this.config.get<string>('redisUrl'));
  }

  async signAccessToken(payload: Record<string, any>) {
    const secret = this.config.get<string>('jwtAccessSecret');
    const expiresIn = this.config.get<string>('jwtAccessTtl');
    return this.jwtService.signAsync(payload, { secret, expiresIn });
  }

  async signRefreshToken(payload: Record<string, any>) {
    const secret = this.config.get<string>('jwtRefreshSecret');
    const expiresIn = this.config.get<string>('jwtRefreshTtl');
    return this.jwtService.signAsync(payload, { secret, expiresIn });
  }

  async storeRefreshToken(userId: string, token: string) {
    await this.redis.set(`refresh:${userId}`, token, 'EX', 60 * 60 * 24 * 7);
  }

  async getRefreshToken(userId: string) {
    return this.redis.get(`refresh:${userId}`);
  }

  async revokeRefreshToken(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }
}
