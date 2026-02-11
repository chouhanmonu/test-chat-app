import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService
  ) {}

  async createUser(params: Partial<User>) {
    const created = await this.userModel.create(params);
    return created.toObject();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(userId: string) {
    return this.userModel.findById(userId).exec();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.alternateEmail && dto.alternateEmail !== user.alternateEmail) {
      user.alternateEmail = dto.alternateEmail;
      user.hasAltEmailVerified = false;
      await this.mailService.sendAltEmailVerification(user.email, dto.alternateEmail);
    }

    if (dto.name) user.name = dto.name;
    if (dto.profilePictureUrl) user.profilePictureUrl = dto.profilePictureUrl;
    if (dto.mobile) user.mobile = dto.mobile;

    await user.save();
    return user.toObject();
  }

  async verifyAlternateEmail(userId: string, alternateEmail: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.alternateEmail !== alternateEmail) {
      throw new BadRequestException('Alternate email mismatch');
    }

    user.hasAltEmailVerified = true;
    await user.save();
    return user.toObject();
  }

  async addDevice(userId: string, device: User['devices'][0]) {
    await this.userModel.updateOne(
      { _id: userId, 'devices.deviceId': { $ne: device.deviceId } },
      { $push: { devices: device } }
    );
  }

  async blockUser(userId: string, blockUserId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { blockedUserIds: new Types.ObjectId(blockUserId) } }
    );
  }

  async unblockUser(userId: string, blockUserId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { blockedUserIds: new Types.ObjectId(blockUserId) } }
    );
  }

  async addFavourite(userId: string, favouriteId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { favouriteContactIds: new Types.ObjectId(favouriteId) } }
    );
  }

  async removeFavourite(userId: string, favouriteId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { favouriteContactIds: new Types.ObjectId(favouriteId) } }
    );
  }

  async starMessage(userId: string, messageId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { starredMessageIds: new Types.ObjectId(messageId) } }
    );
  }

  async unstarMessage(userId: string, messageId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { starredMessageIds: new Types.ObjectId(messageId) } }
    );
  }

  async deleteAccount(userId: string) {
    await this.userModel.deleteOne({ _id: userId });
  }
}
