import { useState } from 'react';
import { Button, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { register } from '../../api/auth';
import { setAuthToken } from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ensureKeyPair } from '../../utils/crypto';

const getDeviceId = () => {
  const existing = localStorage.getItem('deviceId');
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem('deviceId', id);
  return id;
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAccessToken } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setAuthToken(data.accessToken);
      navigate('/chat');
    }
  });

  const handleSubmit = async () => {
    const { publicKey } = await ensureKeyPair();
    mutation.mutate({
      name,
      email,
      password,
      deviceId: getDeviceId(),
      publicKey
    });
  };

  return (
    <Flex minH="100vh" align="center" justify="center" px={6}>
      <Stack spacing={4} bg="rgba(15, 23, 42, 0.8)" p={8} borderRadius="24px" w="sm">
        <Heading size="lg">Create account</Heading>
        <Text color="gray.400">Start a new conversation in minutes.</Text>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleSubmit} isLoading={mutation.isPending}>
          Register
        </Button>
        <Text fontSize="sm" color="gray.400">
          Already have an account? <Link to="/login">Sign in</Link>
        </Text>
      </Stack>
    </Flex>
  );
};
