import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';
import { TokensModule } from '../tokens/tokens.module';
import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [MessagesModule, RoomsModule, TokensModule, PresenceModule],
  providers: [ChatGateway]
})
export class GatewayModule {}
