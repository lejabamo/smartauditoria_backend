import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Divider,
} from '@mui/material';
import { useSuggestions } from '../model/useSuggestions';
import { SuggestionCard } from './SuggestionCard';
import { AutoAwesome } from '@mui/icons-material';

interface SuggestionContainerProps {
  activo_nombre: string;
  activo_tipo: string;
  tipo: 'threats' | 'vulnerabilities' | 'controls';
  amenaza_nombre?: string;
  vulnerabilidad_nombre?: string;
  onSelect: (data: any) => void;
}

/**
 * Contenedor inteligente que ofrece sugerencias del Motor RAG
 * basado en el contexto actual del formulario.
 */
export const SuggestionContainer: React.FC<SuggestionContainerProps> = ({
  activo_nombre,
  activo_tipo,
  tipo,
  amenaza_nombre,
  vulnerabilidad_nombre,
  onSelect,
}) => {
  const { suggestions, isLoading, error, fetchSuggestions, motorIaDisponibilidad } = useSuggestions();

  useEffect(() => {
    if (activo_nombre && activo_tipo) {
      fetchSuggestions({
        activo_nombre,
        activo_tipo,
        tipo,
        amenaza_id: amenaza_nombre,
        vulnerabilidad_id: vulnerabilidad_nombre,
      });
    }
  }, [activo_nombre, activo_tipo, tipo, amenaza_nombre, vulnerabilidad_nombre, fetchSuggestions]);

  if (!activo_nombre) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Complete el nombre del activo para recibir sugerencias inteligentes.
      </Alert>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
        border: '1px solid',
        borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <AutoAwesome sx={{ color: '#6366f1' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
          Sugerencias Inteligentes (RAG Engine)
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, opacity: 0.1 }} />

      {!motorIaDisponibilidad && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Motor IA no disponible</AlertTitle>
          Mostrando sugerencias base (sin contexto ISO).
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
          <CircularProgress size={30} />
          <Typography variant="caption" color="text.secondary">
            Analizando normas ISO 27001/27002...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : suggestions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" py={2}>
          No se encontraron sugerencias especificas para este contexto.
        </Typography>
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Encontrados {suggestions.length} elementos relevantes en la base de conocimiento ISO:
          </Typography>

          <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
            {suggestions.map((item: any, idx: number) => (
              <SuggestionCard
                key={idx}
                tipo={tipo === 'threats' ? 'threat' : tipo === 'vulnerabilities' ? 'vulnerability' : 'control'}
                nombre={item.nombre}
                descripcion={item.descripcion}
                referencia_iso={item.referencia_iso || item.normativa_iso || item.codigo}
                probabilidad_base={item.probabilidad_base}
                impacto_base={item.impacto_base}
                onSelect={onSelect}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};
