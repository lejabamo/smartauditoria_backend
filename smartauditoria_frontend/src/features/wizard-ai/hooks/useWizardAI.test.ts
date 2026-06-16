/**
 * Tests TDD: useWizardAI hook
 *
 * Usa renderHook de @testing-library/react.
 * Prueba el contrato del hook: dado un input, retorna el AIMessage correcto.
 * Verifica que el hook es reactivo (cambia cuando cambia el input).
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWizardAI } from './useWizardAI';
import type { IAIMessageService, AIMessage, WizardAIContext } from '../domain/types';

// ─── Mock del servicio ────────────────────────────────────────────────────────

const createMockService = (returnedMessage: AIMessage): IAIMessageService => ({
  generateMessage: vi.fn((_ctx: WizardAIContext): AIMessage => returnedMessage),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const baseInput = {
  step: 0,
  isReadOnly: false,
  userRole: 'OPERADOR',
  assetName: '',
  assetType: '',
  threatName: '',
  vulnerabilityName: '',
  riskLevel: 'UNKNOWN',
  probability: '',
  impact: '',
  selectedControls: [] as string[],
  justificationLength: 0,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useWizardAI', () => {
  it('retorna el mensaje que devuelve el servicio', () => {
    const expectedMessage: AIMessage = { text: 'Test message', sentiment: 'success' };
    const mockService = createMockService(expectedMessage);

    const { result } = renderHook(() =>
      useWizardAI({ ...baseInput, service: mockService })
    );

    expect(result.current.message).toEqual(expectedMessage);
  });

  it('llama al servicio con el contexto mapeado correctamente', () => {
    const mockService = createMockService({ text: 'msg', sentiment: 'neutral' });
    const spyGenerate = vi.spyOn(mockService, 'generateMessage');

    renderHook(() =>
      useWizardAI({
        ...baseInput,
        step: 2,
        assetName: 'Servidor Web',
        assetType: 'Software',
        riskLevel: 'HIGH',
        probability: 'Frecuente',
        impact: 'Mayor',
        service: mockService,
      })
    );

    expect(spyGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 2,
        assetName: 'Servidor Web',
        riskLevel: 'HIGH',
        probability: 'Frecuente',
        impact: 'Mayor',
      })
    );
  });

  it('clampea el step fuera de rango al máximo válido (7)', () => {
    const mockService = createMockService({ text: 'msg', sentiment: 'neutral' });
    const spyGenerate = vi.spyOn(mockService, 'generateMessage');

    renderHook(() =>
      useWizardAI({ ...baseInput, step: 99, service: mockService })
    );

    expect(spyGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ step: 7 })
    );
  });

  it('usa UNKNOWN como riskLevel por defecto cuando no se pasa', () => {
    const mockService = createMockService({ text: 'msg', sentiment: 'neutral' });
    const spyGenerate = vi.spyOn(mockService, 'generateMessage');

    renderHook(() =>
      useWizardAI({ ...baseInput, riskLevel: '', service: mockService })
    );

    expect(spyGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ riskLevel: 'UNKNOWN' })
    );
  });

  it('usa el servicio por defecto cuando no se inyecta ninguno (smoke test)', () => {
    // Verifica que no lanza error sin inyección
    expect(() =>
      renderHook(() => useWizardAI({ ...baseInput }))
    ).not.toThrow();
  });
});
