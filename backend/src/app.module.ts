import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { GatewayModule } from "./modules/gateway/gateway.module";
import { MailModule } from "./modules/mail/mail.module";
import { PresenceModule } from "./modules/presence/presence.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>("THROTTLE_TTL", 60),
            limit: config.get<number>("THROTTLE_LIMIT", 10),
          },
        ],
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("mongoUri"),
      }),
    }),
    AuthModule,
    UsersModule,
    RoomsModule,
    MessagesModule,
    AttachmentsModule,
    MailModule,
    PresenceModule,
    GatewayModule,
  ],
})
export class AppModule {}
