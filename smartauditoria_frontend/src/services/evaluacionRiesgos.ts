import { apiRequest } from './api';

export interface NivelProbabilidad {
  id: number;
  nombre: string;
  valor: number;
  descripcion: string;
  color: string;
}

export interface NivelImpacto {
  id: number;
  nombre: string;
  valor: number;
  descripcion: string;
  color: string;
}

export interface ControlSeguridad {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  eficacia_esperada: string;
}

export interface RiesgoPendiente {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_riesgo: string;
  estado: string;
  fecha_identificacion: string;
}

export interface EvaluacionRiesgo {
  id_riesgo: number;
  id_activo: number;
  probabilidad_inherente: number;
  impacto_inherente: number;
  justificacion_inherente: string;
  probabilidad_residual?: number;
  impacto_residual?: number;
  justificacion_residual?: string;
}

export interface EstadisticasEvaluacion {
  total_riesgos: number;
  riesgos_evaluados: number;
  riesgos_pendientes: number;
  porcentaje_evaluacion: number;
  distribucion_niveles: { [key: string]: number };
}

export const evaluacionRiesgosService = {
  // Obtener niveles de probabilidad
  async getNivelesProbabilidad(): Promise<NivelProbabilidad[]> {
    try {
      return await apiRequest<NivelProbabilidad[]>('/evaluacion-riesgos/niveles-probabilidad');
    } catch (error) {
      console.error('Error fetching niveles probabilidad:', error);
      return [];
    }
  },

  // Obtener niveles de impacto
  async getNivelesImpacto(): Promise<NivelImpacto[]> {
    try {
      return await apiRequest<NivelImpacto[]>('/evaluacion-riesgos/niveles-impacto');
    } catch (error) {
      console.error('Error fetching niveles impacto:', error);
      return [];
    }
  },

  // Obtener controles de seguridad
  async getControles(): Promise<ControlSeguridad[]> {
    try {
      return await apiRequest<ControlSeguridad[]>('/evaluacion-riesgos/controles');
    } catch (error) {
      console.error('Error fetching controles:', error);
      return [];
    }
  },

  // Obtener riesgos pendientes de evaluacion
  async getRiesgosPendientes(): Promise<RiesgoPendiente[]> {
    try {
      return await apiRequest<RiesgoPendiente[]>('/evaluacion-riesgos/riesgos-pendientes');
    } catch (error) {
      console.error('Error fetching riesgos pendientes:', error);
      return [];
    }
  },

  // Crear evaluacion de riesgo
  async crearEvaluacion(evaluacion: EvaluacionRiesgo): Promise<any> {
    try {
      return await apiRequest('/evaluacion-riesgos/evaluar', {
        method: 'POST',
        body: JSON.stringify(evaluacion),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error creating evaluacion:', error);
      throw error;
    }
  },

  // Obtener matriz de riesgo
  async getMatrizRiesgo(): Promise<{ [key: string]: number }> {
    try {
      return await apiRequest<{ [key: string]: number }>('/evaluacion-riesgos/matriz-riesgo');
    } catch (error) {
      console.error('Error fetching matriz riesgo:', error);
      return {};
    }
  },

  // Obtener estadisticas de evaluacion
  async getEstadisticas(): Promise<EstadisticasEvaluacion> {
    try {
      return await apiRequest<EstadisticasEvaluacion>('/evaluacion-riesgos/estadisticas');
    } catch (error) {
      console.error('Error fetching estadisticas:', error);
      return {
        total_riesgos: 0,
        riesgos_evaluados: 0,
        riesgos_pendientes: 0,
        porcentaje_evaluacion: 0,
        distribucion_niveles: {}
      };
    }
  },

  // Obtener todas las evaluaciones
  async getEvaluaciones(): Promise<any[]> {
    try {
      return await apiRequest<any[]>('/evaluacion-riesgos/evaluaciones');
    } catch (error) {
      console.error('Error fetching evaluaciones:', error);
      return [];
    }
  },

  // Obtener evaluaciones completadas por activo
  async getEvaluacionesCompletadas(): Promise<{[key: string]: any}> {
    try {
      return await apiRequest<{[key: string]: any}>('/evaluacion-riesgos/evaluaciones-completadas');
    } catch (error) {
      console.error('Error fetching evaluaciones completadas:', error);
      return {};
    }
  },

  // Guardar evaluacion parcial
  async guardarEvaluacionParcial(activoId: number, wizardData: any, progreso: number): Promise<any> {
    try {
      return await apiRequest<any>('/evaluacion-riesgos/evaluacion-parcial', {
        method: 'POST',
        body: JSON.stringify({
          activo_id: activoId,
          wizard_data: wizardData,
          progreso: progreso
        })
      });
    } catch (error) {
      console.error('Error guardando evaluacion parcial:', error);
      throw error;
    }
  },

  // Obtener evaluacion parcial
  async obtenerEvaluacionParcial(activoId: number): Promise<any> {
    try {
      return await apiRequest<any>(`/evaluacion-riesgos/evaluacion-parcial/${activoId}`);
    } catch (error) {
      console.error('Error obteniendo evaluacion parcial:', error);
      return { existe: false, wizard_data: {}, progreso: 0 };
    }
  },

  // Prediccion de texto
  async generateRiskDescription(amenaza: string, vulnerabilidad: string): Promise<any> {
    try {
      return await apiRequest<any>('/predictive/generate-description', {
        method: 'POST',
        body: JSON.stringify({ amenaza, vulnerabilidad })
      });
    } catch (error) {
      console.error('Error generando descripcion:', error);
      throw error;
    }
  },

  async generateJustification(probabilidad: string, impacto: string): Promise<any> {
    try {
      return await apiRequest<any>('/predictive/generate-justification', {
        method: 'POST',
        body: JSON.stringify({ probabilidad, impacto })
      });
    } catch (error) {
      console.error('Error generando justificacion:', error);
      throw error;
    }
  },

  async generateControlSuggestions(amenaza: string, vulnerabilidad: string): Promise<any> {
    try {
      return await apiRequest<any>('/predictive/generate-controls', {
        method: 'POST',
        body: JSON.stringify({ amenaza, vulnerabilidad })
      });
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      throw error;
    }
  },

  async generateAllPredictions(amenaza: string, vulnerabilidad: string, probabilidad?: string, impacto?: string): Promise<any> {
    try {
      return await apiRequest<any>('/predictive/generate-all', {
        method: 'POST',
        body: JSON.stringify({ amenaza, vulnerabilidad, probabilidad, impacto })
      });
    } catch (error) {
      console.error('Error generando predicciones:', error);
      throw error;
    }
  }
};







