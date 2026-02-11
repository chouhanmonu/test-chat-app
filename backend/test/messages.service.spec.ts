import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MessagesService } from '../src/modules/messages/messages.service';
import { Message } from '../src/modules/messages/schemas/message.schema';
import { ChatUserStatus } from '../src/modules/messages/schemas/chat-user-status.schema';
import { Room } from '../src/modules/rooms/schemas/room.schema';

const mockRoom = {
  _id: 'room1',
  members: [{ userId: { toString: () => 'user1' }, role: 'admin' }],
  save: jest.fn()
};

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: {
            create: jest.fn().mockResolvedValue({
              _id: 'msg1',
              roomId: { toString: () => 'room1' },
              toObject: () => ({ _id: 'msg1', roomId: 'room1' })
            }),
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([])
              })
            })
          }
        },
        {
          provide: getModelToken(ChatUserStatus.name),
          useValue: {
            updateOne: jest.fn()
          }
        },
        {
          provide: getModelToken(Room.name),
          useValue: {
            findById: jest.fn().mockResolvedValue(mockRoom)
          }
        }
      ]
    }).compile();

    service = moduleRef.get(MessagesService);
  });

  it('sends a message and updates room', async () => {
    const result = await service.sendMessage('user1', {
      roomId: 'room1',
      content: 'hello'
    });

    expect(result._id).toBe('msg1');
    expect(mockRoom.save).toHaveBeenCalled();
  });
});
