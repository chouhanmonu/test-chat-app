import { useState } from 'react';
import { Button, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { setAuthToken } from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const getDeviceId = () => {
  const existing = localStorage.getItem('deviceId');
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem('deviceId', id);
  return id;
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAccessToken } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setAuthToken(data.accessToken);
      navigate('/chat');
    }
  });

  const handleSubmit = () => {
    mutation.mutate({
      email,
      password,
      deviceId: getDeviceId()
    });
  };

  return (
    <Flex minH="100vh" align="center" justify="center" px={6}>
      <Stack spacing={4} bg="rgba(15, 23, 42, 0.8)" p={8} borderRadius="24px" w="sm">
        <Heading size="lg">Welcome back</Heading>
        <Text color="gray.400">Sign in to continue chatting.</Text>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleSubmit} isLoading={mutation.isPending}>
          Sign in
        </Button>
        <Text fontSize="sm" color="gray.400">
          New here? <Link to="/register">Create an account</Link>
        </Text>
      </Stack>
    </Flex>
  );
};
