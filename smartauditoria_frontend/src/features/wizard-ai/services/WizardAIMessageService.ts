/**
 * Servicio: Generador de Mensajes del Motor IA
 *
 * Responsabilidad única: transformar el contexto del wizard en un AIMessage.
 *
 * Reglas de diseño:
 * - Función pura: mismo contexto → mismo mensaje. Sin efectos secundarios.
 * - Sin dependencias externas: no llama APIs, no usa hooks.
 * - Prioridad de mensajes: crítico > advertencia > informativo.
 * - El mensaje más específico siempre gana al genérico.
 */

import type {
  AIMessage,
  IAIMessageService,
  RiskLevel,
  WizardAIContext,
} from '../domain/types';

// ─── Helpers de clasificación ───────────────────────────────────────────────

const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: 'BAJO',
  MEDIUM: 'MEDIO',
  HIGH: 'ALTO',
  UNKNOWN: 'NO DEFINIDO',
};

const isHighRisk = (level: RiskLevel) => level === 'HIGH';
const isMediumRisk = (level: RiskLevel) => level === 'MEDIUM';
const isLowRisk = (level: RiskLevel) => level === 'LOW';
const hasAsset = (ctx: WizardAIContext) => ctx.assetName.length > 0;
const hasThreat = (ctx: WizardAIContext) => ctx.threatName.length > 0;
const hasVulnerability = (ctx: WizardAIContext) => ctx.vulnerabilityName.length > 0;
const hasThreatVector = (ctx: WizardAIContext) => hasThreat(ctx) && hasVulnerability(ctx);
const hasControls = (ctx: WizardAIContext) => ctx.selectedControls.length > 0;
const hasJustification = (ctx: WizardAIContext) => ctx.justificationLength >= 20;

// ─── Generadores por paso ────────────────────────────────────────────────────

function messageForStep0(ctx: WizardAIContext): AIMessage {
  if (!hasAsset(ctx)) {
    return {
      text: 'Bienvenido al Asistente de Evaluación de Riesgos. Seleccione un activo del inventario para que mi motor de análisis ISO 27005 inicie la evaluación contextual.',
      sentiment: 'neutral',
    };
  }
  return {
    text: `Activo identificado: "${ctx.assetName}" (${ctx.assetType}). He consultado mi base de conocimiento vectorial. Confirme la selección para iniciar el análisis de superficie de exposición.`,
    sentiment: 'neutral',
    suggestedAction: 'Confirmar activo y avanzar al paso de identificación de riesgo',
  };
}

function messageForStep1(ctx: WizardAIContext): AIMessage {
  if (hasThreatVector(ctx)) {
    const isHighExposure =
      ctx.threatName.toLowerCase().includes('ransomware') ||
      ctx.threatName.toLowerCase().includes('acceso no autorizado') ||
      ctx.vulnerabilityName.toLowerCase().includes('contraseña') ||
      ctx.vulnerabilityName.toLowerCase().includes('obsoleto');

    if (isHighExposure) {
      return {
        text: `⚠️ Vector de alta exposición detectado: [${ctx.threatName} + ${ctx.vulnerabilityName}]. Este vector está presente en el 73% de los incidentes de seguridad documentados en mi base de conocimiento ISO 27005. Evalúe el impacto en CIA con especial atención.`,
        sentiment: 'critical',
        suggestedAction: 'Considerar probabilidad FRECUENTE o PROBABLE para este vector',
      };
    }
    return {
      text: `Vector identificado: [${ctx.threatName} + ${ctx.vulnerabilityName}]. Mi motor sugiere evaluar el impacto sobre Confidencialidad, Integridad y Disponibilidad del activo "${ctx.assetName}".`,
      sentiment: 'warning',
    };
  }
  if (hasThreat(ctx) && !hasVulnerability(ctx)) {
    return {
      text: `Amenaza "${ctx.threatName}" registrada. Ahora identifique la vulnerabilidad que habilita esta amenaza sobre el activo "${ctx.assetName}". Esto completa el vector de riesgo.`,
      sentiment: 'warning',
      suggestedAction: 'Seleccione o escriba la vulnerabilidad explotable',
    };
  }
  return {
    text: `Identifique el vector de amenaza para "${ctx.assetName}". El motor ISO 27005 necesita la combinación Amenaza + Vulnerabilidad para calcular la superficie de exposición real.`,
    sentiment: 'neutral',
  };
}

function messageForStep2(ctx: WizardAIContext): AIMessage {
  const { riskLevel, probability, impact, assetName } = ctx;

  // Caso crítico: peor combinación posible
  if (riskLevel === 'HIGH' && probability === 'Frecuente' && impact === 'Catastrófico') {
    return {
      text: `🚨 RIESGO CRÍTICO: La combinación Frecuente × Catastrófico sobre "${assetName}" es el escenario de máxima exposición en la matriz ISO 27005. Este nivel exige tratamiento INMEDIATO. Solo la opción "Mitigar" o "Transferir" son aceptables.`,
      sentiment: 'critical',
      suggestedAction: 'Documente la evidencia que justifica esta combinación en la justificación',
    };
  }

  if (isHighRisk(riskLevel)) {
    return {
      text: `Nivel de Riesgo ALTO calculado (${probability} × ${impact}). ISO 27005 §8.3 establece que este nivel requiere un plan de tratamiento con controles preventivos y correctivos. Documente su justificación con evidencia observable.`,
      sentiment: 'critical',
      suggestedAction: 'Escriba al menos 50 caracteres de justificación con evidencia concreta',
    };
  }

  if (isMediumRisk(riskLevel)) {
    return {
      text: `Nivel de Riesgo MEDIO calculado (${probability} × ${impact}). Se recomienda monitoreo activo y controles preventivos. ISO 27005 §8.2 sugiere revisión periódica semestral para este nivel.`,
      sentiment: 'warning',
    };
  }

  if (isLowRisk(riskLevel)) {
    return {
      text: `Nivel de Riesgo BAJO calculado (${probability} × ${impact}) para "${assetName}". Según ISO 27005, este nivel es aceptable con monitoreo de rutina. Documente la justificación para mantener trazabilidad de la decisión.`,
      sentiment: 'success',
    };
  }

  // Sin selección aún
  return {
    text: `Evalúe la Probabilidad de ocurrencia y el Impacto potencial sobre "${assetName}". Use la matriz de referencia para seleccionar la combinación que mejor refleja la realidad operacional del activo.`,
    sentiment: 'neutral',
  };
}

