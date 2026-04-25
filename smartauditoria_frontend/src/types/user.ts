export interface User {
  id_usuario_auth: number;
  username: string;
  id_rol: number;
  rol_nombre: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_ultimo_login: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expires_in: number;
  message: string;
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
