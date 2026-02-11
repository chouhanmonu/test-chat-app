import { Box, Button, HStack, Text, VStack, Wrap, WrapItem, Badge } from '@chakra-ui/react';

export type Message = {
  _id: string;
  userId: string;
  content?: string;
  attachments?: { fileName: string; url: string }[];
  reactions?: { userId: string; emoji: string }[];
  replyingToMessageId?: string;
  forwardedFromMessageId?: string;
};

type MessageItemProps = {
  message: Message;
  isOwn: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
};

export const MessageItem = ({ message, isOwn, onReact, onReply }: MessageItemProps) => {
  return (
    <Box
      alignSelf={isOwn ? 'flex-end' : 'flex-start'}
      bg={isOwn ? 'brand.700' : 'gray.700'}
      px={4}
      py={3}
      borderRadius="16px"
      maxW="70%"
    >
      <VStack align="start" spacing={2}>
        {message.forwardedFromMessageId && (
          <Badge colorScheme="teal">Forwarded</Badge>
        )}
        {message.replyingToMessageId && (
          <Text fontSize="xs" color="gray.300">
            Replying to a message
          </Text>
        )}
        {message.content && <Text>{message.content}</Text>}
        {message.attachments?.length ? (
          <VStack align="start" spacing={1}>
            {message.attachments.map((att) => (
              <Text key={att.url} fontSize="sm" color="blue.200">
                {att.fileName}
              </Text>
            ))}
          </VStack>
        ) : null}
        {message.reactions?.length ? (
          <Wrap>
            {message.reactions.map((reaction, idx) => (
              <WrapItem key={`${reaction.emoji}-${idx}`}>
                <Box bg="whiteAlpha.200" px={2} py={1} borderRadius="full">
                  <Text fontSize="sm">{reaction.emoji}</Text>
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        ) : null}
        <HStack spacing={2}>
          <Button size="xs" variant="ghost" onClick={() => onReact(message._id, '👍')}>
            👍
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onReact(message._id, '🔥')}>
            🔥
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onReply(message._id)}>
            Reply
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
