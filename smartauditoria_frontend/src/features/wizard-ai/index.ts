/**
 * Public API del módulo wizard-ai
 *
 * Solo se exporta lo que otros módulos necesitan conocer.
 * Los archivos internos (services, domain) son detalles de implementación.
 */

export { useWizardAI } from './hooks/useWizardAI';
export type { UseWizardAIInput, UseWizardAIOutput } from './hooks/useWizardAI';
export type { AIMessage, AISentiment, WizardAIContext } from './domain/types';
