export interface User {
  id_usuario_auth: number;
  username: string;
  id_rol: number;
  rol_nombre: string;
  activo: boolean;
  bloqueado?: boolean;
  intentos_fallidos?: number;
  fecha_creacion: string;
  fecha_ultimo_login: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expires_in: number;
  message: string;
}

export interface RolInfo {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
  permisos: string;
  activo: boolean;
}

export interface UsuarioSistemaConAuth {
  id: number;
  id_usuario: number;
  nombre: string;
  nombre_completo: string;
  email: string;
  email_institucional: string;
  puesto: string;
  puesto_organizacion: string;
  rol: string;
  rol_nombre: string;
  id_rol?: number;
  username?: string;
  tiene_auth: boolean;
  id_usuario_auth?: number;
  activo: boolean;
  bloqueado: boolean;
  intentos_fallidos: number;
  estado: string;
  estado_usuario: string;
  fecha_creacion?: string;
  fecha_creacion_registro?: string;
  fecha_ultimo_login?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token: string;
  reset_code: string;
  username: string;
  email: string;
  expires_in: number;
  instrucciones?: string;
}

export interface Activo {
  ID_Activo?: number;
  id?: number;
  ID?: number;
  Nombre?: string;
  nombre?: string;
  nombre_Activo?: string;
  Descripcion?: string;
  descripcion?: string;
  Tipo_Activo?: string;
  tipo?: string;
  Tipo?: string;
  subtipo_activo?: string;
  Nivel_Clasificacion_Confidencialidad?: string;
  Nivel_Clasificacion_Integridad?: string;
  Nivel_Clasificacion_Disponibilidad?: string;
  nivel_criticidad_negocio?: string;
  estado_activo?: string;
  requiere_backup?: boolean;
  fecha_creacion_registro?: string;
  ID_Custodio?: number | null;
  ID_Propietario?: number | null;
}

export type UserRole = "ADMIN" | "OPERADOR" | "CONSULTOR";

