import { api } from './axios';

export const fetchRooms = async () => {
  const { data } = await api.get('/rooms');
  return data;
};

export const createRoom = async (payload: any) => {
  const { data } = await api.post('/rooms', payload);
  return data;
};
