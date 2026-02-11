import { api } from './axios';

export const presignUpload = async (payload: { fileName: string; mimeType: string }) => {
  const { data } = await api.post('/attachments/presign', payload);
  return data as { uploadUrl: string; fileUrl: string; key: string };
};
