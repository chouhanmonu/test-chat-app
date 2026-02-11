import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { ChatUserStatus, ChatUserStatusDocument } from './schemas/chat-user-status.schema';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { ReactMessageDto } from './dto/react-message.dto';
import { SearchMessageDto } from './dto/search.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ChatUserStatus.name)
    private readonly statusModel: Model<ChatUserStatusDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>
  ) {}

  private async ensureMember(roomId: string, userId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const member = room.members.find((m) => m.userId.toString() === userId);
    if (!member) throw new ForbiddenException('Not in room');

    return room;
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const room = await this.ensureMember(dto.roomId, userId);

    const message = await this.messageModel.create({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(dto.roomId),
      content: dto.content,
      replyingToMessageId: dto.replyingToMessageId ? new Types.ObjectId(dto.replyingToMessageId) : undefined,
      forwardedFromMessageId: dto.forwardedFromMessageId
        ? new Types.ObjectId(dto.forwardedFromMessageId)
        : undefined,
      attachments: dto.attachments ?? []
    });

    room.lastMessageId = message._id;
    room.lastActivityAt = new Date();
    await room.save();

    await this.statusModel.updateOne(
      { roomId: room._id, userId: new Types.ObjectId(userId) },
      { $set: { lastDeliveredMessageId: message._id } },
      { upsert: true }
    );

    return message.toObject();
  }

  async listMessages(userId: string, roomId: string) {
    await this.ensureMember(roomId, userId);
    return this.messageModel.find({ roomId: new Types.ObjectId(roomId) }).sort({ createdAt: -1 }).exec();
  }

  async react(userId: string, dto: ReactMessageDto) {
    const message = await this.messageModel.findById(dto.messageId);
    if (!message) throw new NotFoundException('Message not found');

    await this.ensureMember(message.roomId.toString(), userId);

    const existing = message.reactions.find(
      (reaction) => reaction.userId.toString() === userId && reaction.emoji === dto.emoji
    );
    if (existing) {
      message.reactions = message.reactions.filter(
        (reaction) => !(reaction.userId.toString() === userId && reaction.emoji === dto.emoji)
      );
    } else {
      message.reactions.push({ userId: new Types.ObjectId(userId), emoji: dto.emoji });
    }

    await message.save();
    return message.toObject();
  }

  async searchMessages(userId: string, dto: SearchMessageDto) {
    await this.ensureMember(dto.roomId, userId);

    const query = dto.query ? { $text: { $search: dto.query } } : {};
    return this.messageModel
      .find({ roomId: new Types.ObjectId(dto.roomId), ...query })
      .limit(50)
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateSeen(userId: string, roomId: string, messageId: string) {
    await this.ensureMember(roomId, userId);
    await this.statusModel.updateOne(
      { roomId: new Types.ObjectId(roomId), userId: new Types.ObjectId(userId) },
      { $set: { lastSeenMessageId: new Types.ObjectId(messageId) } },
      { upsert: true }
    );
    return { success: true };
  }
}
