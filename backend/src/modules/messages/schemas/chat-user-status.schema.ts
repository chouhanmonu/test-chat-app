import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatUserStatusDocument = HydratedDocument<ChatUserStatus>;

@Schema({ timestamps: true })
export class ChatUserStatus {
  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastDeliveredMessageId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastSeenMessageId?: Types.ObjectId;
}

export const ChatUserStatusSchema = SchemaFactory.createForClass(ChatUserStatus);
ChatUserStatusSchema.index({ roomId: 1, userId: 1 }, { unique: true });
