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
    const params = new URLSearchParams();
    if (filters?.puesto) params.append('puesto', filters.puesto);
    if (filters?.estado) params.append('estado', filters.estado);

    const response = await api.get(`/usuarios/?${params.toString()}`);
    return response.data;
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
    const response = await api.get('/usuarios/estadisticas');
    return response.data;
  }
};
