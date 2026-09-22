import api from './api';

export interface FilaMapaRiesgoDAFP {
  id: number;
  macroproceso: string;
  proceso: string;
  codigo_riesgo: string;
  activo_nombre: string;
  activo_trd: string;
  activo_criticidad: string;
  activo_clasificacion_ley1712: string;
  es_iccn: string;
  evento_riesgo: string;
  factor_riesgo: string;
  consecuencias: string;
  tipo_riesgo: string;
  probabilidad_inherente_nombre: string;
  impacto_inherente_nombre: string;
  zona_inherente: string;
  justificacion_inherente: string;
  controles_aplicados_texto: string;
  cantidad_controles: number;
  probabilidad_residual_nombre: string;
  impacto_residual_nombre: string;
  zona_residual: string;
  justificacion_residual: string;
  opcion_tratamiento: string;
  acciones_mitigacion: string;
  responsable: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface KPIsMapaRiesgos {
  total_riesgos: number;
  total_activos_unicos: number;
  distribucion_inherente: {
    Extremo: number;
    Alto: number;
    Moderado: number;
    Bajo: number;
  };
  distribucion_residual: {
    Extremo: number;
    Alto: number;
    Moderado: number;
    Bajo: number;
  };
  riesgos_criticos_inherentes: number;
  riesgos_criticos_residuales: number;
  reduccion_riesgos_criticos_pct: number;
  tratamientos: {
    Mitigar: number;
    Transferir: number;
    Evitar: number;
    Aceptar: number;
  };
}

export interface ResumenMapaDAFPResponse {
  norma_referencia: string;
  fecha_generacion: string;
  kpis: KPIsMapaRiesgos;
  total_filas: number;
  filas: FilaMapaRiesgoDAFP[];
}

export interface CopilotMapaAnalysisResponse {
  dictamen_ejecutivo: string;
  alertas_criticas: string[];
  action_chips: Array<{ label: string; action: string }>;
  kpis: KPIsMapaRiesgos;
  fecha_analisis: string;
}

export const reportesService = {
  /**
   * Obtiene la matriz completa del Mapa de Riesgos Institucional DAFP V7
   */
  async getMapaRiesgosDAFP(filtros?: Record<string, any>): Promise<ResumenMapaDAFPResponse> {
    const response = await api.get<ResumenMapaDAFPResponse>('/reportes/mapa-riesgos-dafp', {
      params: filtros
    });
    return response.data;
  },

  /**
   * Descarga la matriz oficial DAFP V7 formateada en Excel (.xlsx)
   */
  async downloadMapaRiesgosExcel(filtros?: Record<string, any>): Promise<void> {
    const response = await api.get('/reportes/mapa-riesgos-dafp/export/excel', {
      params: filtros,
      responseType: 'blob'
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mapa_Riesgos_DAFP_V7_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Genera el dictamen y alertas ejecutivas de Copilot IA sobre el Mapa de Riesgos
   */
  async getCopilotAnalysis(filtros?: Record<string, any>): Promise<CopilotMapaAnalysisResponse> {
    const response = await api.post<CopilotMapaAnalysisResponse>('/reportes/mapa-riesgos-dafp/copilot-analysis', filtros || {});
    return response.data;
  }
};
