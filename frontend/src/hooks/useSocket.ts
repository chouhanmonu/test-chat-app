import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { accessToken } = useAuth();

  const socket: Socket | null = useMemo(() => {
    if (!accessToken) return null;
    return io(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/chat`, {
      auth: { token: accessToken }
    });
  }, [accessToken]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return socket;
};
