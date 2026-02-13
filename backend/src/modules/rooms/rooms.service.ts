import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService
  ) {}

  async createRoom(ownerId: string, dto: CreateRoomDto) {
    const members = dto.members.map((member) => ({
      userId: new Types.ObjectId(member.userId),
      role: member.role ?? 'member',
      hasMuted: false,
      joinedAt: new Date(),
      encryptedSecretKeys: member.encryptedSecretKeys ?? []
    }));

    if (!members.find((m) => m.userId.toString() === ownerId)) {
      members.push({
        userId: new Types.ObjectId(ownerId),
        role: 'admin',
        hasMuted: false,
        joinedAt: new Date(),
        encryptedSecretKeys: []
      });
    }

    const room = await this.roomModel.create({
      name: dto.name,
      type: dto.type,
      members,
      createdBy: new Types.ObjectId(ownerId),
      lastActivityAt: new Date()
    });

    return room.toObject();
  }

  async listRooms(userId: string) {
    const rooms = await this.roomModel
      .find({ 'members.userId': new Types.ObjectId(userId) })
      .populate('members.userId', 'name email')
      .exec();

    return rooms.map((room) => {
      const roomObj = room.toObject() as any;
      if (roomObj.type === 'dm') {
        const otherMember = roomObj.members.find(
          (member: any) => member.userId?._id?.toString() !== userId
        );
        const displayName =
          otherMember?.userId?.name ?? otherMember?.userId?.email ?? 'Direct Message';
        return { ...roomObj, displayName };
      }
      return { ...roomObj, displayName: roomObj.name ?? 'Group Chat' };
    });
  }

  async createDmByEmail(ownerId: string, email: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) {
      const owner = await this.usersService.findById(ownerId);
      if (owner) {
        await this.mailService.sendInviteEmail(owner.email, email.toLowerCase());
      }
      return { exists: false };
    }

    const memberIds = [new Types.ObjectId(ownerId), user._id];
    const existing = await this.roomModel.findOne({
      type: 'dm',
      'members.userId': { $all: memberIds }
    });
    if (existing) return { exists: true, room: existing.toObject() };

    const room = await this.roomModel.create({
      type: 'dm',
      members: [
        { userId: new Types.ObjectId(ownerId), role: 'admin', hasMuted: false, joinedAt: new Date() },
        { userId: user._id, role: 'member', hasMuted: false, joinedAt: new Date() }
      ],
      createdBy: new Types.ObjectId(ownerId),
      lastActivityAt: new Date()
    });

    return { exists: true, room: room.toObject() };
  }

  async createGroupByEmail(ownerId: string, name: string | undefined, emails: string[]) {
    const normalized = emails.map((e) => e.toLowerCase());
    const users = await Promise.all(normalized.map((email) => this.usersService.findByEmail(email)));
    const missing = normalized.filter((_, idx) => !users[idx]);
    if (missing.length > 0) {
      const owner = await this.usersService.findById(ownerId);
      if (owner) {
        await Promise.all(
          missing.map((invitee) => this.mailService.sendInviteEmail(owner.email, invitee))
        );
      }
      return { created: false, missing };
    }

    const members: {
      userId: Types.ObjectId;
      role: 'admin' | 'member';
      hasMuted: boolean;
      joinedAt: Date;
    }[] = users.map((user) => ({
      userId: user!._id,
      role: 'member',
      hasMuted: false,
      joinedAt: new Date()
    }));

    if (!members.find((m) => m.userId.toString() === ownerId)) {
      members.push({
        userId: new Types.ObjectId(ownerId),
        role: 'admin',
        hasMuted: false,
        joinedAt: new Date()
      });
    }

    const room = await this.roomModel.create({
      name,
      type: 'group',
      members,
      createdBy: new Types.ObjectId(ownerId),
      lastActivityAt: new Date()
    });

    return { created: true, room: room.toObject() };
  }

  async addMember(roomId: string, adminId: string, dto: AddMemberDto) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const admin = room.members.find((m) => m.userId.toString() === adminId);
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('Admin only');

    room.members.push({
      userId: new Types.ObjectId(dto.userId),
      role: dto.role ?? 'member',
      hasMuted: false,
      joinedAt: new Date(),
      encryptedSecretKeys: dto.encryptedSecretKeys ?? []
    });

    await room.save();
    return room.toObject();
  }

  async updateRole(roomId: string, adminId: string, dto: UpdateRoleDto) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const admin = room.members.find((m) => m.userId.toString() === adminId);
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('Admin only');

    const member = room.members.find((m) => m.userId.toString() === dto.userId);
    if (!member) throw new NotFoundException('Member not found');

    member.role = dto.role;
    await room.save();
    return room.toObject();
  }

  async muteRoom(roomId: string, userId: string, muted: boolean) {
    await this.roomModel.updateOne(
      { _id: roomId, 'members.userId': new Types.ObjectId(userId) },
      { $set: { 'members.$.hasMuted': muted } }
    );
    return { success: true };
  }

  async isMember(roomId: string, userId: string) {
    const room = await this.roomModel.findOne({
      _id: roomId,
      'members.userId': new Types.ObjectId(userId)
    });
    return !!room;
  }

  async getMemberIds(roomId: string) {
    const room = await this.roomModel.findById(roomId).select('members.userId');
    if (!room) return [];
    return room.members.map((member) => member.userId.toString());
  }

  async getRoomMemberKeys(roomId: string, requesterId: string) {
    const room = await this.roomModel.findById(roomId).select('members.userId');
    if (!room) return [];
    const memberIds = room.members.map((member) => member.userId.toString());
    if (!memberIds.includes(requesterId)) return [];

    const users = await this.usersService.findByIds(memberIds);
    return users.map((user) => ({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      devices: user.devices.map((device) => ({
        deviceId: device.deviceId,
        publicKey: device.publicKey
      }))
    }));
  }

  async getRoomE2ee(roomId: string, requesterId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const member = room.members.find((m) => m.userId.toString() === requesterId);
    if (!member) throw new ForbiddenException('Not in room');

    const memberIds = room.members.map((m) => m.userId.toString());
    const users = await this.usersService.findByIds(memberIds);

    return {
      role: member.role,
      myKeys: member.encryptedSecretKeys ?? [],
      memberDevices: users.map((user) => ({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        devices: user.devices.map((device) => ({
          deviceId: device.deviceId,
          publicKey: device.publicKey
        }))
      }))
    };
  }

  async updateRoomE2ee(roomId: string, requesterId: string, memberKeys: { userId: string; keys: any[] }[]) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const requester = room.members.find((m) => m.userId.toString() === requesterId);
    if (!requester) throw new ForbiddenException('Not in room');

    for (const entry of memberKeys) {
      if (entry.userId !== requesterId && requester.role !== 'admin') {
        throw new ForbiddenException('Admin only');
      }

      const member = room.members.find((m) => m.userId.toString() === entry.userId);
      if (!member) continue;

      member.encryptedSecretKeys = entry.keys;
    }

    await room.save();
    return { success: true };
  }
}
