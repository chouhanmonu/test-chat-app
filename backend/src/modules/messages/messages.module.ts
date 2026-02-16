import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { ChatUserStatus, ChatUserStatusSchema } from './schemas/chat-user-status.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { UsersModule } from '../users/users.module';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: ChatUserStatus.name, schema: ChatUserStatusSchema },
      { name: Room.name, schema: RoomSchema }
    ]),
    UsersModule,
    AttachmentsModule
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService]
})
export class MessagesModule {}
