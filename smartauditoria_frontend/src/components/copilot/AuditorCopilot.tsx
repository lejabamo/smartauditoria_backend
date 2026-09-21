/**
 * AuditorCopilot.tsx — Asistente de IA Interactivo de Próxima Generación
 * Arquitectura: CAG (Cache-Augmented Generation) + Streaming SSE + Action Chips de 1-Clic
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  Stack,
  Avatar,
  Paper,
  CircularProgress,
  Tooltip,
  Collapse,
  Badge,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as SparklesIcon,
  CheckCircleOutline as CheckIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  HelpOutline as HelpIcon,
  PlayArrow as ActionIcon,
} from '@mui/icons-material';
import copilotService from '../../services/copilotService';
import type { ActionChip } from '../../services/copilotService';

export interface ChatMessage {
  id: string;
  sender: 'copilot' | 'user';
  text: string;
  actionChips?: ActionChip[];
  normaRef?: string;
  timestamp: string;
}

export interface AuditorCopilotProps {
  /** Contexto actual del flujo de auditoría o wizard */
  context?: {
    assetName?: string;
    assetType?: string;
    threatName?: string;
    vulnerabilityName?: string;
    riskLevel?: string;
    step?: number;
    stepTitle?: string;
    activeAuditTitle?: string;
  };
  /** Callback cuando el auditor hace clic en un botón de acción rápida (1-Clic) */
  onActionChipClick?: (chip: ActionChip) => void;
  /** Mensaje inicial sugerido o disparador */
  initialMessage?: string;
  /** Permite iniciar contraído o expandido */
  defaultExpanded?: boolean;
}

export const AuditorCopilot: React.FC<AuditorCopilotProps> = ({
  context = {},
  onActionChipClick,
  initialMessage,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Inicializar mensaje de bienvenida según el contexto
  useEffect(() => {
    const defaultMsg = initialMessage || (context.assetName
      ? `He analizado el activo "${context.assetName}" (${context.assetType || 'TI'}). Estoy listo para asistirte en la evaluación de riesgos y sugerir controles del Anexo A de ISO/IEC 27002:2022.`
      : 'Bienvenido a SmartAuditor Copilot. Estoy enlazado al marco canónico ISO/IEC 27001:2022 e ISO 27005 para asistirte en tiempo real.');

    setMessages([
      {
        id: 'welcome',
        sender: 'copilot',
        text: defaultMsg,
        normaRef: 'ISO/IEC 27002:2022',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionChips: context.assetName ? [
          {
            action: 'ANALYZE_ASSET',
            label: `Sugerir Controles para ${context.assetName.slice(0, 20)}...`,
            asset_name: context.assetName,
          }
        ] : undefined,
      }
    ]);
  }, [context.assetName, context.step, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || isStreaming) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputQuery('');
    setIsStreaming(true);

    const copilotMsgId = (Date.now() + 1).toString();
    let accumulatedReply = '';

    // Agregar mensaje vacío para streaming progresivo
    setMessages(prev => [
      ...prev,
      {
        id: copilotMsgId,
        sender: 'copilot',
        text: '',
        normaRef: 'ISO/IEC 27002:2022',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);

    await copilotService.streamMessage(
      textToSend,
      context,
      (chunk: string) => {
        accumulatedReply += chunk;
        setMessages(prev =>
          prev.map(m => (m.id === copilotMsgId ? { ...m, text: accumulatedReply } : m))
        );
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        console.warn('Fallback a llamada normal por error en stream:', err);
        setIsStreaming(false);
        copilotService.sendMessage(textToSend, context).then(res => {
          setMessages(prev =>
            prev.map(m => (m.id === copilotMsgId ? { ...m, text: res.reply, actionChips: res.action_chips } : m))
          );
        });
      }
    );
  };

  const handleChipClick = (chip: ActionChip) => {
    if (chip.action === 'ANALYZE_ASSET' && context.assetName) {
      handleSendMessage(`Sugiere los controles óptimos de ISO 27002:2022 para el activo "${context.assetName}".`);
    }
    if (onActionChipClick) {
      onActionChipClick(chip);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        mb: 3,
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.4), 0 0 15px rgba(99, 102, 241, 0.15)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* ── Header del Copiloto ────────────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: '#6366f1',
              width: 42,
              height: 42,
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <SparklesIcon sx={{ fontSize: 24, color: '#ffffff' }} />
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '0.3px', color: '#ffffff' }}>
                SmartAuditor Copilot
              </Typography>
              <Chip
                label="CAG • ISO 27001:2022"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {context.assetName ? `Contexto: ${context.assetName}` : 'Asistente de Auditoría y Gestión de Riesgos'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" sx={{ color: '#94a3b8' }}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* ── Cuerpo Plegable ────────────────────────────────────────────── */}
      <Collapse in={isExpanded} timeout="auto">
        {/* Historial de Mensajes */}
        <Box
          sx={{
            p: 2.5,
            maxHeight: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '3px' },
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '85%',
                  p: 2,
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.sender === 'user' ? '#3b82f6' : 'rgba(30, 41, 59, 0.85)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                  {msg.text || (isStreaming && msg.sender === 'copilot' ? 'Razonando...' : '')}
                </Typography>

                {/* Badges normativos y hora */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, opacity: 0.7 }}>
                  {msg.normaRef && (
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600 }}>
                      📋 {msg.normaRef}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', ml: 'auto' }}>
                    {msg.timestamp}
                  </Typography>
                </Stack>

                {/* Action Chips de 1-Clic */}
                {msg.actionChips && msg.actionChips.length > 0 && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Typography variant="caption" sx={{ color: '#a5b4fc', fontWeight: 600, display: 'block', mb: 1 }}>
                      Acciones recomendadas (1-Clic):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {msg.actionChips.map((chip, idx) => (
                        <Button
                          key={idx}
                          size="small"
                          variant="contained"
                          startIcon={<ActionIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleChipClick(chip)}
                          sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            py: 0.5,
                            px: 1.5,
                            backgroundColor: '#4f46e5',
                            '&:hover': { backgroundColor: '#4338ca' },
                          }}
                        >
                          {chip.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Atajos Rápidos */}
        <Box sx={{ px: 2, pt: 1, pb: 0.5, display: 'flex', gap: 1, overflowX: 'auto' }}>
          <Chip
            label="💡 ¿Por qué este riesgo es crítico?"
            size="small"
            clickable
            disabled={isStreaming}
            onClick={() => handleSendMessage('¿Cuáles son los factores que hacen crítico este riesgo según ISO 27005?')}
            sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#cbd5e1', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
          />
          <Chip
            label="🛡️ Recomendar controles compensatorios"
            size="small"
            clickable
            disabled={isStreaming}
            onClick={() => handleSendMessage('Recomienda controles tecnológicos y organizacionales compensatorios.')}
            sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#cbd5e1', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
          />
        </Box>

        {/* Input de Chat */}
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: '#0f172a' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Haz una pregunta al copiloto o pide una recomendación normativa..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isStreaming}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                '&:hover fieldset': { borderColor: '#6366f1' },
                '&.Mui-focused fieldset': { borderColor: '#818cf8' },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isStreaming}
            sx={{
              bgcolor: '#4f46e5',
              color: '#ffffff',
              '&:hover': { bgcolor: '#4338ca' },
              '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' },
            }}
          >
            {isStreaming ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AuditorCopilot;
