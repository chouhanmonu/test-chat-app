import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private pubClient: ReturnType<typeof createClient>;
  private subClient: ReturnType<typeof createClient>;

  constructor(app: INestApplication, private readonly redisUrl: string) {
    super(app);
  }

  async connect(): Promise<void> {
    this.pubClient = createClient({ url: this.redisUrl });
    this.subClient = this.pubClient.duplicate();
    await this.pubClient.connect();
    await this.subClient.connect();
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        credentials: true
      }
    });
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
