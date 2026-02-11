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
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('jwtAccessSecret')
      });

      client.data.userId = payload.sub;
      await this.presenceService.setOnline(payload.sub);

      const rooms = await this.roomsService.listRooms(payload.sub);
      rooms.forEach((room) => client.join(room._id.toString()));

      this.server.to(client.id).emit('connected', { userId: payload.sub });
    } catch {
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
    this.server.to(message.roomId.toString()).emit('message:new', message);
  }

  @SubscribeMessage('message:react')
  async handleReaction(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const userId = client.data.userId;
    const message = await this.messagesService.react(userId, body);
    this.server.to(message.roomId.toString()).emit('message:reaction', message);
  }

  @SubscribeMessage('message:seen')
  async handleSeen(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    const userId = client.data.userId;
    await this.messagesService.updateSeen(userId, body.roomId, body.messageId);
    this.server.to(body.roomId).emit('message:seen', { userId, ...body });
  }
}
