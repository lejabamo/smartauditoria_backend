/**
 * Tests: ConversationalAuditor (componente presentacional)
 *
 * Prueba el comportamiento visible del componente, no la implementación.
 * Principio: test what the user sees, not how it's built.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConversationalAuditor from './ConversationalAuditor';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderAuditor = (props: Partial<React.ComponentProps<typeof ConversationalAuditor>> = {}) =>
  render(
    <ConversationalAuditor
      message="Mensaje de prueba del motor IA"
      isTyping={false}
      {...props}
    />
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConversationalAuditor', () => {
  it('muestra el mensaje cuando no está escribiendo', () => {
    renderAuditor({ message: 'Evaluación en progreso según ISO 27005' });
    expect(screen.getByText('Evaluación en progreso según ISO 27005')).toBeTruthy();
  });

  it('muestra indicador de escritura cuando isTyping=true', () => {
    renderAuditor({ isTyping: true });
    expect(screen.getByText(/Sincronizando con base vectorial/i)).toBeTruthy();
  });

  it('muestra la acción sugerida cuando se provee', () => {
    renderAuditor({ suggestedAction: 'Revisar los controles preventivos' });
    expect(screen.getByText('Revisar los controles preventivos')).toBeTruthy();
  });

  it('no muestra acción sugerida cuando isTyping=true', () => {
    renderAuditor({ isTyping: true, suggestedAction: 'Acción importante' });
    expect(screen.queryByText('Acción importante')).toBeNull();
  });

  it('tiene role=status para accesibilidad', () => {
    renderAuditor();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('muestra label ALERTA CRÍTICA para sentiment critical', () => {
    renderAuditor({ sentiment: 'critical' });
    expect(screen.getByText(/ALERTA CRÍTICA/i)).toBeTruthy();
  });

  it('muestra label VALIDADO para sentiment success', () => {
    renderAuditor({ sentiment: 'success' });
    expect(screen.getByText(/VALIDADO/i)).toBeTruthy();
  });

  it('muestra label ATENCIÓN para sentiment warning', () => {
    renderAuditor({ sentiment: 'warning' });
    expect(screen.getByText(/ATENCIÓN/i)).toBeTruthy();
  });
});
