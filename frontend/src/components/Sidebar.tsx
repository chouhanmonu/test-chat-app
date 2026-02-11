import { Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';

export type Room = {
  _id: string;
  name?: string;
  type: 'dm' | 'group';
};

type SidebarProps = {
  rooms: Room[];
  favourites: Room[];
  onSelect: (room: Room) => void;
  onNewChat: () => void;
};

export const Sidebar = ({ rooms, favourites, onSelect, onNewChat }: SidebarProps) => {
  return (
    <Box
      w={{ base: '100%', md: '320px' }}
      bg="rgba(15, 23, 42, 0.75)"
      backdropFilter="blur(12px)"
      p={4}
      borderRight="1px solid"
      borderColor="whiteAlpha.200"
      minH="100vh"
    >
      <Heading size="md" mb={4} color="brand.200">
        Conversations
      </Heading>
      <Button colorScheme="teal" size="sm" mb={4} onClick={onNewChat}>
        New chat
      </Button>

      <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="gray.400">
        Favourites
      </Text>
      <Stack spacing={2} mt={2} mb={4}>
        {favourites.length === 0 && <Text color="gray.500">No favourites yet.</Text>}
        {favourites.map((room) => (
          <Button
            key={room._id}
            variant="ghost"
            justifyContent="flex-start"
            onClick={() => onSelect(room)}
          >
            {room.name ?? 'Direct Message'}
          </Button>
        ))}
      </Stack>

      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="gray.400">
          All Rooms
        </Text>
        <Text fontSize="xs" color="gray.500">
          {rooms.length}
        </Text>
      </HStack>

      <Stack spacing={2}>
        {rooms.map((room) => (
          <Button
            key={room._id}
            variant="ghost"
            justifyContent="flex-start"
            onClick={() => onSelect(room)}
          >
            {room.name ?? 'Direct Message'}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};
