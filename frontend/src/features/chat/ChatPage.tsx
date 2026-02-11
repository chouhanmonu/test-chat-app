import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Text,
  Textarea,
  useDisclosure
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoom, fetchRooms } from '../../api/rooms';
import { fetchMessages, reactMessage, searchMessages, sendMessage } from '../../api/messages';
import { presignUpload } from '../../api/attachments';
import { Sidebar, Room } from '../../components/Sidebar';
import { MessageList } from '../../components/MessageList';
import { Composer } from '../../components/Composer';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const decodeJwt = (token: string | null) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};

export const ChatPage = () => {
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const userPayload = useMemo(() => decodeJwt(accessToken), [accessToken]);
  const userId = userPayload?.sub ?? '';

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms
  });

  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<'dm' | 'group'>('dm');
  const [roomName, setRoomName] = useState('');
  const [memberIds, setMemberIds] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeRoom?._id],
    queryFn: () => fetchMessages(activeRoom?._id || ''),
    enabled: !!activeRoom
  });

  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults = [] } = useQuery({
    queryKey: ['messages-search', activeRoom?._id, searchQuery],
    queryFn: () => searchMessages({ roomId: activeRoom?._id, query: searchQuery }),
    enabled: !!activeRoom && searchQuery.length > 0
  });

  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setActiveRoom(room);
      onClose();
    }
  });

  useEffect(() => {
    if (!socket) return;
    const newHandler = (message: any) => {
      queryClient.setQueryData(['messages', message.roomId], (old: any) => [message, ...(old || [])]);
    };
    const reactionHandler = (message: any) => {
      queryClient.setQueryData(['messages', message.roomId], (old: any) => {
        return (old || []).map((item: any) => (item._id === message._id ? message : item));
      });
    };
    socket.on('message:new', newHandler);
    socket.on('message:reaction', reactionHandler);
    return () => {
      socket.off('message:new', newHandler);
      socket.off('message:reaction', reactionHandler);
    };
  }, [socket, queryClient]);

  const handleSend = async (content: string, files: File[]) => {
    if (!activeRoom) return;
    const attachments = [];
    for (const file of files) {
      const presign = await presignUpload({ fileName: file.name, mimeType: file.type });
      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      attachments.push({
        fileName: file.name,
        url: presign.fileUrl,
        mimeType: file.type,
        size: file.size
      });
    }

    const payload = {
      roomId: activeRoom._id,
      content,
      replyingToMessageId: replyingTo,
      attachments
    };
    await sendMessage(payload);
    setReplyingTo(null);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    await reactMessage({ messageId, emoji });
  };

  const handleCreateRoom = () => {
    const ids = memberIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (roomType === 'dm' && ids.length !== 1) {
      return;
    }

    const payload = {
      name: roomType === 'group' ? roomName : undefined,
      type: roomType,
      members: ids.map((id) => ({ userId: id, role: 'member' }))
    };

    createRoomMutation.mutate(payload);
  };

  const handleLogout = () => {
    setAccessToken(null);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" minH="100vh">
        <Spinner size="xl" color="brand.200" />
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Sidebar
        rooms={rooms}
        favourites={rooms.slice(0, 2)}
        onSelect={setActiveRoom}
        onNewChat={onOpen}
      />
      <Box flex="1" p={6}>
        <Flex align="center" justify="space-between" mb={4}>
          <Heading size="md">Chat</Heading>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </Flex>
        {!activeRoom ? (
          <Box textAlign="center" mt={20}>
            <Heading size="lg" color="brand.100">
              Select a conversation
            </Heading>
            <Text color="gray.400" mt={2}>
              Choose a DM or group chat to get started.
            </Text>
          </Box>
        ) : (
          <Box>
            <Heading size="md" mb={4}>
              {activeRoom.name ?? 'Direct Message'}
            </Heading>
            <Input
              placeholder="Search messages"
              mb={4}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
            />
            <MessageList
              messages={searchQuery ? searchResults : messages}
              currentUserId={userId}
              onReact={handleReact}
              onReply={(messageId) => setReplyingTo(messageId)}
            />
            <Composer onSend={handleSend} replyingTo={replyingTo} onClearReply={() => setReplyingTo(null)} />
          </Box>
        )}
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.900">
          <ModalHeader>Start a conversation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Select value={roomType} onChange={(event) => setRoomType(event.target.value as 'dm' | 'group')}>
                <option value="dm">Direct message</option>
                <option value="group">Group chat</option>
              </Select>
              {roomType === 'group' && (
                <Input
                  placeholder="Group name"
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                />
              )}
              <Textarea
                placeholder="Member user IDs, comma separated"
                value={memberIds}
                onChange={(event) => setMemberIds(event.target.value)}
              />
              <Text fontSize="sm" color="gray.400">
                For a DM, enter exactly one user ID.
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleCreateRoom} isLoading={createRoomMutation.isPending}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
