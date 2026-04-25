import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import '../../styles/design-system.css';

interface RiskMatrixProps {
  selectedProbability?: number;
  selectedImpact?: number;
  onCellClick?: (probability: number, impact: number) => void;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({
  selectedProbability,
  selectedImpact,
  onCellClick
}) => {
  const matrix = [
    // Frecuente
    [
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'HIGH', value: 0, color: '#EF4444' },
      { level: 'HIGH', value: 0, color: '#EF4444' },
      { level: 'HIGH', value: 0, color: '#EF4444' }
    ],
    // Probable
    [
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'HIGH', value: 0, color: '#EF4444' },
      { level: 'HIGH', value: 0, color: '#EF4444' }
    ],
    // Ocasional
    [
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'HIGH', value: 0, color: '#EF4444' },
      { level: 'HIGH', value: 0, color: '#EF4444' }
    ],
    // Posible
    [
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' },
      { level: 'HIGH', value: 0, color: '#EF4444' },
      { level: 'HIGH', value: 0, color: '#EF4444' }
    ],
    // Improbable
    [
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'LOW', value: 0, color: '#10B981' },
      { level: 'MEDIUM', value: 0, color: '#F59E0B' }
    ]
  ];

  const getRiskLevel = (probability: number, impact: number) => {
    const cell = matrix[probability - 1]?.[impact - 1];
    return cell || { level: 'LOW', value: 1, color: '#10B981' };
  };

  const isSelected = (probability: number, impact: number) => {
    return selectedProbability === probability && selectedImpact === impact;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2, textAlign: 'center' }}>
        Matriz de Evaluacion de Riesgo
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontWeight: 500 }}>
            Frecuencia (Probabilidad)
          </Typography>
          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontWeight: 500 }}>
            Impacto
          </Typography>
        </Box>

        {/* Matrix Grid */}
        <Grid container spacing={1}>
          {/* Y-axis labels (Frecuencia) */}
          <Grid  size={{ xs: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around' }}>
              {['Frecuente', 'Probable', 'Ocasional', 'Posible', 'Improbable'].map((frecuencia, index) => (
                <Typography 
                  key={frecuencia}
                  variant="body2" 
                  className="font-roboto" 
                  sx={{ 
                    color: '#1E3A8A', 
                    fontWeight: 600,
                    textAlign: 'center',
                    py: 1,
                    fontSize: '0.75rem'
                  }}
                >
                  {frecuencia}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Matrix cells */}
          <Grid  size={{ xs: 10 }}>
            <Grid container spacing={1}>
              {/* X-axis labels (Impacto) */}
              <Grid  size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 1 }}>
                  {['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrofico'].map((impacto) => (
                    <Typography 
                      key={impacto}
                      variant="body2" 
                      className="font-roboto" 
                      sx={{ 
                        color: '#1E3A8A', 
                        fontWeight: 600,
                        textAlign: 'center',
                        width: '100%',
                        fontSize: '0.75rem'
                      }}
                    >
                      {impacto}
                    </Typography>
                  ))}
                </Box>
              </Grid>

              {/* Matrix cells */}
              {[0, 1, 2, 3, 4].map((rowIndex) => (
                <Grid key={`matrix-row-${rowIndex}`} size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    {[0, 1, 2, 3, 4].map((colIndex) => {
                      const cell = matrix[rowIndex][colIndex];
                      const isCellSelected = isSelected(rowIndex + 1, colIndex + 1);
                      
                      return (
                        <Box
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => onCellClick?.(rowIndex + 1, colIndex + 1)}
                          sx={{
                            width: '60px',
                            height: '50px',
                            backgroundColor: cell.color,
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: onCellClick ? 'pointer' : 'default',
                            border: isCellSelected ? '3px solid #1E3A8A' : '2px solid transparent',
                            boxShadow: isCellSelected 
                              ? '0 8px 25px rgba(30, 58, 138, 0.3)' 
                              : '0 4px 12px rgba(0, 0, 0, 0.1)',
                            transform: isCellSelected ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': onCellClick ? {
                              transform: 'scale(1.02)',
                              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                            } : {}
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            className="font-poppins" 
                            sx={{ 
                              color: '#FFFFFF', 
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              lineHeight: 1
                            }}
                          >
                            {cell.level}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            className="font-poppins" 
                            sx={{ 
                              color: '#FFFFFF', 
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              lineHeight: 1
                            }}
                          >
                            {cell.value}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        {/* Legend */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#10B981', borderRadius: '4px' }} />
            <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
              BAJO
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#F59E0B', borderRadius: '4px' }} />
            <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
              MEDIO
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: '#EF4444', borderRadius: '4px' }} />
            <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
              ALTO
            </Typography>
          </Box>
        </Box>

        {/* Selected Risk Display */}
        {selectedProbability && selectedImpact && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
              Riesgo Seleccionado:
            </Typography>
            <Chip
              label={`Frecuencia: ${selectedProbability} | Impacto: ${selectedImpact} | Nivel: ${getRiskLevel(selectedProbability, selectedImpact).level}`}
              sx={{
                backgroundColor: getRiskLevel(selectedProbability, selectedImpact).color,
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 2,
                py: 1
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default RiskMatrix;
