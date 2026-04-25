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
      const res = await apiRequest<Activo[]>('/activos');
      if (!res || res.length === 0) throw new Error('Forzando mock por array vacío');
      return res;
    } catch (error) {
      console.warn('API fallida o vacía, usando Mock Data para Lista de Activos en backend.ts');
      return [
        { id: 1, nombre: "Servidor Producción Core", tipo: "Hardware", estado: "En Produccion", criticidad: "Crítica", fecha_creacion: "2026-04-01" },
        { id: 2, nombre: "Base de Datos Usuarios", tipo: "Software", estado: "En Produccion", criticidad: "Crítica", fecha_creacion: "2026-04-02" },
        { id: 3, nombre: "Laptop Auditoría 01", tipo: "Hardware", estado: "En Produccion", criticidad: "Media", fecha_creacion: "2026-04-05" },
        { id: 4, nombre: "Repositorio GitHub Privado", tipo: "Servicio Cloud", estado: "En Produccion", criticidad: "Alta", fecha_creacion: "2026-04-08" }
      ];
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
      const res = await apiRequest<Usuario[]>('/usuarios');
      if (!res || res.length === 0) throw new Error('Forzando mock por array vacío');
      return res;
    } catch (error) {
      console.warn('API fallida o vacía, usando Mock Data para Lista de Usuarios en backend.ts');
      return [
        { id: 1, nombre: "Lic. Auditor Senior", email: "auditor.senior@univalle.edu.co", rol: "Auditor Jefe", estado: "Activo", fecha_creacion: "2026-04-01" },
        { id: 2, nombre: "Ing. Seguridad TI", email: "seguridad.ti@univalle.edu.co", rol: "CISO", estado: "Activo", fecha_creacion: "2026-04-02" },
        { id: 3, nombre: "Admin Sistema", email: "admin.sgsri@univalle.edu.co", rol: "Administrador", estado: "Activo", fecha_creacion: "2026-04-05" },
        { id: 4, nombre: "Consultor Externo", email: "consultor.iso@ext.univalle.edu.co", rol: "Consultor", estado: "Activo", fecha_creacion: "2026-04-08" }
      ];
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
      const res = await apiRequest<any>(`/riesgos/matriz-riesgo${params}`);
      if (!res || !res.cells || res.cells.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('Usando Mock Data para getMatrix en backend.ts');
      // Matriz 4x5 mock, combinando probabilidad (1-4) e impacto (1-5)
      return {
        health: { low: 8, medium: 4, high: 2, score: 75 },
        cells: [
          { likelihood: 4, severity: 5, count: 0, label: "Alto" },
          { likelihood: 4, severity: 4, count: 1, label: "Alto" },
          { likelihood: 4, severity: 3, count: 1, label: "Alto" },
          { likelihood: 3, severity: 5, count: 0, label: "Alto" },
          { likelihood: 3, severity: 3, count: 1, label: "Medio" },
          { likelihood: 2, severity: 4, count: 2, label: "Medio" },
          { likelihood: 1, severity: 2, count: 3, label: "Bajo" },
          { likelihood: 2, severity: 2, count: 1, label: "Bajo" }
        ]
      };
    }
  }
};

