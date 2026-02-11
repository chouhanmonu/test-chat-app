import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoomsService } from './rooms.service';

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
}
