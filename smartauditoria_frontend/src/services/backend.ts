// Servicio para conectar con el backend Flask
import { API_BASE_URL } from '../config/api';
import { apiRequest } from './api';

// Tipos de datos
export interface Activo {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
  criticidad: string;
  fecha_creacion: string;
  descripcion?: string;
  propietario?: string;
  ubicacion?: string;
}

export interface ActivosStats {
  total: number;
  en_produccion: number;
  alta_criticidad: number;
  requieren_backup: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  fecha_creacion: string;
  ultimo_acceso?: string;
}

export interface Riesgo {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: 'LOW' | 'MEDIUM' | 'HIGH';
  probabilidad: string;
  impacto: string;
  estado: string;
  activo_id: number;
  propietario: string;
  fecha_identificacion: string;
}

export interface DashboardStats {
  total_activos: number;
  usuarios_activos: number;
  riesgos_identificados: number;
  tendencia: number;
  activos_por_tipo: { [key: string]: number };
  riesgos_por_estado: { [key: string]: number };
}

export interface DashboardHistoryPoint {
  month: string; // YYYY-MM
  count: number;
  cumulative: number;
}

export interface DashboardHistory {
  activos: { total: number; monthly: DashboardHistoryPoint[] };
  riesgos: { total: number; monthly: DashboardHistoryPoint[] };
}

// Funciones de servicio de API

