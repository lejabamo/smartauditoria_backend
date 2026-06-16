/**
 * Hook: useWizardAI
 *
 * Responsabilidad: adaptar el estado React del wizard al contrato del dominio IA,
 * y exponer el AIMessage resultante de forma reactiva.
 *
 * Principios:
 * - Single Responsibility: solo mapea estado → mensaje. No renderiza nada.
 * - Dependency Inversion: recibe el servicio como parámetro (testeable con mock).
 * - Eficiencia: usa useMemo para evitar recálculos innecesarios.
 */

import { useMemo } from 'react';
import { WizardAIMessageService } from '../services/WizardAIMessageService';
import type { AIMessage, IAIMessageService, RiskLevel, UserRole, WizardStep } from '../domain/types';

// Instancia singleton del servicio (no se recrea en cada render)
const defaultService = new WizardAIMessageService();

export interface UseWizardAIInput {
  step: number;
  isReadOnly: boolean;
  userRole: string;
  assetName: string;
  assetType: string;
  threatName: string;
  vulnerabilityName: string;
  riskLevel: string;
  probability: string;
  impact: string;
  selectedControls: string[];
  justificationLength: number;
  /** Inyección de dependencia: permite usar un mock en tests */
  service?: IAIMessageService;
}

export interface UseWizardAIOutput {
  message: AIMessage;
}

export function useWizardAI(input: UseWizardAIInput): UseWizardAIOutput {
  const {
    step,
    isReadOnly,
    userRole,
    assetName,
    assetType,
    threatName,
    vulnerabilityName,
    riskLevel,
    probability,
    impact,
    selectedControls,
    justificationLength,
    service = defaultService,
  } = input;

  const message = useMemo<AIMessage>(() => {
    return service.generateMessage({
      step: (Math.min(Math.max(step, 0), 7)) as WizardStep,
      isReadOnly,
      userRole: (userRole || 'OPERADOR') as UserRole,
      assetName: assetName || '',
      assetType: assetType || '',
      threatName: threatName || '',
      vulnerabilityName: vulnerabilityName || '',
      riskLevel: (riskLevel || 'UNKNOWN') as RiskLevel,
      probability: probability || '',
      impact: impact || '',
      selectedControls: selectedControls || [],
      justificationLength: justificationLength || 0,
    });
  }, [
    step,
    isReadOnly,
    userRole,
    assetName,
    assetType,
    threatName,
    vulnerabilityName,
    riskLevel,
    probability,
    impact,
    // selectedControls como longitud evita comparación de arrays por referencia
    selectedControls.length,
    selectedControls.join(','),
    justificationLength,
    service,
  ]);

  return { message };
}
