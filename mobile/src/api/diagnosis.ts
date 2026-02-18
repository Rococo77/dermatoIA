import apiClient from './client';
import { Diagnosis, DiagnosisListResponse, DiagnosisStats } from '../types';

export const diagnosisApi = {
  createDiagnosis: async (imageUri: string): Promise<Diagnosis> => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'skin_photo.jpg',
    } as any);

    const response = await apiClient.post('/diagnosis/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },

  getDiagnosis: async (id: string): Promise<Diagnosis> => {
    const response = await apiClient.get(`/diagnosis/${id}`);
    return response.data;
  },

  getLatest: async (): Promise<Diagnosis> => {
    const response = await apiClient.get('/diagnosis/latest/');
    return response.data;
  },

  getHistory: async (page: number = 1, limit: number = 10): Promise<DiagnosisListResponse> => {
    const response = await apiClient.get('/history/', { params: { page, limit } });
    return response.data;
  },

  getStats: async (): Promise<DiagnosisStats> => {
    const response = await apiClient.get('/history/stats');
    return response.data;
  },

  deleteDiagnosis: async (id: string): Promise<void> => {
    await apiClient.delete(`/history/${id}`);
  },
};
