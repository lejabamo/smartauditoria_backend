/**
 * Tests TDD: WizardAIMessageService
 *
 * Cobertura por comportamiento (BDD-style), no por implementación.
 * Cada describe bloque = un contrato de negocio.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WizardAIMessageService } from '../services/WizardAIMessageService';
import type { WizardAIContext } from '../domain/types';

// ─── Factory de contexto base ────────────────────────────────────────────────

const buildContext = (overrides: Partial<WizardAIContext> = {}): WizardAIContext => ({
  step: 0,
  userRole: 'OPERADOR',
  assetName: '',
  assetType: 'Software',
  threatName: '',
  vulnerabilityName: '',
  riskLevel: 'UNKNOWN',
  probability: '',
  impact: '',
  selectedControls: [],
  justificationLength: 0,
  isReadOnly: false,
  ...overrides,
});

// ─── Suite principal ─────────────────────────────────────────────────────────

describe('WizardAIMessageService', () => {
  let service: WizardAIMessageService;

  beforeEach(() => {
    service = new WizardAIMessageService();
  });

  // ── Contrato 1: Modo Read-Only tiene prioridad absoluta ──────────────────

  describe('cuando el usuario está en modo lectura (CONSULTOR)', () => {
    it('siempre retorna mensaje de observación independiente del paso', () => {
      const steps: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
      steps.forEach((step) => {
        const ctx = buildContext({ step: step as any, isReadOnly: true, assetName: 'Servidor DB' });
        const msg = service.generateMessage(ctx);
        expect(msg.sentiment).toBe('neutral');
        expect(msg.text).toContain('Modo Observación');
        expect(msg.text).toContain('Servidor DB');
      });
    });
  });

  // ── Contrato 2: Paso 0 — Selección de Activo ─────────────────────────────

  describe('paso 0 — selección de activo', () => {
    it('pide seleccionar activo cuando no hay ninguno', () => {
      const ctx = buildContext({ step: 0 });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('neutral');
      expect(msg.text.toLowerCase()).toContain('seleccione un activo');
    });

    it('confirma el activo cuando ya fue seleccionado', () => {
      const ctx = buildContext({ step: 0, assetName: 'ERP Principal', assetType: 'Software' });
      const msg = service.generateMessage(ctx);
      expect(msg.text).toContain('ERP Principal');
      expect(msg.text).toContain('Software');
      expect(msg.sentiment).toBe('neutral');
    });
  });

  // ── Contrato 3: Paso 1 — Identificación del vector ───────────────────────

  describe('paso 1 — identificación del vector de riesgo', () => {
    it('pide identificar vector cuando no hay amenaza ni vulnerabilidad', () => {
      const ctx = buildContext({ step: 1, assetName: 'Firewall' });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('neutral');
      expect(msg.text.toLowerCase()).toContain('vector');
    });

    it('guía a completar vulnerabilidad cuando solo hay amenaza', () => {
      const ctx = buildContext({ step: 1, assetName: 'Firewall', threatName: 'Acceso Físico' });
      const msg = service.generateMessage(ctx);
      expect(msg.text).toContain('Acceso Físico');
      expect(msg.suggestedAction).toBeTruthy();
    });

    it('activa alarma crítica para vectores de alta exposición conocidos (ransomware)', () => {
      const ctx = buildContext({
        step: 1,
        threatName: 'Ataque de Ransomware',
        vulnerabilityName: 'Sistema Operativo Obsoleto',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('critical');
      expect(msg.text).toContain('Ransomware');
    });

    it('activa alarma crítica para vector con contraseña comprometida', () => {
      const ctx = buildContext({
        step: 1,
        threatName: 'Acceso No Autorizado',
        vulnerabilityName: 'Contraseña débil reutilizada',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('critical');
    });

    it('retorna warning normal para vector completo sin flags críticos', () => {
      const ctx = buildContext({
        step: 1,
        threatName: 'Falla de Hardware',
        vulnerabilityName: 'Sin redundancia de fuente de poder',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('warning');
      expect(msg.text).toContain('Falla de Hardware');
    });
  });

  // ── Contrato 4: Paso 2 — Evaluación inherente ────────────────────────────

  describe('paso 2 — evaluación inherente', () => {
    it('alerta máxima para combinación Frecuente × Catastrófico', () => {
      const ctx = buildContext({
        step: 2,
        assetName: 'Base de Datos Clientes',
        riskLevel: 'HIGH',
        probability: 'Frecuente',
        impact: 'Catastrófico',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('critical');
      expect(msg.text).toContain('CRÍTICO');
      expect(msg.text).toContain('INMEDIATO');
    });

    it('alerta crítica para riesgo HIGH genérico', () => {
      const ctx = buildContext({
        step: 2,
        riskLevel: 'HIGH',
        probability: 'Frecuente',
        impact: 'Mayor',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('critical');
      expect(msg.text.toUpperCase()).toContain('ALTO');
    });

    it('retorna warning para riesgo MEDIUM', () => {
      const ctx = buildContext({
        step: 2,
        riskLevel: 'MEDIUM',
        probability: 'Ocasional',
        impact: 'Moderado',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('warning');
    });

    it('retorna success para riesgo LOW', () => {
      const ctx = buildContext({
        step: 2,
        riskLevel: 'LOW',
        probability: 'Improbable',
        impact: 'Menor',
        assetName: 'Impresora Sala Reuniones',
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('success');
    });

    it('pide seleccionar valores cuando el riesgo es UNKNOWN', () => {
      const ctx = buildContext({ step: 2, riskLevel: 'UNKNOWN', assetName: 'Router' });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('neutral');
    });
  });

  // ── Contrato 5: Paso 3 — Controles ───────────────────────────────────────

  describe('paso 3 — controles existentes', () => {
    it('pide seleccionar controles cuando no hay ninguno', () => {
      const ctx = buildContext({ step: 3, selectedControls: [] });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('neutral');
      expect(msg.text.toLowerCase()).toContain('seleccione');
    });

    it('advierte que hay pocos controles para riesgo HIGH', () => {
      const ctx = buildContext({
        step: 3,
        riskLevel: 'HIGH',
        selectedControls: ['MFA'],
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('warning');
      expect(msg.text).toContain('3');
    });

    it('confirma con éxito 3 o más controles', () => {
      const ctx = buildContext({
        step: 3,
        selectedControls: ['MFA', 'Backup Inmutable', 'Firewall WAF'],
      });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('success');
      expect(msg.text).toContain('3');
    });
  });

  // ── Contrato 6: Paso 7 — Resultado final ──────────────────────────────────

  describe('paso 7 — resultado final', () => {
    it('siempre retorna mensaje de éxito con mención a ISO 27005', () => {
      const ctx = buildContext({ step: 7 });
      const msg = service.generateMessage(ctx);
      expect(msg.sentiment).toBe('success');
      expect(msg.text).toContain('ISO 27005');
      expect(msg.suggestedAction).toBeTruthy();
    });
  });

  // ── Contrato 7: Propiedad general — retorna objeto válido en todo caso ────

  describe('propiedad general', () => {
    it('nunca retorna texto vacío ni sentiment inválido', () => {
      const validSentiments = new Set(['neutral', 'warning', 'critical', 'success']);
      const steps = [0, 1, 2, 3, 4, 5, 6, 7];
      steps.forEach((step) => {
        const ctx = buildContext({ step: step as any });
        const msg = service.generateMessage(ctx);
        expect(msg.text.trim().length).toBeGreaterThan(0);
        expect(validSentiments.has(msg.sentiment)).toBe(true);
      });
    });
  });
});
