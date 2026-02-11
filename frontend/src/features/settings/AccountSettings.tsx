import { useState } from 'react';
import { Button, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { changeEmail, deleteAccount } from '../../api/users';

export const AccountSettings = () => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const changeMutation = useMutation({ mutationFn: changeEmail });
  const deleteMutation = useMutation({ mutationFn: deleteAccount });

  return (
    <Stack spacing={4}>
      <Heading size="md">Account settings</Heading>
      <Text color="gray.400">Manage security and lifecycle.</Text>
      <Input placeholder="New email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
      <Input
        placeholder="Current password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        colorScheme="teal"
        onClick={() => changeMutation.mutate({ newEmail, password })}
        isLoading={changeMutation.isPending}
      >
        Change email
      </Button>
      <Button
        colorScheme="red"
        variant="outline"
        onClick={() => deleteMutation.mutate({ password })}
        isLoading={deleteMutation.isPending}
      >
        Delete account
      </Button>
    </Stack>
  );
};
