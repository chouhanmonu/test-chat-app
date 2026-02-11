import { api } from './axios';

export const fetchMessages = async (roomId: string) => {
  const { data } = await api.get(`/messages/${roomId}`);
  return data;
};

export const sendMessage = async (payload: any) => {
  const { data } = await api.post('/messages', payload);
  return data;
};

export const searchMessages = async (payload: any) => {
  const { data } = await api.post('/messages/search', payload);
  return data;
};

export const reactMessage = async (payload: any) => {
  const { data } = await api.post('/messages/reactions', payload);
  return data;
};
