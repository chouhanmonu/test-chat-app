import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { accessToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);

  if (accessToken && tokenRef.current !== accessToken) {
    console.log('[socket] init', 'token-present');
    tokenRef.current = accessToken;
    socketRef.current?.disconnect();
    socketRef.current = io(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/chat`, {
      auth: { token: accessToken },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true
    });
  }

  if (!accessToken && socketRef.current) {
    console.log('[socket] init', 'no-token');
    socketRef.current.disconnect();
    socketRef.current = null;
    tokenRef.current = null;
  }

  const socket = socketRef.current;

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      console.log('[socket] connected', socket.id);
    };
    const onConnectError = (err: any) => {
      console.log("[socket] connect_error", err?.message ?? err);
    };
    const onDisconnect = (reason: string) => {
      console.log("[socket] disconnected", reason);
    };
    socket.on('connect', onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return socket;
};
