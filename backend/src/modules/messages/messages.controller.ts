import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ReactMessageDto } from './dto/react-message.dto';
import { SearchMessageDto } from './dto/search.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UsersService } from '../users/users.service';
import { StarMessageDto } from './dto/star-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  sendMessage(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user.sub, dto);
  }

  @Get(':roomId')
  list(@CurrentUser() user: any, @Param('roomId') roomId: string) {
    return this.messagesService.listMessages(user.sub, roomId);
  }

  @Post('reactions')
  react(@CurrentUser() user: any, @Body() dto: ReactMessageDto) {
    return this.messagesService.react(user.sub, dto);
  }

  @Post('search')
  search(@CurrentUser() user: any, @Body() dto: SearchMessageDto) {
    return this.messagesService.searchMessages(user.sub, dto);
  }

  @Patch('seen')
  updateSeen(@CurrentUser() user: any, @Body() dto: UpdateStatusDto) {
    return this.messagesService.updateSeen(user.sub, dto.roomId, dto.messageId);
  }

  @Post('star')
  star(@CurrentUser() user: any, @Body() dto: StarMessageDto) {
    return this.usersService.starMessage(user.sub, dto.messageId);
  }

  @Post('unstar')
  unstar(@CurrentUser() user: any, @Body() dto: StarMessageDto) {
    return this.usersService.unstarMessage(user.sub, dto.messageId);
  }
}
