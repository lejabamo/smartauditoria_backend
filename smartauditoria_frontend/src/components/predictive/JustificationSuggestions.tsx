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
  Zoom
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiRequest } from '../../services/api';

interface JustificationSuggestion {
  id: string;
  titulo: string;
  descripcion: string;
  norma: string;
  articulo: string;
  confianza: number;
}

interface JustificationSuggestionsProps {
  riskType: string;
  controls: string[];
  onJustificationSelect?: (justification: string) => void;
}

const JustificationSuggestions: React.FC<JustificationSuggestionsProps> = ({
  riskType,
  controls,
  onJustificationSelect
}) => {
  const [suggestions, setSuggestions] = useState<JustificationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());

  const loadJustificationSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener sugerencias reales del backend basadas en controles seleccionados
      const response = (await apiRequest('/predictive/suggestions/justifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          controls: controls,
          risk_type: riskType
        })
      })) as any;

      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
      } else {
        // Si no hay sugerencias, no mostrar error, solo lista vacia
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error loading justification suggestions:', err);
      // No mostrar error si no hay sugerencias, solo lista vacia
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = (suggestion: JustificationSuggestion) => {
    if (onJustificationSelect) {
      onJustificationSelect(suggestion.descripcion);
    }
    setAcceptedSuggestions(prev => new Set(prev).add(suggestion.id));
    setRejectedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(suggestion.id);
      return newSet;
    });
  };

  const handleReject = (suggestionId: string) => {
    setRejectedSuggestions(prev => new Set(prev).add(suggestionId));
    setAcceptedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(suggestionId);
      return newSet;
    });
  };

  const handleJustificationClick = (suggestion: JustificationSuggestion) => {
    // Si ya fue aceptada o rechazada, no hacer nada
    if (acceptedSuggestions.has(suggestion.id) || rejectedSuggestions.has(suggestion.id)) {
      return;
    }
    // Por defecto, aceptar al hacer clic
    handleAccept(suggestion);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  useEffect(() => {
    if (controls.length > 0 || riskType) {
      loadJustificationSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls.length, riskType]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando justificaciones...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadJustificationSuggestions}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2, backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
        <Typography variant="body2" color="text.secondary">
          {(controls.length === 0 && !riskType) 
            ? "Selecciona un activo e identifica riesgos para ver justificaciones sugeridas." 
            : "No hay justificaciones normativas específicas para esta combinación. Puedes redactar una justificación manual abajo."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <LightbulbIcon sx={{ color: '#1E3A8A', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
          💡 Justificaciones Sugeridas ISO 27002
        </Typography>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={1.5}>
        {suggestions.map((suggestion, index) => (
          <Zoom
            key={`justification-suggestion-${suggestion.id}-${index}`}
            in={true}
            timeout={300 + index * 100}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <Tooltip
              title={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {suggestion.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {suggestion.descripcion}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`${suggestion.norma} ${suggestion.articulo}`}
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
                        backgroundColor: getConfidenceColor(suggestion.confianza),
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
                  p: 2,
                  cursor: acceptedSuggestions.has(suggestion.id) || rejectedSuggestions.has(suggestion.id) ? 'default' : 'pointer',
                  backgroundColor: acceptedSuggestions.has(suggestion.id) 
                    ? '#E8F5E9' 
                    : rejectedSuggestions.has(suggestion.id)
                    ? '#FFEBEE'
                    : '#FFF8E1',
                  border: acceptedSuggestions.has(suggestion.id)
                    ? '2px solid #4CAF50'
                    : rejectedSuggestions.has(suggestion.id)
                    ? '2px solid #F44336'
                    : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  transform: hoveredSuggestion === suggestion.id ? 'scale(1.05)' : 'scale(1)',
                  '&:hover': {
                    borderColor: acceptedSuggestions.has(suggestion.id)
                      ? '#4CAF50'
                      : rejectedSuggestions.has(suggestion.id)
                      ? '#F44336'
                      : '#FF9800',
                    backgroundColor: acceptedSuggestions.has(suggestion.id)
                      ? '#E8F5E9'
                      : rejectedSuggestions.has(suggestion.id)
                      ? '#FFEBEE'
                      : '#FFF3E0',
                  },
                  width: '180px',
                  height: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredSuggestion(suggestion.id)}
                onMouseLeave={() => setHoveredSuggestion(null)}
                onClick={() => !acceptedSuggestions.has(suggestion.id) && !rejectedSuggestions.has(suggestion.id) && handleJustificationClick(suggestion)}
              >
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#FF9800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      color: 'white'
                    }}
                  >
                    <LightbulbIcon />
                  </Box>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      mb: 0.5,
                      color: '#E65100'
                    }}
                  >
                    {suggestion.titulo}
                  </Typography>
                  
                  <Box display="flex" gap={0.5} justifyContent="center" alignItems="center" mb={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getConfidenceColor(suggestion.confianza)
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.secondary'
                      }}
                    >
                      {suggestion.norma}
                    </Typography>
                  </Box>
                  
                  {/* Botones de aceptar/rechazar */}
                  {!acceptedSuggestions.has(suggestion.id) && !rejectedSuggestions.has(suggestion.id) && (
                    <Box display="flex" gap={0.5} justifyContent="center" mt={1}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(suggestion);
                        }}
                        sx={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          minWidth: 'auto',
                          '&:hover': {
                            backgroundColor: '#45A049'
                          }
                        }}
                      >
                        Aceptar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(suggestion.id);
                        }}
                        sx={{
                          borderColor: '#F44336',
                          color: '#F44336',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          minWidth: 'auto',
                          '&:hover': {
                            borderColor: '#D32F2F',
                            backgroundColor: '#FFEBEE'
                          }
                        }}
                      >
                        Rechazar
                      </Button>
                    </Box>
                  )}
                  
                  {/* Indicador de estado */}
                  {acceptedSuggestions.has(suggestion.id) && (
                    <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                      <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ color: '#4CAF50', ml: 0.5, fontWeight: 'bold' }}>
                        Aceptada
                      </Typography>
                    </Box>
                  )}
                  
                  {rejectedSuggestions.has(suggestion.id) && (
                    <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                      <CloseIcon sx={{ color: '#F44336', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ color: '#F44336', ml: 0.5, fontWeight: 'bold' }}>
                        Rechazada
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Tooltip>
          </Zoom>
        ))}
      </Box>
    </Box>
  );
};

export default JustificationSuggestions;





