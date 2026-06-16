/**
 * Dominio: Motor IA del Wizard de Evaluación de Riesgos
 *
 * Tipos de dominio puros, sin dependencias de UI ni infraestructura.
 * Principio: cada tipo describe un concepto del negocio, no un artefacto técnico.
 */

/** Niveles de riesgo calculados por la matriz 5x5 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

/** Estados emocionales del avatar para señalización visual */
export type AISentiment = 'neutral' | 'warning' | 'critical' | 'success';

/** Rol del usuario que afecta el tipo de asistencia */
export type UserRole = 'ADMIN' | 'OPERADOR' | 'CONSULTOR';

/** Pasos numerados del wizard (0-indexado, consistente con el componente) */
export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Snapshot del estado relevante del wizard para el motor IA.
 * El motor NO conoce el estado completo del wizard, solo lo que necesita.
 * Principio: mínimo acoplamiento (Interface Segregation).
 */
export interface WizardAIContext {
  step: WizardStep;
  userRole: UserRole;
  assetName: string;
  assetType: string;
  threatName: string;
  vulnerabilityName: string;
  riskLevel: RiskLevel;
  probability: string;
  impact: string;
  selectedControls: string[];
  justificationLength: number; // caracteres escritos
  isReadOnly: boolean;
}

/**
 * Respuesta del motor IA: lo que el avatar debe comunicar al usuario.
 * Es una Value Object: inmutable, sin identidad propia.
 */
export interface AIMessage {
  readonly text: string;
  readonly sentiment: AISentiment;
  /**
   * Acción sugerida al usuario (opcional).
   * Permite al avatar ser proactivo, no solo reactivo.
   */
  readonly suggestedAction?: string;
}

/**
 * Contrato del servicio generador de mensajes.
 * Permite sustituir implementaciones (mock en tests, real en producción).
 * Principio: Dependency Inversion.
 */
export interface IAIMessageService {
  generateMessage(context: WizardAIContext): AIMessage;
}

// ── Contextual Intelligence (Fase 2) ──────────────────────────────────────────

/** Datos de un activo similar con su evaluación histórica */
export interface EvaluacionPrevia {
  amenaza: string;
  vulnerabilidad: string;
  controles: string[];
  justificacion: string;
  probabilidad: string;
  impacto: string;
  nivelRiesgo: string;
}

/** Representación de un "Twin Asset" para comparativa contextual */
export interface SimilarAsset {
  id: string;
  nombre: string;
  tipo: string;
  criticidad: string;
  similitud: number;
  ultimaEvaluacion: string;
  evaluacionExistente: EvaluacionPrevia;
}

/** Estado de los datos de inteligencia contextual */
export interface ContextualIntelligenceData {
  twinAssets: SimilarAsset[];
  loading: boolean;
  error: string | null;
}
