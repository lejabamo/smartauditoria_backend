import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
  Fade,
  Zoom,
  Grid
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { apiRequest } from '../../services/api';

interface ResidualRiskSuggestion {
  id: string;
  probabilidad: string;
  impacto: string;
  nivel: string;
  justificacion: string;
  controles_efectivos: string[];
  confianza: number;
  norma: string;
}

interface ResidualRiskSuggestionsProps {
  inherentRisk: {
    probabilidad: string;
    impacto: string;
    nivel: string;
  };
  selectedControls: string[];
  onSuggestionSelect?: (suggestion: ResidualRiskSuggestion) => void;
}

const ResidualRiskSuggestions: React.FC<ResidualRiskSuggestionsProps> = ({
  inherentRisk,
  selectedControls,
  onSuggestionSelect
}) => {
  const [suggestions, setSuggestions] = useState<ResidualRiskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);

  const loadResidualRiskSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular sugerencias basadas en riesgo inherente y controles seleccionados
      const mockSuggestions: ResidualRiskSuggestion[] = [
        {
          id: '1',
          probabilidad: 'Baja',
          impacto: 'Menor',
          nivel: 'LOW',
          justificacion: 'Los controles de acceso y monitoreo implementados reducen significativamente la probabilidad de materializacion del riesgo.',
          controles_efectivos: ['Control de Acceso', 'Monitoreo de Red'],
          confianza: 0.9,
          norma: 'ISO 27005'
        },
        {
          id: '2',
          probabilidad: 'Media',
          impacto: 'Moderado',
          nivel: 'MEDIUM',
          justificacion: 'Aunque los controles reducen la probabilidad, el impacto sigue siendo moderado debido a la criticidad del activo.',
          controles_efectivos: ['Cifrado de Datos', 'Respaldos Regulares'],
          confianza: 0.8,
          norma: 'ISO 27005'
        },
        {
          id: '3',
          probabilidad: 'Baja',
          impacto: 'Alto',
          nivel: 'MEDIUM',
          justificacion: 'Los controles de seguridad reducen la probabilidad, pero el impacto alto se mantiene por la naturaleza critica del activo.',
          controles_efectivos: ['Autenticacion Multifactor', 'Auditoria de Seguridad'],
          confianza: 0.75,
          norma: 'ISO 27005'
        }
      ];

      // Filtrar sugerencias basadas en controles seleccionados
      const filteredSuggestions = mockSuggestions.filter(suggestion => 
        suggestion.controles_efectivos.some(control => 
          selectedControls.some(selected => 
            selected.toLowerCase().includes(control.toLowerCase().split(' ')[0]) ||
            control.toLowerCase().includes(selected.toLowerCase().split(' ')[0])
          )
        )
      );

      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error loading residual risk suggestions:', err);
      setError('Error al cargar sugerencias de riesgo residual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: ResidualRiskSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const getRiskLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRiskLevelIcon = (nivel: string) => {
    switch (nivel) {
      case 'LOW': return <CheckCircleIcon />;
      case 'MEDIUM': return <WarningIcon />;
      case 'HIGH': return <WarningIcon />;
      default: return <WarningIcon />;
    }
  };

  useEffect(() => {
    if (selectedControls.length > 0) {
      loadResidualRiskSuggestions();
    }
  }, [selectedControls, inherentRisk]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Calculando riesgo residual...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadResidualRiskSuggestions}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Selecciona controles para ver sugerencias de riesgo residual
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <TrendingDownIcon sx={{ color: '#1E3A8A', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
          ðŸ“Š Sugerencias de Riesgo Residual
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {suggestions.map((suggestion, index) => (
          <Grid key={`residual-suggestion-${suggestion.id}-${index}`} size={{ xs: 12, md: 6 }}>
            <Zoom
              in={true}
              timeout={300 + index * 100}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Tooltip
                title={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Justificacion Detallada
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {suggestion.justificacion}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      <Chip
                        label={suggestion.norma}
                        size="small"
                        sx={{ 
                          backgroundColor: '#1E3A8A',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip
                        label={`${(suggestion.confianza * 100).toFixed(0)}%`}
                        size="small"
                        sx={{ 
                          backgroundColor: suggestion.confianza >= 0.8 ? '#4CAF50' : '#FF9800',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Paper
                  elevation={hoveredSuggestion === suggestion.id ? 8 : 2}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    backgroundColor: '#F8F9FA',
                    border: '2px solid transparent',
                    transition: 'all 0.3s ease',
                    transform: hoveredSuggestion === suggestion.id ? 'scale(1.02)' : 'scale(1)',
                    '&:hover': {
                      borderColor: getRiskLevelColor(suggestion.nivel),
                      backgroundColor: '#FFFFFF',
                    },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={() => setHoveredSuggestion(suggestion.id)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: getRiskLevelColor(suggestion.nivel),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        color: 'white'
                      }}
                    >
                      {getRiskLevelIcon(suggestion.nivel)}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
                        {suggestion.nivel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Riesgo Residual
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Probabilidad:</strong> {suggestion.probabilidad}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Impacto:</strong> {suggestion.impacto}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {suggestion.justificacion}
                  </Typography>

                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {suggestion.controles_efectivos.map((control, idx) => (
                      <Chip
                        key={`residual-control-${suggestion.id}-${idx}-${control}`}
                        label={control}
                        size="small"
                        sx={{ 
                          backgroundColor: '#E3F2FD',
                          color: '#1E3A8A',
                          fontSize: '0.7rem'
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Tooltip>
            </Zoom>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ResidualRiskSuggestions;





