import { $api } from '@/shared/api/base';

export interface ActivoDTO {
  id: number;
  nombre: string;
  tipo_activo: string;
  descripcion?: string;
  confidencialidad: string;
  integridad: string;
  disponibilidad: string;
  nivel_criticidad: string;
  estado_activo: string;
  id_propietario?: number;
  id_custodio?: number;
  score_cia: number;
  es_critico: boolean;
  fecha_creacion?: string;
}

export interface ListActivosResponse {
  activos: ActivoDTO[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const activoApi = {
  /**
   * Obtiene la lista paginada de activos (v2 API).
   */
  getList: async (params?: { page?: number; per_page?: number; tipo?: string; criticidad?: string }) => {
    const response = await $api.get<ListActivosResponse>('/activos/', { params });
    return response.data;
  },

  /**
   * Obtiene un activo por su ID.
   */
  getById: async (id: number) => {
    const response = await $api.get<ActivoDTO>(`/activos/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo activo.
   */
  create: async (data: Partial<ActivoDTO>) => {
    const response = await $api.post<ActivoDTO>('/activos/', data);
    return response.data;
  },

  /**
   * Actualiza un activo existente.
   */
  update: async (id: number, data: Partial<ActivoDTO>) => {
    const response = await $api.put<ActivoDTO>(`/activos/${id}`, data);
    return response.data;
  },

  /**
   * Elimina (soft delete) un activo.
   */
  delete: async (id: number) => {
    const response = await $api.delete(`/activos/${id}`);
    return response.data;
  },
};
