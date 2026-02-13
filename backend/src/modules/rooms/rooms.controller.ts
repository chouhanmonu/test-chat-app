import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoomsService } from './rooms.service';
import { CreateDmByEmailDto } from './dto/create-dm-by-email.dto';
import { CreateGroupByEmailDto } from './dto/create-group-by-email.dto';
import { UpdateRoomKeysDto } from './dto/update-room-keys.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.roomsService.listRooms(user.sub);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(user.sub, dto);
  }

  @Post('dm-by-email')
  createDmByEmail(@CurrentUser() user: any, @Body() dto: CreateDmByEmailDto) {
    return this.roomsService.createDmByEmail(user.sub, dto.email);
  }

  @Post('group-by-email')
  createGroupByEmail(@CurrentUser() user: any, @Body() dto: CreateGroupByEmailDto) {
    return this.roomsService.createGroupByEmail(user.sub, dto.name, dto.emails);
  }

  @Post(':roomId/members')
  addMember(@Param('roomId') roomId: string, @CurrentUser() user: any, @Body() dto: AddMemberDto) {
    return this.roomsService.addMember(roomId, user.sub, dto);
  }

  @Patch(':roomId/roles')
  updateRole(@Param('roomId') roomId: string, @CurrentUser() user: any, @Body() dto: UpdateRoleDto) {
    return this.roomsService.updateRole(roomId, user.sub, dto);
  }

  @Patch(':roomId/mute')
  mute(@Param('roomId') roomId: string, @CurrentUser() user: any) {
    return this.roomsService.muteRoom(roomId, user.sub, true);
  }

  @Patch(':roomId/unmute')
  unmute(@Param('roomId') roomId: string, @CurrentUser() user: any) {
    return this.roomsService.muteRoom(roomId, user.sub, false);
  }

  @Get(':roomId/keys')
  getKeys(@Param('roomId') roomId: string, @CurrentUser() user: any) {
    return this.roomsService.getRoomMemberKeys(roomId, user.sub);
  }

  @Get(':roomId/e2ee')
  getE2ee(@Param('roomId') roomId: string, @CurrentUser() user: any) {
    return this.roomsService.getRoomE2ee(roomId, user.sub);
  }

  @Patch(':roomId/e2ee')
  updateE2ee(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRoomKeysDto
  ) {
    return this.roomsService.updateRoomE2ee(roomId, user.sub, dto.memberKeys);
  }
}