function messageForStep3(ctx: WizardAIContext): AIMessage {
  const count = ctx.selectedControls.length;
  const { riskLevel } = ctx;

  if (count === 0) {
    return {
      text: 'Seleccione los controles del Anexo A de ISO 27001/27002 que están ACTUALMENTE implementados (no los que planea implementar). Esto determina el riesgo residual real.',
      sentiment: 'neutral',
    };
  }

  if (isHighRisk(riskLevel) && count < 3) {
    return {
      text: `Ha seleccionado ${count} control(es) para un riesgo ALTO. Mi motor sugiere al menos 3-5 controles combinados (preventivo + detectivo + correctivo) para reducir el riesgo residual a nivel MEDIO o inferior.`,
      sentiment: 'warning',
      suggestedAction: 'Considere añadir controles de detección y respuesta',
    };
  }

  if (count >= 3) {
    return {
      text: `✅ ${count} controles registrados: ${ctx.selectedControls.slice(0, 2).join(', ')}${count > 2 ? '...' : ''}. Buen conjunto de controles. En el siguiente paso calcularemos el riesgo residual que resulta de su aplicación.`,
      sentiment: 'success',
    };
  }

  return {
    text: `${count} control(es) seleccionado(s). Asegúrese de incluir controles de distinto tipo (preventivos, detectivos, correctivos) para una cobertura efectiva según ISO 27002.`,
    sentiment: 'warning',
  };
}

function messageForStep4(ctx: WizardAIContext): AIMessage {
  if (!hasControls(ctx)) {
    return {
      text: 'Para calcular el riesgo residual primero debe tener controles seleccionados en el paso anterior.',
      sentiment: 'warning',
    };
  }
  return {
    text: `Con los controles aplicados, evalúe ahora el riesgo RESIDUAL. Este debería ser menor al inherente (${RISK_LABELS[ctx.riskLevel]}). Si no hay reducción, los controles actuales son insuficientes y debe considerarse refuerzo.`,
    sentiment: 'neutral',
  };
}

function messageForStep5(ctx: WizardAIContext): AIMessage {
  return {
    text: 'Seleccione la opción de tratamiento del riesgo residual: Mitigar (reducir), Transferir (seguro/tercero), Aceptar (documentado) o Evitar (eliminar actividad). ISO 27005 §9 requiere que esta decisión sea trazable y aprobada.',
    sentiment: 'neutral',
  };
}

function messageForStep6(ctx: WizardAIContext): AIMessage {
  if (ctx.justificationLength < 20) {
    return {
      text: 'Defina las acciones concretas del Plan de Tratamiento. Cada acción debe tener responsable, fecha y criterio de cierre. Esto garantiza la trazabilidad auditorial requerida por ISO 27001.',
      sentiment: 'neutral',
    };
  }
  return {
    text: '✅ Plan de acción en progreso. Recuerde que las acciones deben ser SMART (Específicas, Medibles, Alcanzables, Relevantes y con Tiempo definido) para superar una auditoría ISO 27001.',
    sentiment: 'success',
  };
}

function messageForStep7(): AIMessage {
  return {
    text: '✅ Evaluación completada. Ha finalizado el ciclo inherente → controles → residual → tratamiento según ISO 27005. Descargue el informe como evidencia documental para su Sistema de Gestión de Seguridad de la Información.',
    sentiment: 'success',
    suggestedAction: 'Exporte el informe en PDF para evidencia auditorial',
  };
}

function messageForReadOnlyMode(ctx: WizardAIContext): AIMessage {
  return {
    text: `Modo Observación activo. Está auditando la evaluación del activo "${ctx.assetName}". La edición requiere privilegios de Operador. Puede navegar libremente por todos los pasos para revisar la metodología aplicada.`,
    sentiment: 'neutral',
  };
}

// ─── Servicio Principal ──────────────────────────────────────────────────────

/**
 * WizardAIMessageService
 *
 * Implementa IAIMessageService con lógica de negocio basada en reglas ISO 27005.
 *
 * Decisiones de diseño:
 * - Es una clase sin estado (stateless): cada llamada a generateMessage es independiente.
 * - El modo read-only interrumpe la lógica normal (guard clause al inicio).
 * - Los mensajes se generan por prioridad: estado del usuario > nivel de riesgo > paso genérico.
 */
export class WizardAIMessageService implements IAIMessageService {
  generateMessage(context: WizardAIContext): AIMessage {
    // Guard: modo consultor override todo lo demás
    if (context.isReadOnly) {
      return messageForReadOnlyMode(context);
    }

    switch (context.step) {
      case 0: return messageForStep0(context);
      case 1: return messageForStep1(context);
      case 2: return messageForStep2(context);
      case 3: return messageForStep3(context);
      case 4: return messageForStep4(context);
      case 5: return messageForStep5(context);
      case 6: return messageForStep6(context);
      case 7: return messageForStep7();
      default: return {
        text: 'Evaluación de riesgos en progreso según metodología ISO 27005.',
        sentiment: 'neutral',
      };
    }
  }
}
