import { api } from './axios';

export type LoginPayload = {
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
  publicKey: string;
};

export type RegisterPayload = LoginPayload & { name: string };

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};
