import { $api } from '@/shared/api/base';

export interface SuggestionParams {
  activo_nombre: string;
  activo_tipo: string;
  tipo: 'threats' | 'vulnerabilities' | 'controls';
  amenaza_id?: string;
  vulnerabilidad_id?: string;
  criticidad?: string;
  industria?: string;
}

export interface EvaluateRiskInput {
  id_riesgo: number;
  id_activo: number;
  activo_nombre: string;
  activo_tipo: string;
  probabilidad_inherente: number;
  impacto_inherente: number;
  justificacion_inherente?: string;
  probabilidad_residual?: number;
  impacto_residual?: number;
  controles_seleccionados?: string[];
  amenaza_id?: string;
  amenaza_nombre?: string;
  industria?: string;
  generar_justificacion_ia?: boolean;
}

/**
 * Service para interactuar con el Motor IA a traves del bridge del backend.
 */
export const evaluacionApi = {
  /**
   * Obtiene sugerencias (amenazas, vulnerabilidades o controles) del Motor RAG.
   */
  getSuggestions: async (params: SuggestionParams) => {
    const response = await $api.post('/ia/suggestions', params);
    return response.data;
  },

  /**
   * Evalua un riesgo y guarda los resultados (con justificacion IA opcional).
   */
  evaluateRisk: async (data: EvaluateRiskInput) => {
    const response = await $api.post('/ia/evaluate', data);
    return response.data;
  },
};
