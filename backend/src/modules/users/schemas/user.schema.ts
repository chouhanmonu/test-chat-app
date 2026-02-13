import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class UserDevice {
  @Prop({ required: true })
  deviceId!: string;

  @Prop()
  deviceName?: string;

  @Prop({ required: true })
  publicKey!: string;

  @Prop({ default: Date.now })
  registeredAt!: Date;

  @Prop()
  lastSeenAt?: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop()
  profilePictureUrl?: string;

  @Prop({ default: 'active' })
  accountStatus!: 'active' | 'inactive' | 'blocked';

  @Prop()
  status?: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  favouriteContactIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  blockedUserIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Message', default: [] })
  starredMessageIds!: Types.ObjectId[];

  @Prop({ type: [UserDevice], default: [] })
  devices!: UserDevice[];

  @Prop({ default: false })
  hasAltEmailVerified!: boolean;

  @Prop()
  alternateEmail?: string;

  @Prop()
  mobile?: string;

  @Prop({ required: true })
  passwordHash!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
