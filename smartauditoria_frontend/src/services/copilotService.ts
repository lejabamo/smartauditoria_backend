/**
 * copilotService.ts — Servicio cliente para SmartAuditor Copilot
 * Conexión con endpoints de Streaming SSE, Chat y Sugerencias de ISO 27002:2022
 */

import { apiRequest } from './api';
import { API_BASE_URL } from '../config/api';

export interface ActionChip {
  action: 'APPLY_CONTROL' | 'APPLY_VECTOR' | 'SET_PROBABILITY_IMPACT' | 'FILL_JUSTIFICATION' | 'ANALYZE_ASSET';
  label: string;
  control_id?: string;
  control_nombre?: string;
  threat?: string;
  vulnerability?: string;
  probabilidad?: string;
  impacto?: string;
  text?: string;
  asset_name?: string;
}

export interface SuggestedControl {
  id: string;
  codigo: string;
  tema: string;
  nombre: string;
  tipo_control: string;
  propiedades_cia: string[];
  proposito: string;
  eficacia: number;
  justificacion: string;
}

export interface CopilotChatResponse {
  reply: string;
  action_chips: ActionChip[];
  norma_referencia?: string;
}

export interface RiskEvaluationResponse {
  activo_nombre: string;
  activo_tipo: string;
  analisis_inherente: string;
  amenaza_sugerida: string;
  vulnerabilidad_sugerida: string;
  probabilidad_estimada: string;
  impacto_estimado: string;
  nivel_riesgo_sugerido: string;
  action_chips: ActionChip[];
  norma_referencia?: string;
}

export interface ControlsSuggestionResponse {
  analisis_copilot: string;
  controles_sugeridos: SuggestedControl[];
  action_chips: ActionChip[];
  confidence: number;
  is_cag_grounded: boolean;
  version_norma: string;
}

export interface AssetAssessmentResponse {
  tipo_activo_sugerido: string;
  analisis_copilot: string;
  trd_sugerida: {
    macroproceso?: string;
    proceso?: string;
    identificador_sugerido?: string;
    oficina_responsable?: string;
    serie_documental?: string;
    subserie_documental?: string;
  };
  caracteristicas_documentales: {
    soporte_registro?: string;
    formato?: string;
    medio_conservacion?: string;
    idioma?: string;
  };
  valoracion_cid: {
    confidencialidad: string;
    integridad: string;
    disponibilidad: string;
    criticidad_general: string;
    justificacion?: string;
  };
  analisis_ley_1712: {
    es_clasificada_reservada: boolean;
    objeto_legitimo?: string;
    fundamento_legal?: string;
    excepcion_alcance?: string;
  };
  controles_documentales_sugeridos: Array<{
    id: string;
    nombre: string;
    justificacion?: string;
  }>;
  action_chips: Array<{
    action: string;
    label: string;
    metadata?: any;
    confidencialidad?: string;
    integridad?: string;
    disponibilidad?: string;
    criticidad_general?: string;
    justificacion?: string;
    es_clasificada_reservada?: boolean;
    objeto_legitimo_excepcion?: string;
    fundamento_legal?: string;
    excepcion_alcance?: string;
    control_id?: string;
    control_nombre?: string;
  }>;
}

export const copilotService = {
  /** Asistente IA para levantamiento de activos bajo Guía Integral de Riesgos DAFP V7 y controles ISO 27002:2022 */
  async assessAsset(assetName: string, assetType?: string, description?: string): Promise<AssetAssessmentResponse> {
    return await apiRequest<AssetAssessmentResponse>('/copilot/assess-asset', {
      method: 'POST',
      body: JSON.stringify({
        asset_name: assetName,
        asset_type: assetType || '',
        description: description || ''
      }),
    });
  },

  /** Envía un mensaje normal y recibe respuesta estructurada */
  async sendMessage(message: string, context: Record<string, any> = {}): Promise<CopilotChatResponse> {
    return await apiRequest<CopilotChatResponse>('/copilot/message', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  },

  /** Consumo de streaming SSE palabra por palabra */
  async streamMessage(
    message: string,
    context: Record<string, any> = {},
    onChunk: (text: string) => void,
    onDone: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/copilot/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Streaming failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onDone();
              return;
            }
            onChunk(data);
          }
        }
      }
      onDone();
    } catch (error) {
      console.error('Error en streaming de Copilot:', error);
      if (onError) onError(error);
      else onDone();
    }
  },

  /** Evaluación de riesgo contextual de un activo bajo ISO 27005:2022 */
  async evaluateRisk(assetName: string, assetType: string, ciaLevels?: Record<string, string>): Promise<RiskEvaluationResponse> {
    return await apiRequest<RiskEvaluationResponse>('/copilot/evaluate-risk', {
      method: 'POST',
      body: JSON.stringify({ asset_name: assetName, asset_type: assetType, cia_levels: ciaLevels }),
    });
  },

  /** Sugerencia de controles ISO 27002:2022 con Action Chips */
  async suggestControls(
    assetName: string,
    assetType: string,
    threat: string = '',
    vulnerability: string = '',
    riskLevel: string = 'HIGH'
  ): Promise<ControlsSuggestionResponse> {
    return await apiRequest<ControlsSuggestionResponse>('/copilot/suggest-controls', {
      method: 'POST',
      body: JSON.stringify({
        asset_name: assetName,
        asset_type: assetType,
        threat,
        vulnerability,
        risk_level: riskLevel,
      }),
    });
  },

  /** Catálogo completo de los 93 controles de ISO 27002:2022 */
  async getCatalog(): Promise<any> {
    return await apiRequest('/copilot/catalog');
  }
};

export default copilotService;