// Servicios de Dashboard
export const dashboardService = {
  // Obtener estadisticas del dashboard
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await apiRequest<DashboardStats>('/dashboard/stats');
      if (!res || typeof res.total_activos === 'undefined' || res.total_activos === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida o vacía, usando Mock Data para Dashboard Stats en backend.ts');
      return {
        total_activos: 4,
        usuarios_activos: 4,
        riesgos_identificados: 15,
        tendencia: 12,
        activos_por_tipo: { "Hardware": 2, "Software": 1, "Cloud": 1 },
        riesgos_por_estado: { "Bajo": 3, "Medio": 5, "Alto": 4, "Crítico": 3 }
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
      const res = await apiRequest<{ evolucion: Array<{ mes: string; riesgos: number; mitigados: number }> }>('/dashboard/evolucion-riesgos');
      if (!res || !res.evolucion || res.evolucion.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida o vacía, usando Mock Data para Evolucion Riesgos en backend.ts');
      return { 
        evolucion: [
          { mes: 'Nov', riesgos: 10, mitigados: 2 },
          { mes: 'Dic', riesgos: 12, mitigados: 4 },
          { mes: 'Ene', riesgos: 15, mitigados: 7 },
          { mes: 'Feb', riesgos: 14, mitigados: 9 },
          { mes: 'Mar', riesgos: 15, mitigados: 11 },
          { mes: 'Abr', riesgos: 16, mitigados: 13 }
        ] 
      };
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
      const res = await apiRequest<any>(url);
      if (!res || !res.matriz || res.matriz.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('Usando Mock Data para getMatrizRiesgos en backend.ts');
      // Matriz 4x5: PROBABILIDADES ['Frecuente', 'Ocasional', 'Posible', 'Improbable'] x IMPACTOS ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrofico']
      const getEmptyRow = () => Array.from({ length: 5 }, () => ({ cantidad: 0, activos: [] }));
      const matriz = [ getEmptyRow(), getEmptyRow(), getEmptyRow(), getEmptyRow() ];
      
      // Frecuente (0) x Catastrofico (4)
      matriz[0][4] = { cantidad: 1, activos: [{ id: 1, nombre: 'Servidor Core', nivel_riesgo: 'ALTO' }] };
      // Ocasional (1) x Moderado (2)
      matriz[1][2] = { cantidad: 2, activos: [{ id: 2, nombre: 'VPN', nivel_riesgo: 'MEDIO' }, { id: 3, nombre: 'Firewall', nivel_riesgo: 'MEDIO' }] };
      // Posible (2) x Mayor (3)
      matriz[2][3] = { cantidad: 1, activos: [{ id: 4, nombre: 'Web App', nivel_riesgo: 'ALTO' }] };
      
      return { 
        matriz, 
        estadisticas: { total: 4, altos: 2, medios: 2, bajos: 0 } 
      };
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
      const res = await apiRequest<any>('/dashboard/reporte-completo-riesgos');
      if (!res || !res.estadisticas || res.estadisticas.total_activos === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida o vacía, usando Mock Data para Reporte Completo en backend.ts');
      return {
        activos: [
          {
            id: 1, nombre: "Servidor Producción Core", tipo: "Hardware", criticidad: "Crítica", estado: "En Producción",
            descripcion: "Servidor principal donde residen las bases de datos transaccionales.",
            riesgos: [
              {
                id_riesgo: 101, nombre: "Caída de Servidor Core", categoria: "Infraestructura", total_controles: 2,
                evaluacion_inherente: { probabilidad: "Frecuente", impacto: "Mayor", nivel_riesgo: "Alto", justificacion: "Obsolescencia del sistema operativo" },
                evaluacion_residual: { probabilidad: "Posible", impacto: "Moderado", nivel_riesgo: "Medio", justificacion: "Se aplican parches de seguridad" }
              }
            ]
          },
          {
            id: 2, nombre: "Base de Datos Usuarios", tipo: "Software", criticidad: "Crítica", estado: "En Producción",
            descripcion: "Base de datos master de usuarios de Univalle",
            riesgos: [
              {
                id_riesgo: 102, nombre: "Fuga de Datos Confidenciales", categoria: "Seguridad", total_controles: 3,
                evaluacion_inherente: { probabilidad: "Probable", impacto: "Catastrófico", nivel_riesgo: "Alto", justificacion: "Accesos no encriptados" },
                evaluacion_residual: { probabilidad: "Improbable", impacto: "Menor", nivel_riesgo: "Bajo", justificacion: "Se implementa TLS 1.3" }
              }
            ]
          },
          {
            id: 3, nombre: "Laptop Auditoría 01", tipo: "Hardware", criticidad: "Media", estado: "En Producción",
            descripcion: "Equipo asignado al auditor",
            riesgos: [
              {
                id_riesgo: 103, nombre: "Ransomware en Equipos", categoria: "Ciberseguridad", total_controles: 1,
                evaluacion_inherente: { probabilidad: "Posible", impacto: "Mayor", nivel_riesgo: "Medio", justificacion: "El usuario frecuenta redes públicas" },
                evaluacion_residual: { probabilidad: "Improbable", impacto: "Moderado", nivel_riesgo: "Medio", justificacion: "DLP activado" }
              }
            ]
          }
        ],
        estadisticas: {
          total_activos: 4,
          activos_evaluados: 3,
          total_riesgos: 3,
          riesgos_altos: 2,
          riesgos_medios: 1,
          riesgos_bajos: 0
        }
      };
    }
  },
  async getActivosEvaluadosDetalle(): Promise<any> {
    try {
      const res = await apiRequest<any>('/dashboard/activos-evaluados-detalle');
      if (!res || !res.activos || res.activos.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('Usando Mock Data para Activos Evaluados Detalle');
      return {
        total: 3,
        activos: [
          { id: 1, nombre: "Servidor Producción Core", tipo: "Hardware", criticidad: "Crítica", estado: "Evaluado", riesgos: [1,2], descripcion: "Core principal" },
          { id: 2, nombre: "Base de Datos Usuarios", tipo: "Software", criticidad: "Crítica", estado: "Evaluado", riesgos: [3], descripcion: "Registro maestros" },
          { id: 3, nombre: "Laptop Auditoría 01", tipo: "Hardware", criticidad: "Media", estado: "Evaluado", riesgos: [], descripcion: "Auditoria interna" }
        ]
      };
    }
  },
  async getRiesgosConActivos(): Promise<any> {
    try {
      const res = await apiRequest<any>('/dashboard/riesgos-con-activos');
      if (!res || !res.riesgos || res.riesgos.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('Usando Mock Data para Riesgos con Activos');
      return {
        total: 3,
        riesgos: [
          { id_riesgo: 101, nombre: "Caída de Servidor Core", descripcion: "Corte de energía.", tipo: "Infraestructura", estado: "Abierto", activos: [{nombre: "Servidor Producción Core", tipo: "Hardware"}] },
          { id_riesgo: 102, nombre: "Fuga de Datos Confidenciales", descripcion: "Brecha por puertos DB.", tipo: "Seguridad", estado: "Mitigado", activos: [{nombre: "Base de Datos Usuarios", tipo: "Software"}] },
          { id_riesgo: 103, nombre: "Ransomware en Equipos", descripcion: "Infeccion en red local.", tipo: "Ciberseguridad", estado: "Tratamiento", activos: [{nombre: "Laptop Auditoría 01", tipo: "Hardware"}] }
        ]
      };
    }
  },
  async getRiesgosAltosDetalle(): Promise<any> {
    try {
      const res = await apiRequest<any>('/dashboard/riesgos-altos-detalle');
      if (!res || !res.riesgos || res.riesgos.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('Usando Mock Data para Riesgos Altos Detalle');
      return {
        total: 2,
        riesgos: [
          { 
            id_riesgo: 101, nombre: "Caída de Servidor Core", descripcion: "Obsolescencia", responsable: "Admin IT", estado_mitigacion: "En Mitigacion", estado: "Abierto",
            activo: { nombre: "Servidor Producción Core", tipo: "Hardware" },
            controles: [{nombre: "Parche 2.0", eficacia: "Alta", descripcion: "Parche aplicado"}],
            documentos_evidencia: [{nombre: "Evidencia1.pdf", tipo: "pdf", tamano: "10KB"}]
          },
          { 
            id_riesgo: 102, nombre: "Fuga de Datos Confidenciales", descripcion: "Accesos expuestos", responsable: "CISO", estado_mitigacion: "Mitigado", estado: "Cerrado",
            activo: { nombre: "Base de Datos Usuarios", tipo: "Software" },
            controles: [{nombre: "Cifrado AES", eficacia: "Muy Alta", descripcion: "DB Cifrada"}],
            documentos_evidencia: []
          }
        ]
      };
    }
  },
  async getEstadisticasActivos(): Promise<any> {
    try {
      const res = await apiRequest<any>('/dashboard/estadisticas-activos');
      if (!res || !res.total_activos) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida, usando Mock Data para Estadisticas Activos');
      return {
        total_activos: 4,
        por_tipo: { "Hardware": 2, "Software": 1, "Servicio Cloud": 1 },
        por_estado: { "En Producción": 4 },
        por_criticidad: { "Crítica": 2, "Media": 1, "Alta": 1 },
        backup: { con_backup: 3, sin_backup: 1 },
        evaluacion: { evaluados: 3, no_evaluados: 1, porcentaje_evaluados: 75.0 },
        criticos: { sin_evaluar: 1 }
      };
    }
  },
  async getTendenciasSeguridad(): Promise<any> {
    try {
      const res = await apiRequest<any>('/dashboard/tendencias-seguridad');
      if (!res || !res.estadisticas || res.estadisticas.total_riesgos === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida, usando Mock Data para Tendencias Seguridad');
      return {
        estadisticas: {
          total_riesgos: 3,
          con_controles: 2,
          sin_controles: 1,
          mejora_riesgo: 2,
          por_categoria: {
            "Infraestructura": { total: 1, con_controles: 1 },
            "Seguridad": { total: 1, con_controles: 1 },
            "Ciberseguridad": { total: 1, con_controles: 0 }
          }
        },
        riesgos: [
          {
            id_riesgo: 101, nombre_riesgo: "Caída de Servidor Core", categoria: "Infraestructura",
            activo: { nombre: "Servidor Producción Core" },
            evaluacion_inherente: { nivel: "Alto" },
            evaluacion_residual: { nivel: "Medio" },
            controles: { aplicados: 2, nombres: ["Patching", "Redundancia"] }
          },
          {
            id_riesgo: 102, nombre_riesgo: "Fuga de Datos Confidenciales", categoria: "Seguridad",
            activo: { nombre: "Base de Datos Usuarios" },
            evaluacion_inherente: { nivel: "Alto" },
            evaluacion_residual: { nivel: "Bajo" },
            controles: { aplicados: 3, nombres: ["TLS", "DLP", "Auditoría BD"] }
          },
          {
            id_riesgo: 103, nombre_riesgo: "Ransomware en Equipos", categoria: "Ciberseguridad",
            activo: { nombre: "Laptop Auditoría 01" },
            evaluacion_inherente: { nivel: "Medio" },
            evaluacion_residual: null,
            controles: { aplicados: 0, nombres: [] }
          }
        ]
      };
    }
  },
  async getReporteUsuariosEvidencias(): Promise<any> {
    try {
      const res = await apiRequest<any>('/dashboard/reporte-usuarios-evidencias');
      if (!res || !res.estadisticas || res.estadisticas.total_usuarios_con_evidencias === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida, usando Mock Data para Reporte Usuarios');
      return {
        estadisticas: {
          total_usuarios_con_evidencias: 3,
          total_documentos: 5,
          promedio_documentos_por_usuario: 1.6,
          por_categoria: {
            "Mitigacion": 2,
            "Politica": 2,
            "Gestion de Riesgo": 1
          }
        },
        usuarios: [
          {
            id_usuario: 1,
            nombre: "Admin TI",
            email: "admin@univalle.edu.co",
            puesto: "Administrador",
            documentos: [
              { id: 101, nombre: "Plan_Recuperacion.pdf", categoria: "Mitigacion", tamano: 153600, fecha_subida: "2026-04-20" },
              { id: 102, nombre: "Politica_Acceso.docx", categoria: "Politica", tamano: 204800, fecha_subida: "2026-04-21" }
            ],
            por_categoria: { "Mitigacion": 1, "Politica": 1 }
          },
          {
            id_usuario: 2,
            nombre: "Auditor ISO",
            email: "auditor@univalle.edu.co",
            puesto: "Auditor",
            documentos: [
              { id: 103, nombre: "Matriz_Riesgos_Core.xlsx", categoria: "Gestion de Riesgo", tamano: 512000, fecha_subida: "2026-04-22" },
              { id: 104, nombre: "Norma_ISO_27001.pdf", categoria: "Politica", tamano: 1024000, fecha_subida: "2026-04-23" }
            ],
            por_categoria: { "Gestion de Riesgo": 1, "Politica": 1 }
          },
          {
            id_usuario: 3,
            nombre: "Operador SOC",
            email: "soc@univalle.edu.co",
            puesto: "Operador",
            documentos: [
              { id: 105, nombre: "Log_Firewall_Abril.csv", categoria: "Mitigacion", tamano: 2048000, fecha_subida: "2026-04-24" }
            ],
            por_categoria: { "Mitigacion": 1 }
          }
        ]
      };
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
      const res = await apiRequest<any>('/dashboard/salud-institucional');
      if (!res || !res.total_activos) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('Usando Mock Data para Salud Institucional en backend.ts');
      return { 
        porcentaje: 65, 
        estado: 'REGULAR', 
        porcentaje_evaluacion: 75,
        activos_evaluados: 3,
        total_activos: 4,
        distribucion: { altos: 2, medios: 5, bajos: 8, total: 15 } 
      };
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
      const res = await apiRequest<any>('/dashboard/top-riesgos-criticos');
      if (!res || !res.riesgos || res.riesgos.length === 0) throw new Error('Forzando mock');
      return res;
    } catch (error) {
      console.warn('API fallida o vacía, usando Mock Data para Top Riesgos Criticos en backend.ts');
      return { 
        riesgos: [
          { nombre: "Fuga de Datos Confidenciales", severidad: "HIGH", nivel: "ALTO", categoria: "Seguridad", activo: "Base de Datos Usuarios" },
          { nombre: "Caída de Servidor Core", severidad: "HIGH", nivel: "ALTO", categoria: "Infraestructura", activo: "Servidor Producción Core" },
          { nombre: "Ransomware en Equipos", severidad: "HIGH", nivel: "ALTO", categoria: "Ciberseguridad", activo: "Laptop Auditoría 01" }
        ] 
      };
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
