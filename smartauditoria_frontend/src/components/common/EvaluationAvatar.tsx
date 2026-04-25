import React from 'react';
import { Box, Avatar, Typography, LinearProgress, Chip } from '@mui/material';
import { SmartToy, CheckCircle, Warning, Error } from '@mui/icons-material';

interface EvaluationAvatarProps {
  activo: any;
  progreso: number;
  estado: 'completa' | 'parcial' | 'pendiente' | 'error';
  showDetails?: boolean;
}

const EvaluationAvatar: React.FC<EvaluationAvatarProps> = ({
  activo,
  progreso,
  estado,
  showDetails = false
}) => {
  const getAvatarIcon = () => {
    switch (estado) {
      case 'completa':
        return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'parcial':
        return <Warning sx={{ color: '#F59E0B' }} />;
      case 'error':
        return <Error sx={{ color: '#EF4444' }} />;
      default:
        return <SmartToy sx={{ color: '#6B7280' }} />;
    }
  };

  const getAvatarColor = () => {
    switch (estado) {
      case 'completa':
        return '#10B981';
      case 'parcial':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getEstadoText = () => {
    switch (estado) {
      case 'completa':
        return 'Evaluacion Completa';
      case 'parcial':
        return 'Evaluacion Parcial';
      case 'error':
        return 'Error en Evaluacion';
      default:
        return 'Pendiente de Evaluacion';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
      {/* Avatar */}
      <Avatar
        sx={{
          bgcolor: getAvatarColor(),
          width: 56,
          height: 56,
          border: `2px solid ${getAvatarColor()}`,
          boxShadow: `0 0 0 4px ${getAvatarColor()}20`
        }}
      >
        {getAvatarIcon()}
      </Avatar>

      {/* Informacion del activo */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
          {activo?.Nombre || activo?.nombre || 'Activo'}
        </Typography>
        
        <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
          {activo?.Tipo_Activo || activo?.tipo || 'Tipo no especificado'}
        </Typography>

        {/* Progreso */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
              Progreso de Evaluacion
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
              {progreso}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progreso}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getAvatarColor(),
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Estado */}
        <Chip
          label={getEstadoText()}
          size="small"
          sx={{
            backgroundColor: getAvatarColor(),
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        />
      </Box>

      {/* Detalles adicionales si se solicitan */}
      {showDetails && (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
            Criticidad
          </Typography>
          <Chip
            label={activo?.nivel_criticidad_negocio || 'N/A'}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};

export default EvaluationAvatar;
