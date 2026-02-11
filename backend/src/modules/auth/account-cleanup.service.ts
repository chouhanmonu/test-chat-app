import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { ChatUserStatus, ChatUserStatusDocument } from '../messages/schemas/chat-user-status.schema';

@Injectable()
export class AccountCleanupService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ChatUserStatus.name)
    private readonly statusModel: Model<ChatUserStatusDocument>
  ) {}

  async cleanupUser(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    await this.roomModel.updateMany(
      { 'members.userId': userObjectId },
      { $pull: { members: { userId: userObjectId } } }
    );

    await this.messageModel.deleteMany({ userId: userObjectId });
    await this.statusModel.deleteMany({ userId: userObjectId });

    await this.roomModel.deleteMany({ type: 'dm', members: { $size: 0 } });
  }
}
