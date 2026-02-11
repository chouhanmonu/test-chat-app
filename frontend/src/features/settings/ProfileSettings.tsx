import { useState } from 'react';
import { Button, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { updateProfile, verifyAltEmail } from '../../api/users';

export const ProfileSettings = () => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const updateMutation = useMutation({ mutationFn: updateProfile });
  const verifyMutation = useMutation({ mutationFn: verifyAltEmail });

  return (
    <Stack spacing={4}>
      <Heading size="md">Profile settings</Heading>
      <Text color="gray.400">Manage your identity across chats.</Text>
      <Input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Avatar URL" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
      <Input
        placeholder="Alternate email"
        value={alternateEmail}
        onChange={(e) => setAlternateEmail(e.target.value)}
      />
      <Input placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      <Button
        colorScheme="teal"
        onClick={() => updateMutation.mutate({ name, profilePictureUrl: avatar, alternateEmail, mobile })}
        isLoading={updateMutation.isPending}
      >
        Save profile
      </Button>
      <Button
        variant="outline"
        onClick={() => verifyMutation.mutate({ alternateEmail })}
        isLoading={verifyMutation.isPending}
      >
        Verify alternate email
      </Button>
    </Stack>
  );
};
