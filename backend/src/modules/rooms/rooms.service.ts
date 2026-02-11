import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>) {}

  async createRoom(ownerId: string, dto: CreateRoomDto) {
    const members = dto.members.map((member) => ({
      userId: new Types.ObjectId(member.userId),
      role: member.role ?? 'member',
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
      name: dto.name,
      type: dto.type,
      members,
      createdBy: new Types.ObjectId(ownerId),
      lastActivityAt: new Date()
    });

    return room.toObject();
  }

  async listRooms(userId: string) {
    return this.roomModel.find({ 'members.userId': new Types.ObjectId(userId) }).exec();
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
      joinedAt: new Date()
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
}
