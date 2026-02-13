import { api } from './axios';

export const fetchRooms = async () => {
  const { data } = await api.get('/rooms');
  return data;
};

export const createRoom = async (payload: any) => {
  const { data } = await api.post('/rooms', payload);
  return data;
};

export const createDmByEmail = async (payload: { email: string }) => {
  const { data } = await api.post('/rooms/dm-by-email', payload);
  return data;
};

export const createGroupByEmail = async (payload: { name?: string; emails: string[] }) => {
  const { data } = await api.post('/rooms/group-by-email', payload);
  return data;
};

export const fetchRoomKeys = async (roomId: string) => {
  const { data } = await api.get(`/rooms/${roomId}/keys`);
  return data;
};

export const fetchRoomE2ee = async (roomId: string) => {
  const { data } = await api.get(`/rooms/${roomId}/e2ee`);
  return data;
};

export const updateRoomE2ee = async (roomId: string, payload: any) => {
  const { data } = await api.patch(`/rooms/${roomId}/e2ee`, payload);
  return data;
};
