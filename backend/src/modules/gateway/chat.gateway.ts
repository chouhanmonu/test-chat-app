import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly presenceService: PresenceService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      // eslint-disable-next-line no-console
      console.log('[socket] missing token');
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('jwtAccessSecret')
      });

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      await this.presenceService.setOnline(payload.sub);

      const rooms = await this.roomsService.listRooms(payload.sub);
      rooms.forEach((room) => client.join(room._id.toString()));

      this.server.to(client.id).emit('connected', { userId: payload.sub });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('[socket] auth failed', error?.message ?? error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.userId) {
      await this.presenceService.setOffline(client.data.userId);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const userId = client.data.userId;
    const message = await this.messagesService.sendMessage(userId, body);
    const roomId = message.roomId.toString();
    this.server.to(roomId).emit('message:new', { ...message, roomId });
    const memberIds = await this.roomsService.getMemberIds(roomId);
    memberIds.forEach((memberId) => {
      this.server.to(`user:${memberId}`).emit('message:new', { ...message, roomId });
    });
    return { ...message, roomId };
  }

  @SubscribeMessage('message:react')
  async handleReaction(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const userId = client.data.userId;
    const message = await this.messagesService.react(userId, body);
    const roomId = message.roomId.toString();
    this.server.to(roomId).emit('message:reaction', { ...message, roomId });
    const memberIds = await this.roomsService.getMemberIds(roomId);
    memberIds.forEach((memberId) => {
      this.server.to(`user:${memberId}`).emit('message:reaction', { ...message, roomId });
    });
    return { ...message, roomId };
  }

  @SubscribeMessage('message:seen')
  async handleSeen(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const userId = client.data.userId;
    await this.messagesService.updateSeen(userId, body.roomId, body.messageId);
    this.server.to(body.roomId).emit('message:seen', { userId, ...body });
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const userId = client.data.userId;
    const allowed = await this.roomsService.isMember(body.roomId, userId);
    if (!allowed) return;
    client.join(body.roomId);
  }
}
