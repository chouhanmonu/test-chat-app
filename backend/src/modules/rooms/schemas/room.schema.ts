import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ _id: false })
@Schema({ _id: false })
export class RoomMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: 'member' })
  role!: 'admin' | 'member';

  @Prop({ default: false })
  hasMuted!: boolean;

  @Prop({ default: Date.now })
  joinedAt!: Date;
}

@Schema({ timestamps: true })
export class Room {
  @Prop()
  name?: string;

  @Prop({ required: true, enum: ['dm', 'group'], index: true })
  type!: 'dm' | 'group';

  @Prop({ type: [RoomMember], default: [] })
  members!: RoomMember[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessageId?: Types.ObjectId;

  @Prop({ default: Date.now })
  lastActivityAt!: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ 'members.userId': 1 });
RoomSchema.index({ type: 1 });
RoomSchema.index({ lastMessageId: 1 });
