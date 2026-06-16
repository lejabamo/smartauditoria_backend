/**
 * Componente: ConversationalAuditor
 *
 * Responsabilidad ÚNICA: renderizar el mensaje del Motor IA con la identidad
 * visual del avatar holográfico. No contiene lógica de negocio.
 *
 * Principios aplicados:
 * - Pure Presentational Component: solo props → UI. Cero estado interno.
 * - Open/Closed: nuevos sentiments se añaden en SENTIMENT_CONFIG sin tocar JSX.
 * - Separación de estilos: la lógica de color está en SENTIMENT_CONFIG, no en sx inline.
 * - Accesibilidad: aria-live="polite" para lectores de pantalla.
 */

import React from 'react';
import { Box, Typography, Paper, Fade, Avatar as MuiAvatar, Chip } from '@mui/material';
import {
  SmartToy,
  Warning,
  CheckCircle,
  Security,
  AutoAwesome,
} from '@mui/icons-material';
import type { AISentiment } from '../../features/wizard-ai/domain/types';

// ─── Configuración de estilos por sentimiento ────────────────────────────────

interface SentimentConfig {
  color: string;
  bgColor: string;
  icon: React.ReactElement;
  label: string;
  borderGlow: string;
}

const SENTIMENT_CONFIG: Record<AISentiment, SentimentConfig> = {
  neutral: {
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.06)',
    icon: <SmartToy />,
    label: 'ANALIZANDO',
    borderGlow: '0 0 20px rgba(59, 130, 246, 0.35)',
  },
  warning: {
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.06)',
    icon: <Warning />,
    label: 'ATENCIÓN',
    borderGlow: '0 0 20px rgba(245, 158, 11, 0.4)',
  },
  critical: {
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.06)',
    icon: <Security />,
    label: 'ALERTA CRÍTICA',
    borderGlow: '0 0 20px rgba(239, 68, 68, 0.45)',
  },
  success: {
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.06)',
    icon: <CheckCircle />,
    label: 'VALIDADO',
    borderGlow: '0 0 20px rgba(16, 185, 129, 0.35)',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConversationalAuditorProps {
  /** Mensaje principal del motor IA */
  message: string;
  /** Mientras sea true muestra animación de escritura */
  isTyping: boolean;
  /** Determina paleta de color e ícono del avatar */
  sentiment?: AISentiment;
  /** Acción sugerida opcional — se muestra como Chip debajo del mensaje */
  suggestedAction?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ConversationalAuditor: React.FC<ConversationalAuditorProps> = ({
  message,
  isTyping,
  sentiment = 'neutral',
  suggestedAction,
}) => {
  const config = SENTIMENT_CONFIG[sentiment];

  return (
    <Box
      sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', p: 2.5, mb: 3 }}
      role="status"
      aria-live="polite"
      aria-label="Asistente IA SmartAuditor"
    >
      {/* ── Avatar holográfico ─────────────────────────────────────────── */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <MuiAvatar
          sx={{
            width: 92,
            height: 92,
            bgcolor: config.color,
            boxShadow: config.borderGlow,
            border: '3px solid white',
            transition: 'all 0.4s ease',
            animation: isTyping ? 'avatarPulse 1.4s ease-in-out infinite' : 'none',
          }}
          aria-hidden="true"
        >
          {React.cloneElement(config.icon, { sx: { fontSize: 46, color: 'white' } } as any)}
        </MuiAvatar>

        {/* Anillo orbital */}
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            borderRadius: '50%',
            border: `1.5px solid ${config.color}`,
            animation: 'orbitalSpin 10s linear infinite',
            opacity: 0.5,
          }}
          aria-hidden="true"
        />

        {/* Indicador de estado */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: isTyping ? '#94a3b8' : config.color,
            border: '2px solid white',
            transition: 'background-color 0.3s ease',
          }}
          aria-hidden="true"
        />
      </Box>

      {/* ── Burbuja de diálogo ─────────────────────────────────────────── */}
      <Fade in timeout={600} key={message}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: '4px 20px 20px 20px',
            bgcolor: config.bgColor,
            border: `1.5px solid ${config.color}30`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.07)`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -10,
              top: 18,
              borderStyle: 'solid',
              borderWidth: '8px 10px 8px 0',
              borderColor: `transparent ${config.color}30 transparent transparent`,
            },
          }}
        >
          {/* Label de estado */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome sx={{ fontSize: 12, color: config.color }} />
            <Typography
              variant="overline"
              sx={{
                color: config.color,
                fontWeight: 800,
                letterSpacing: 1.8,
                fontSize: '0.65rem',
                lineHeight: 1,
              }}
            >
              SMARTAUDITOR IA · {config.label}
            </Typography>
          </Box>

          {/* Mensaje */}
          <Typography
            variant="body2"
            sx={{
              color: '#1E293B',
              fontWeight: 450,
              fontSize: '0.92rem',
              lineHeight: 1.65,
              fontStyle: isTyping ? 'italic' : 'normal',
            }}
          >
            {isTyping ? '💭 Sincronizando con base vectorial ISO...' : message}
          </Typography>

          {/* Acción sugerida */}
          {!isTyping && suggestedAction && (
            <Box sx={{ mt: 1.5 }}>
              <Chip
                icon={<AutoAwesome sx={{ fontSize: '0.8rem !important' }} />}
                label={suggestedAction}
                size="small"
                sx={{
                  bgcolor: `${config.color}15`,
                  color: config.color,
                  border: `1px solid ${config.color}30`,
                  fontWeight: 500,
                  fontSize: '0.72rem',
                  height: 24,
                  '& .MuiChip-icon': { color: config.color },
                }}
              />
            </Box>
          )}
        </Paper>
      </Fade>

      {/* ── Keyframes de animación ─────────────────────────────────────── */}
      <style>{`
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes orbitalSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default ConversationalAuditor;
