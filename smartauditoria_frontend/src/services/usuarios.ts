import api from './api';

export interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  email_institucional: string;
  puesto_organizacion?: string;
  estado_usuario: string;
  fecha_creacion_registro?: string;
}

export interface CreateUsuarioData {
  nombre_completo: string;
  email_institucional: string;
  puesto_organizacion?: string;
  estado_usuario?: string;
}

export interface UpdateUsuarioData extends Partial<CreateUsuarioData> {}

export const usuariosService = {
  // Obtener todos los usuarios con filtros opcionales
  async getUsuarios(filters?: {
    puesto?: string;
    estado?: string;
  }): Promise<Usuario[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.puesto) params.append('puesto', filters.puesto);
      if (filters?.estado) params.append('estado', filters.estado);

      const response = await api.get(`/usuarios/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn("API fallida, usando Mock Data para Usuarios");
      return [
        { id_usuario: 1, nombre_completo: "Lic. Auditor Senior", email_institucional: "auditor.senior@univalle.edu.co", puesto_organizacion: "Auditor Jefe", estado_usuario: "Activo" },
        { id_usuario: 2, nombre_completo: "Ing. Seguridad TI", email_institucional: "seguridad.ti@univalle.edu.co", puesto_organizacion: "CISO", estado_usuario: "Activo" },
        { id_usuario: 3, nombre_completo: "Admin Sistema", email_institucional: "admin.sgsri@univalle.edu.co", puesto_organizacion: "Administrador", estado_usuario: "Activo" },
        { id_usuario: 4, nombre_completo: "Consultor Externo", email_institucional: "consultor.iso@ext.univalle.edu.co", puesto_organizacion: "Consultor", estado_usuario: "Activo" }
      ];
    }
  },

  // Obtener un usuario especifico
  async getUsuario(id: number): Promise<Usuario> {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  // Crear un nuevo usuario
  async createUsuario(data: CreateUsuarioData): Promise<Usuario> {
    const response = await api.post('/usuarios/', data);
    return response.data;
  },

  // Actualizar un usuario
  async updateUsuario(id: number, data: UpdateUsuarioData): Promise<Usuario> {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  // Eliminar un usuario
  async deleteUsuario(id: number): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  },

  // Obtener puestos unicos
  async getPuestos(): Promise<string[]> {
    const response = await api.get('/usuarios/puestos');
    return response.data;
  },

  // Obtener estados unicos
  async getEstados(): Promise<string[]> {
    const response = await api.get('/usuarios/estados');
    return response.data;
  },

  // Obtener activos asociados a un usuario
  async getActivosUsuario(usuarioId: number): Promise<any> {
    const response = await api.get(`/usuarios/${usuarioId}/activos`);
    return response.data;
  },

  // Obtener estadisticas de usuarios
  async getEstadisticasUsuarios(): Promise<any> {
    try {
      const response = await api.get('/usuarios/estadisticas');
      return response.data;
    } catch (error) {
      console.warn("API fallida, usando Mock Data para Estadísticas de Usuarios");
      return {
        total_usuarios: 4,
        usuarios_activos: 4,
        usuarios_inactivos: 0,
        usuarios_bloqueados: 0
      };
    }
  }
};
