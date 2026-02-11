import { api } from './axios';

export const updateProfile = async (payload: any) => {
  const { data } = await api.patch('/users/profile', payload);
  return data;
};

export const verifyAltEmail = async (payload: any) => {
  const { data } = await api.post('/users/verify-alt-email', payload);
  return data;
};

export const changeEmail = async (payload: any) => {
  const { data } = await api.post('/auth/change-email', payload);
  return data;
};

export const deleteAccount = async (payload: any) => {
  const { data } = await api.post('/auth/delete-account', payload);
  return data;
};