// Servicios de Activos
export const activosService = {
  // Obtener todos los activos
  async getAll(): Promise<Activo[]> {
    try {
      return await apiRequest<Activo[]>('/activos');
    } catch (error) {
      console.error('Error fetching activos:', error);
      return [];
    }
  },

  // Crear nuevo activo
  async create(activo: Omit<Activo, 'id' | 'fecha_creacion'>): Promise<Activo> {
    try {
      return await apiRequest<Activo>('/activos', {
        method: 'POST',
        body: JSON.stringify(activo),
      });
    } catch (error) {
      console.error('Error creating activo:', error);
      throw error;
    }
  },

  // Actualizar activo
  async update(id: number, activo: Partial<Activo>): Promise<Activo> {
    try {
      return await apiRequest<Activo>(`/activos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(activo),
      });
    } catch (error) {
      console.error('Error updating activo:', error);
      throw error;
    }
  },

  // Eliminar activo
  async delete(id: number): Promise<void> {
    try {
      await apiRequest<void>(`/activos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting activo:', error);
      throw error;
    }
  }
  ,
  async getStats(): Promise<ActivosStats> {
    try {
      return await apiRequest<ActivosStats>('/activos/stats');
    } catch (error) {
      console.error('Error fetching activos stats:', error);
      return { total: 0, en_produccion: 0, alta_criticidad: 0, requieren_backup: 0 };
    }
  }
};

// Servicios de Usuarios
export const usuariosService = {
  // Obtener todos los usuarios
  async getAll(): Promise<Usuario[]> {
    try {
      return await apiRequest<Usuario[]>('/usuarios');
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      return [];
    }
  },

  // Crear nuevo usuario
  async create(usuario: Omit<Usuario, 'id' | 'fecha_creacion'>): Promise<Usuario> {
    try {
      return await apiRequest<Usuario>('/usuarios', {
        method: 'POST',
        body: JSON.stringify(usuario),
      });
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  },

  // Actualizar usuario
  async update(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    try {
      return await apiRequest<Usuario>(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(usuario),
      });
    } catch (error) {
      console.error('Error updating usuario:', error);
      throw error;
    }
  },

  // Eliminar usuario
  async delete(id: number): Promise<void> {
    try {
      await apiRequest<void>(`/usuarios/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting usuario:', error);
      throw error;
    }
  },

  // Obtener detalle completo del usuario
  async getDetalleUsuario(usuarioId: number): Promise<any> {
    try {
      return await apiRequest<any>(`/usuarios/${usuarioId}/detalle`);
    } catch (error) {
      console.error('Error fetching detalle usuario:', error);
      throw error;
    }
  }
};

// Servicios de Riesgos
export const riesgosService = {
  // Obtener todos los riesgos
  async getAll(): Promise<Riesgo[]> {
    try {
      return await apiRequest<Riesgo[]>('/riesgos');
    } catch (error) {
      console.error('Error fetching riesgos:', error);
      return [];
    }
  },

  // Obtener matriz de riesgos
  async getMatrix(periodo?: string): Promise<any> {
    try {
      const params = periodo ? `?periodo=${periodo}` : '';
      return await apiRequest<any>(`/riesgos/matriz-riesgo${params}`);
    } catch (error) {
      console.error('Error fetching risk matrix:', error);
      return { cells: [], health: { low: 0, medium: 0, high: 0, score: 0 } };
    }
  }
};

// Servicios de Dashboard
export const dashboardService = {
  // Obtener estadisticas del dashboard
  async getStats(): Promise<DashboardStats> {
    try {
      return await apiRequest<DashboardStats>('/dashboard/stats');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        total_activos: 0,
        usuarios_activos: 0,
        riesgos_identificados: 0,
        tendencia: 0,
        activos_por_tipo: {},
        riesgos_por_estado: {}
      };
    }
  }
  ,
  // Obtener historial (ultimos 12 meses y acumulado)
  async getHistory(): Promise<DashboardHistory> {
    try {
      return await apiRequest<DashboardHistory>('/dashboard/historial');
    } catch (error) {
      console.error('Error fetching dashboard history:', error);
      // Mock minimo para no romper UI
      const months = Array.from({ length: 12 }, (_, i) => i).map((i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i), 1);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return { month, count: 0, cumulative: 0 } as DashboardHistoryPoint;
      });
      return { activos: { total: 0, monthly: months }, riesgos: { total: 0, monthly: months } };
    }
  },

  // Obtener evolucion de riesgos (ultimos 6 meses)
  async getEvolucionRiesgos(): Promise<{ evolucion: Array<{ mes: string; riesgos: number; mitigados: number }> }> {
    try {
      return await apiRequest<{ evolucion: Array<{ mes: string; riesgos: number; mitigados: number }> }>('/dashboard/evolucion-riesgos');
    } catch (error) {
      console.error('Error fetching evolucion riesgos:', error);
      // Retornar array vacio en caso de error
      return { evolucion: [] };
    }
  },
  // Sistemas de informacion breakdown
  async getSistemasInfoBreakdown(by: 'criticidad' | 'secretaria' = 'criticidad'): Promise<{ by: string; data: { [key: string]: number } }> {
    try {
      return await apiRequest<{ by: string; data: { [key: string]: number } }>(`/dashboard/sistemas-info/resumen?by=${by}`);
    } catch (error) {
      console.error('Error fetching sistemas info breakdown:', error);
      return { by, data: {} };
    }
  },
  // Matriz de riesgos dinamica
  async getMatrizRiesgos(params?: any): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activo_id) queryParams.append('activo_id', params.activo_id.toString());
      if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
      if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
      
      const url = `/dashboard/matriz-riesgos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await apiRequest<any>(url);
    } catch (error) {
      console.error('Error fetching matriz de riesgos:', error);
      return { matriz: [], estadisticas: { total: 0, altos: 0, medios: 0, bajos: 0 } };
    }
  },
  async exportarMatrizRiesgos(params?: any): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activo_id) queryParams.append('activo_id', params.activo_id.toString());
      if (params?.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
      if (params?.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
      
      const url = `/dashboard/matriz-riesgos/exportar${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await apiRequest<any>(url);
    } catch (error) {
      console.error('Error exporting matriz de riesgos:', error);
      throw error;
    }
  },
  async getReporteCompletoRiesgos(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/reporte-completo-riesgos');
    } catch (error) {
      console.error('Error fetching reporte completo de riesgos:', error);
      throw error;
    }
  },
  async getActivosEvaluadosDetalle(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/activos-evaluados-detalle');
    } catch (error) {
      console.error('Error fetching activos evaluados detalle:', error);
      throw error;
    }
  },
  async getRiesgosConActivos(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/riesgos-con-activos');
    } catch (error) {
      console.error('Error fetching riesgos con activos:', error);
      throw error;
    }
  },
  async getRiesgosAltosDetalle(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/riesgos-altos-detalle');
    } catch (error) {
      console.error('Error fetching riesgos altos detalle:', error);
      throw error;
    }
  },
  async getEstadisticasActivos(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/estadisticas-activos');
    } catch (error) {
      console.error('Error fetching estadisticas de activos:', error);
      throw error;
    }
  },
  async getTendenciasSeguridad(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/tendencias-seguridad');
    } catch (error) {
      console.error('Error fetching tendencias de seguridad:', error);
      throw error;
    }
  },
  async getReporteUsuariosEvidencias(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/reporte-usuarios-evidencias');
    } catch (error) {
      console.error('Error fetching reporte usuarios evidencias:', error);
      throw error;
    }
  },
  async getActivos(): Promise<any[]> {
    try {
      return await apiRequest<any[]>('/activos/');
    } catch (error) {
      console.error('Error fetching activos:', error);
      return [];
    }
  },
  // Salud institucional
  async getSaludInstitucional(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/salud-institucional');
    } catch (error) {
      console.error('Error fetching salud institucional:', error);
      return { porcentaje: 100, estado: 'BUENO', distribucion: { altos: 0, medios: 0, bajos: 0, total: 0 } };
    }
  },
  // Riesgos activos y mitigados
  async getRiesgosActivosMitigados(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/riesgos-activos-mitigados');
    } catch (error) {
      console.error('Error fetching riesgos activos/mitigados:', error);
      return { activos: 0, mitigados: 0 };
    }
  },
  // Top riesgos criticos
  async getTopRiesgosCriticos(): Promise<any> {
    try {
      return await apiRequest<any>('/dashboard/top-riesgos-criticos');
    } catch (error) {
      console.error('Error fetching top riesgos criticos:', error);
      return { riesgos: [] };
    }
  },
  // Alertas del sistema
  async getAlertas(): Promise<any[]> {
    try {
      return await apiRequest<any[]>('/dashboard/alertas');
    } catch (error) {
      console.error('Error fetching alertas:', error);
      return [];
    }
  }
};

// Servicios de Vulnerabilidades
export const vulnerabilidadesService = {
  // Obtener todas las vulnerabilidades
  async getAll(filters?: {
    search?: string;
    categoria?: string;
    severidad?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.categoria) params.append('categoria', filters.categoria);
      if (filters?.severidad) params.append('severidad', filters.severidad);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString();
      const url = queryString ? `/vulnerabilidades?${queryString}` : '/vulnerabilidades';
      return await apiRequest<any[]>(url);
    } catch (error) {
      console.error('Error fetching vulnerabilidades:', error);
      return [];
    }
  },

  // Obtener sugerencias predictivas
  async getSugerencias(texto: string): Promise<any[]> {
    try {
      return await apiRequest<any[]>(`/vulnerabilidades/sugerencias?texto=${encodeURIComponent(texto)}`);
    } catch (error) {
      console.error('Error fetching sugerencias:', error);
      return [];
    }
  },

  // Obtener categorias
  async getCategorias(): Promise<string[]> {
    try {
      return await apiRequest<string[]>('/vulnerabilidades/categorias');
    } catch (error) {
      console.error('Error fetching categorias:', error);
      return [];
    }
  },

  // Obtener severidades
  async getSeveridades(): Promise<string[]> {
    try {
      return await apiRequest<string[]>('/vulnerabilidades/severidades');
    } catch (error) {
      console.error('Error fetching severidades:', error);
      return [];
    }
  }
};

export default {
  activosService,
  usuariosService,
  riesgosService,
  dashboardService,
  vulnerabilidadesService
};
