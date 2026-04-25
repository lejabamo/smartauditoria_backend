import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Divider,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { AutoAwesome, AddCircleOutline, InfoOutlined } from '@mui/icons-material';

interface SuggestionCardProps {
  id?: string;
  nombre: string;
  descripcion?: string;
  referencia_iso?: string;
  probabilidad_base?: number;
  impacto_base?: number;
  tipo: 'threat' | 'vulnerability' | 'control';
  onSelect: (data: any) => void;
}

/**
 * Tarjeta de sugerencia generada por el Motor IA (RAG).
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  nombre,
  descripcion,
  referencia_iso,
  probabilidad_base,
  impacto_base,
  tipo,
  onSelect,
}) => {
  const getHeaderColor = () => {
    switch (tipo) {
      case 'threat': return '#ef4444'; // Red
      case 'vulnerability': return '#f59e0b'; // Amber
      case 'control': return '#10b981'; // Emerald
      default: return '#6366f1'; // Indigo
    }
  };

  const getLabel = () => {
    switch (tipo) {
      case 'threat': return 'Amenaza Sugerida';
      case 'vulnerability': return 'Vulnerabilidad Sugerida';
      case 'control': return 'Control ISO 27002';
    }
  };

  return (
    <Card sx={{
      mb: 2,
      borderLeft: `5px solid ${getHeaderColor()}`,
      transition: '0.3s',
      '&:hover': {
        boxShadow: (theme) => theme.shadows[6],
        transform: 'translateY(-2px)'
      }
    }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesome sx={{ color: getHeaderColor(), fontSize: 18 }} />
            <Typography variant="overline" sx={{ fontWeight: 700, color: getHeaderColor() }}>
              {getLabel()}
            </Typography>
          </Box>
          {referencia_iso && (
            <Chip
              label={referencia_iso}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        <Typography variant="h6" component="div" gutterBottom sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
          {nombre}
        </Typography>

        {descripcion && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
            "{descripcion}"
          </Typography>
        )}

        {(probabilidad_base || impacto_base) && (
          <Box display="flex" gap={2} mb={2}>
             <Box>
                <Typography variant="caption" color="text.secondary" display="block">Prob. Base</Typography>
                <Chip label={probabilidad_base || 'N/A'} size="small" variant="filled" />
             </Box>
             <Box>
                <Typography variant="caption" color="text.secondary" display="block">Imp. Base</Typography>
                <Chip label={impacto_base || 'N/A'} size="small" variant="filled" />
             </Box>
          </Box>
        )}

        <Divider sx={{ mb: 1, opacity: 0.1 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tooltip title="Ver detalles normativos">
            <IconButton size="small">
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutline />}
            onClick={() => onSelect({ nombre, descripcion, referencia_iso })}
            sx={{
              backgroundColor: getHeaderColor(),
              '&:hover': { backgroundColor: getHeaderColor(), opacity: 0.9 }
            }}
          >
            Vincular
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
