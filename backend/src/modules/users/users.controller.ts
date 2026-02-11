import { Body, Controller, Delete, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { FavouriteDto } from './dto/favourite.dto';
import { VerifyAltEmailDto } from './dto/verify-alt-email.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Post('verify-alt-email')
  verifyAlternateEmail(@CurrentUser() user: any, @Body() dto: VerifyAltEmailDto) {
    return this.usersService.verifyAlternateEmail(user.sub, dto.alternateEmail);
  }

  @Post('block')
  blockUser(@CurrentUser() user: any, @Body() dto: BlockUserDto) {
    return this.usersService.blockUser(user.sub, dto.userId);
  }

  @Post('unblock')
  unblockUser(@CurrentUser() user: any, @Body() dto: BlockUserDto) {
    return this.usersService.unblockUser(user.sub, dto.userId);
  }

  @Post('favourites')
  addFavourite(@CurrentUser() user: any, @Body() dto: FavouriteDto) {
    return this.usersService.addFavourite(user.sub, dto.userId);
  }

  @Delete('favourites')
  removeFavourite(@CurrentUser() user: any, @Body() dto: FavouriteDto) {
    return this.usersService.removeFavourite(user.sub, dto.userId);
  }
}
