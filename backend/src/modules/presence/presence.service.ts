import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class PresenceService {
  private redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis(this.config.get<string>('redisUrl'));
  }

  async setOnline(userId: string) {
    await this.redis.set(`presence:${userId}`, 'online', 'EX', 60 * 5);
  }

  async setOffline(userId: string) {
    await this.redis.del(`presence:${userId}`);
  }

  async isOnline(userId: string) {
    const status = await this.redis.get(`presence:${userId}`);
    return status === 'online';
  }
}
