import apiClient from './client';
import type { Prospecto, ProspectoFormData } from '@/types/prospecto';

export const prospectosApi = {
  // Obtener todos los prospectos
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    tipo_deuda?: string;
    estado?: string;
    search?: string;
  }) => {
    const response = await apiClient.get<{
      data: Prospecto[];
      total: number;
      current_page: number;
      per_page: number;
    }>('/prospectos', { params });
    return response.data;
  },

  // Obtener un prospecto por ID
  getById: async (id: number) => {
    const response = await apiClient.get<Prospecto>(`/prospectos/${id}`);
    return response.data;
  },

  // Crear prospecto
  create: async (data: ProspectoFormData) => {
    const response = await apiClient.post<Prospecto>('/prospectos', data);
    return response.data;
  },

  // Actualizar prospecto
  update: async (id: number, data: Partial<ProspectoFormData>) => {
    const response = await apiClient.put<Prospecto>(`/prospectos/${id}`, data);
    return response.data;
  },

  // Eliminar prospecto
  delete: async (id: number) => {
    await apiClient.delete(`/prospectos/${id}`);
  },

  // Importar prospectos desde Excel
  import: async (prospectos: any[]) => {
    const response = await apiClient.post<{
      success: number;
      failed: number;
      errors: string[];
    }>('/prospectos/import', { prospectos });
    return response.data;
  },

  // Exportar prospectos a Excel
  export: async (filters?: any) => {
    const response = await apiClient.get('/prospectos/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};