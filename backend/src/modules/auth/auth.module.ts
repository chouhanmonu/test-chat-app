import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/tokens.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { AccountCleanupService } from './account-cleanup.service';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { ChatUserStatus, ChatUserStatusSchema } from '../messages/schemas/chat-user-status.schema';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    TokensModule,
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Message.name, schema: MessageSchema },
      { name: ChatUserStatus.name, schema: ChatUserStatusSchema }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy, AccountCleanupService]
})
export class AuthModule {}
