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
  Nivel_Clasificacion_Confidencialidad?: string;
  ID_Custodio?: number | null;
  ID_Propietario?: number | null;
}

export type UserRole = "ADMIN" | "OPERADOR" | "CONSULTOR";

// Importar tipos de documentos desde services
export type { DocumentoAdjunto, AccionPlan } from '../services/documentos';

// Tipos para evaluacion de riesgos
export interface EvaluacionRiesgo {
  selectedActivo: Activo | null;
  newRiesgo: {
    amenaza: string;
    vulnerabilidad: string;
    descripcion: string;
  };
  evaluacionInherente: {
    probabilidad: string;
    impacto: string;
    nivelRiesgo: string;
    justificacion: string;
  };
  controles: {
    seleccionados: string[];
    eficacia: string;
    justificacion: string;
  };
  evaluacionResidual: {
    probabilidad: string;
    impacto: string;
    nivelRiesgo: string;
    justificacion: string;
  };
  tratamiento: {
    opcion: string;
    responsable: string;
    fechaInicio: string;
    fechaFin: string;
    presupuesto: string;
  };
  planAccion: {
    acciones: any[];
  };
}
