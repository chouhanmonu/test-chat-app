import { VStack } from '@chakra-ui/react';
import { Message, MessageItem } from './MessageItem';

export const MessageList = ({
  messages,
  currentUserId,
  onReact,
  onReply
}: {
  messages: Message[];
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
}) => {
  return (
    <VStack spacing={4} align="stretch">
      {messages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          isOwn={message.userId === currentUserId}
          onReact={onReact}
          onReply={onReply}
        />
      ))}
    </VStack>
  );
};
