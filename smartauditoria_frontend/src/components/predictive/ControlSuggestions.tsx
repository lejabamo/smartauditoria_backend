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
  Grid,
  Paper,
  Tooltip,
  Fade,
  Zoom,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { apiRequest } from '../../services/api';

interface ControlSuggestion {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  confianza: number;
  implementacion: string;
  prioridad: number;
  eficacia: number;
}

interface ControlSuggestionsProps {
  assetType: string;
  threatType?: string;
  vulnerabilityType?: string;
  threatName?: string;  // Nombre completo de la amenaza
  vulnerabilityName?: string;  // Nombre completo de la vulnerabilidad
  riskDescription?: string;  // Descripcion del riesgo
  onControlSelect?: (control: ControlSuggestion) => void;
  selectedControls?: string[];
}

const ControlSuggestions: React.FC<ControlSuggestionsProps> = ({
  assetType,
  threatType,
  vulnerabilityType,
  threatName,
  vulnerabilityName,
  riskDescription,
  onControlSelect,
  selectedControls = []
}) => {
  const [suggestions, setSuggestions] = useState<ControlSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);

  const loadControlSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = (await apiRequest('/predictive/suggestions/controls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_type: assetType,
          threat_id: threatType || '',
          threat_name: threatName || threatType || '',
          vulnerability_id: vulnerabilityType || '',
          vulnerability_name: vulnerabilityName || vulnerabilityType || '',
          risk_description: riskDescription || ''
        })
      })) as any;

      if (response.success) {
        setSuggestions(response.suggestions || []);
      } else {
        setError('Error al cargar sugerencias de controles');
      }
    } catch (err) {
      console.error('Error loading control suggestions:', err);
      setError('Error al cargar sugerencias de controles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleControlClick = (control: ControlSuggestion) => {
    if (onControlSelect) {
      onControlSelect(control);
    }
  };

  const getEficaciaColor = (eficacia: number) => {
    if (eficacia >= 80) return '#4CAF50';
    if (eficacia >= 60) return '#FF9800';
    if (eficacia >= 40) return '#FF5722';
    return '#F44336';
  };

  const getEficaciaLabel = (eficacia: number) => {
    if (eficacia >= 80) return 'Muy Alta';
    if (eficacia >= 60) return 'Alta';
    if (eficacia >= 40) return 'Media';
    return 'Baja';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return '#F44336';
    if (priority >= 3) return '#FF9800';
    return '#4CAF50';
  };

  useEffect(() => {
    if (assetType) {
      loadControlSuggestions();
    }
  }, [assetType, threatType, vulnerabilityType]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando controles ISO...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadControlSuggestions}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
          ðŸ›¡ï¸ Controles Sugeridos ISO 27002
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadControlSuggestions}
          size="small"
          sx={{ borderRadius: '20px' }}
        >
          Actualizar
        </Button>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={1.5}>
        {suggestions.map((control, index) => (
          <Zoom
            key={`control-suggestion-${control.id}-${index}`}
            in={true}
            timeout={300 + index * 100}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <Tooltip
              title={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {control.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {control.descripcion}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`Eficacia: ${control.eficacia}%`}
                      size="small"
                      sx={{ 
                        backgroundColor: getEficaciaColor(control.eficacia),
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                    <Chip
                      label={`P${control.prioridad}`}
                      size="small"
                      sx={{ 
                        backgroundColor: getPriorityColor(control.prioridad),
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                    <Chip
                      label={control.categoria}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {control.implementacion}
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
            >
              <Paper
                elevation={hoveredControl === control.id ? 8 : 2}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  backgroundColor: selectedControls.includes(control.id) ? '#E3F2FD' : '#F8F9FA',
                  border: selectedControls.includes(control.id) ? '2px solid #1E3A8A' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  transform: hoveredControl === control.id ? 'scale(1.05)' : 'scale(1)',
                  '&:hover': {
                    borderColor: '#1E3A8A',
                    backgroundColor: '#E3F2FD',
                  },
                  minWidth: '140px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredControl(control.id)}
                onMouseLeave={() => setHoveredControl(null)}
                onClick={() => handleControlClick(control)}
              >
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: selectedControls.includes(control.id) ? '#1E3A8A' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      color: 'white'
                    }}
                  >
                    <SecurityIcon />
                  </Box>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      mb: 0.5,
                      color: selectedControls.includes(control.id) ? '#1E3A8A' : '#374151'
                    }}
                  >
                    {control.titulo}
                  </Typography>
                  
                  <Box display="flex" gap={0.5} justifyContent="center" flexWrap="wrap">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getEficaciaColor(control.eficacia)
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.secondary'
                      }}
                    >
                      {getEficaciaLabel(control.eficacia)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Indicador de seleccion */}
                {selectedControls.includes(control.id) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: '#4CAF50',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                  </Box>
                )}
              </Paper>
            </Tooltip>
          </Zoom>
        ))}
      </Box>

      {suggestions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay controles sugeridos disponibles
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ControlSuggestions;
