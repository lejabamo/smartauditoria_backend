import api from './api';

export interface Activo {
  ID_Activo: number;
  id?: number;
  ID?: number;
  Nombre: string;
  nombre?: string;
  nombre_Activo?: string;
  Descripcion?: string;
  descripcion?: string;
  Tipo_Activo: string;
  tipo?: string;
  Tipo?: string;
  subtipo_activo?: string;
  ID_Propietario?: number;
  ID_Custodio?: number;
  Nivel_Clasificacion_Confidencialidad: string;
  Nivel_Clasificacion_Integridad: string;
  Nivel_Clasificacion_Disponibilidad: string;
  justificacion_clasificacion_cia?: string;
  nivel_criticidad_negocio: string;
  estado_activo: string;
  fuente_datos_principal?: string;
  id_externo_glpi?: string;
  id_externo_inventario_si?: string;
  fecha_adquisicion?: string;
  version_general_activo?: string;
  requiere_backup: boolean;
  frecuencia_backup_general?: string;
  tiempo_retencion_general?: string;
  fecha_proxima_revision_sgsi?: string;
  procedimiento_eliminacion_segura_ref?: string;
  fecha_creacion_registro: string;
  fecha_ultima_actualizacion_sgsi?: string;
}

export interface CreateActivoData {
  Nombre: string;
  Descripcion?: string;
  Tipo_Activo: string;
  subtipo_activo?: string;
  ID_Propietario?: number;
  ID_Custodio?: number;
  Nivel_Clasificacion_Confidencialidad?: string;
  Nivel_Clasificacion_Integridad?: string;
  Nivel_Clasificacion_Disponibilidad?: string;
  justificacion_clasificacion_cia?: string;
  nivel_criticidad_negocio?: string;
  estado_activo?: string;
  fuente_datos_principal?: string;
  id_externo_glpi?: string;
  id_externo_inventario_si?: string;
  fecha_adquisicion?: string;
  version_general_activo?: string;
  requiere_backup?: boolean;
  frecuencia_backup_general?: string;
  tiempo_retencion_general?: string;
  fecha_proxima_revision_sgsi?: string;
  procedimiento_eliminacion_segura_ref?: string;
}

export interface UpdateActivoData extends Partial<CreateActivoData> {}

export const activosService = {
  // Obtener todos los activos con filtros opcionales
  async getActivos(filters?: {
    tipo_activo?: string;
    estado?: string;
    nivel_criticidad?: string;
  }): Promise<Activo[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.tipo_activo) params.append('tipo_activo', filters.tipo_activo);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.nivel_criticidad) params.append('nivel_criticidad', filters.nivel_criticidad);

      const response = await api.get(`/activos/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn("API fallida, usando Mock Data para Activos");
      return [
        { ID_Activo: 1, Nombre: "Servidor Producción Core", Tipo_Activo: "Hardware", Nivel_Clasificacion_Confidencialidad: "Alta", Nivel_Clasificacion_Integridad: "Alta", Nivel_Clasificacion_Disponibilidad: "Alta", nivel_criticidad_negocio: "Crítica", estado_activo: "En Producción", requiere_backup: true, fecha_creacion_registro: "2026-04-01" },
        { ID_Activo: 2, Nombre: "Base de Datos Usuarios", Tipo_Activo: "Software", Nivel_Clasificacion_Confidencialidad: "Alta", Nivel_Clasificacion_Integridad: "Muy Alta", Nivel_Clasificacion_Disponibilidad: "Alta", nivel_criticidad_negocio: "Crítica", estado_activo: "En Producción", requiere_backup: true, fecha_creacion_registro: "2026-04-02" },
        { ID_Activo: 3, Nombre: "Laptop Auditoría 01", Tipo_Activo: "Hardware", Nivel_Clasificacion_Confidencialidad: "Media", Nivel_Clasificacion_Integridad: "Media", Nivel_Clasificacion_Disponibilidad: "Media", nivel_criticidad_negocio: "Media", estado_activo: "En Producción", requiere_backup: false, fecha_creacion_registro: "2026-04-05" },
        { ID_Activo: 4, Nombre: "Repositorio GitHub Privado", Tipo_Activo: "Servicio Cloud", Nivel_Clasificacion_Confidencialidad: "Muy Alta", Nivel_Clasificacion_Integridad: "Alta", Nivel_Clasificacion_Disponibilidad: "Alta", nivel_criticidad_negocio: "Alta", estado_activo: "En Producción", requiere_backup: true, fecha_creacion_registro: "2026-04-08" }
      ];
    }
  },

  // Obtener un activo especifico
  async getActivo(id: number): Promise<Activo> {
    const response = await api.get(`/activos/${id}`);
    return response.data;
  },

  // Crear un nuevo activo
  async createActivo(data: CreateActivoData): Promise<Activo> {
    try {
      console.log('createActivo called with data:', data);
      console.log('API base URL:', api.defaults.baseURL);
      const response = await api.post('/activos/', data);
      console.log('createActivo response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error creating activo:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      // Re-lanzar el error para que el componente pueda manejarlo
      throw error;
    }
  },

  // Actualizar un activo
  async updateActivo(id: number, data: UpdateActivoData): Promise<Activo> {
    const response = await api.put(`/activos/${id}`, data);
    return response.data;
  },

  // Eliminar un activo
  async deleteActivo(id: number): Promise<void> {
    await api.delete(`/activos/${id}`);
  },

  // Obtener tipos de activo unicos
  async getTiposActivo(): Promise<string[]> {
    const response = await api.get('/activos/tipos');
    return response.data;
  },

  // Obtener estados de activo unicos
  async getEstadosActivo(): Promise<string[]> {
    const response = await api.get('/activos/estados');
    return response.data;
  },

  // Obtener riesgos asociados a un activo
  async getRiesgosActivo(activoId: number): Promise<any[]> {
    const response = await api.get(`/activos/${activoId}/riesgos`);
    return response.data;
  },
  
  // Obtener detalle completo del activo con evaluaciones
  async getDetalleActivo(activoId: number): Promise<any> {
    const response = await api.get(`/activos/${activoId}/detalle`);
    return response.data;
  }
};
