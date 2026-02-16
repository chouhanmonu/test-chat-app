import { Box, Button, HStack, Text, VStack, Wrap, WrapItem, Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { signDownload } from '../api/attachments';

export type Message = {
  _id: string;
  userId: string;
  content?: string;
  encryptedContent?: string;
  encryptionMetadata?: string;
  attachments?: {
    fileName: string;
    url: string;
    key?: string;
    attachmentId?: string;
    mimeType?: string;
  }[];
  reactions?: { userId: string; emoji: string }[];
  replyingToMessageId?: string;
  forwardedFromMessageId?: string;
};

type MessageItemProps = {
  message: Message;
  isOwn: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
  decryptedContent?: string;
};

export const MessageItem = ({
  message,
  isOwn,
  onReact,
  onReply,
  decryptedContent,
}: MessageItemProps) => {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const run = async () => {
      const images = message.attachments?.filter((att) => att.mimeType?.startsWith('image/')) ?? [];
      const updates: Record<string, string> = {};
      for (const att of images) {
        const id = att.attachmentId || att.key || att.url.split('/').pop() || att.url;
        if (signedUrls[id]) continue;
        try {
          if (!att.attachmentId) continue;
          const signed = await signDownload({ attachmentId: att.attachmentId });
          updates[id] = signed.downloadUrl;
        } catch {
          // ignore
        }
      }
      if (Object.keys(updates).length > 0) {
        setSignedUrls((prev) => ({ ...prev, ...updates }));
      }
    };
    run();
  }, [message.attachments, signedUrls]);

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
        {!message.content && message.encryptedContent && (
          <Text>{decryptedContent ?? "Decrypting..."}</Text>
        )}
        {message.attachments?.length ? (
          <VStack align="start" spacing={2}>
            {message.attachments.map((att) => {
              const isImage = att.mimeType?.startsWith("image/");
              if (isImage) {
                const id = att.attachmentId || att.key || att.url.split('/').pop() || att.url;
                const signedUrl = signedUrls[id];
                return (
                  <Box key={att.url} borderRadius="12px" overflow="hidden" bg="blackAlpha.400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signedUrl ?? att.url}
                      alt={att.fileName}
                      style={{ maxWidth: "220px", display: "block" }}
                    />
                  </Box>
                );
              }
              return (
                <Text key={att.url} fontSize="sm" color="blue.200">
                  {att.fileName}
                </Text>
              );
            })}
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
