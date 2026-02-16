import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ _id: false })
export class MessageReaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  emoji!: string;
}

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  key!: string;

  @Prop({ type: Types.ObjectId, ref: 'Attachment' })
  attachmentId?: Types.ObjectId;

  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  size!: number;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId!: Types.ObjectId;

  @Prop()
  content?: string;

  @Prop()
  encryptedContent?: string;

  @Prop()
  encryptionMetadata?: string;
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyingToMessageId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  forwardedFromMessageId?: Types.ObjectId;

  @Prop({ type: [MessageReaction], default: [] })
  reactions!: MessageReaction[];

  @Prop({ type: [MessageAttachment], default: [] })
  attachments!: MessageAttachment[];

  @Prop({ default: false })
  isEdited!: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  deletedForUserIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  hiddenByUserIds!: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1 });
MessageSchema.index({ replyingToMessageId: 1 });
MessageSchema.index({ content: 'text', encryptedContent: 'text' });
