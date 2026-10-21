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
    rol?: string;
  }): Promise<Usuario[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.puesto) params.append('puesto', filters.puesto);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.rol) params.append('rol', filters.rol);

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

  // Obtener roles disponibles del sistema (RBAC)
  async getRoles(): Promise<any[]> {
    try {
      const response = await api.get('/usuarios/roles');
      return response.data;
    } catch (error) {
      return [
        { id_rol: 1, nombre_rol: 'ADMIN', descripcion: 'Administrador total' },
        { id_rol: 2, nombre_rol: 'OPERADOR', descripcion: 'Operador SGSI' },
        { id_rol: 3, nombre_rol: 'AUXILIAR', descripcion: 'Auxiliar de Auditoría' },
        { id_rol: 4, nombre_rol: 'CONSULTOR', descripcion: 'Consultor solo lectura' }
      ];
    }
  },

  // Crear un nuevo usuario
  async createUsuario(data: any): Promise<Usuario> {
    const response = await api.post('/usuarios/', data);
    return response.data;
  },

  // Actualizar un usuario
  async updateUsuario(id: number, data: any): Promise<Usuario> {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  // Restablecer contraseña por Admin
  async adminResetPassword(id: number, newPassword?: string): Promise<any> {
    const response = await api.post(`/usuarios/${id}/reset-password`, { new_password: newPassword });
    return response.data;
  },

  // Alternar estado activo / inactivo / desbloquear
  async toggleStatus(id: number): Promise<any> {
    const response = await api.post(`/usuarios/${id}/toggle-status`);
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
  },

  // Solicitar recuperación de contraseña (Forgot Password)
  async forgotPassword(identifier: string): Promise<any> {
    const response = await api.post('/auth/forgot-password', { identifier });
    return response.data;
  },

  // Restablecer contraseña con token (Reset Password)
  async resetPasswordWithToken(token: string, newPassword: string): Promise<any> {
    const response = await api.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  }
};
