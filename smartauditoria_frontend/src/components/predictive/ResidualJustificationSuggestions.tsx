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
  IconButton
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiRequest } from '../../services/api';

interface ResidualJustificationSuggestion {
  id: string;
  titulo: string;
  descripcion: string;
  norma: string;
  articulo: string;
  confianza: number;
  relacion_inherente: string; // Explica la relacion con el riesgo inherente
  controles_mencionados: string[];
}

interface ResidualJustificationSuggestionsProps {
  inherentRisk: {
    probabilidad: string;
    impacto: string;
    nivel: string;
  };
  residualRisk: {
    probabilidad: string;
    impacto: string;
    nivel: string;
  };
  selectedControls: string[];
  onJustificationSelect?: (justification: string) => void;
}

const ResidualJustificationSuggestions: React.FC<ResidualJustificationSuggestionsProps> = ({
  inherentRisk,
  residualRisk,
  selectedControls,
  onJustificationSelect
}) => {
  const [suggestions, setSuggestions] = useState<ResidualJustificationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());

  const loadJustificationSuggestions = async () => {
    if (!residualRisk.probabilidad || !residualRisk.impacto) {
      return; // No cargar si no hay evaluacion residual
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Llamar al endpoint de justificaciones residuales basadas en normativa
      const response = (await apiRequest('/predictive/suggestions/residual-justifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inherent_risk: {
            probabilidad: inherentRisk.probabilidad,
            impacto: inherentRisk.impacto,
            nivel: inherentRisk.nivel
          },
          residual_risk: {
            probabilidad: residualRisk.probabilidad,
            impacto: residualRisk.impacto,
            nivel: residualRisk.nivel
          },
          controls: selectedControls
        })
      })) as any;

      if (response.success && response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      } else {
        // Sugerencias de fallback basadas en normativa ISO
        const fallbackSuggestions = generateFallbackSuggestions();
        setSuggestions(fallbackSuggestions.length > 0 ? fallbackSuggestions : []);
      }
    } catch (err) {
      console.error('Error loading residual justification suggestions:', err);
      // Sugerencias de fallback
      const fallbackSuggestions = generateFallbackSuggestions();
      setSuggestions(fallbackSuggestions.length > 0 ? fallbackSuggestions : []);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackSuggestions = (): ResidualJustificationSuggestion[] => {
    const suggestions: ResidualJustificationSuggestion[] = [];
    
    // Analizar la reduccion del riesgo
    const inherentLevel = inherentRisk.nivel;
    const residualLevel = residualRisk.nivel;
    const nivelMap: { [key: string]: string } = {
      'HIGH': 'Alto',
      'MEDIUM': 'Medio',
      'LOW': 'Bajo',
      'Alto': 'Alto',
      'Medio': 'Medio',
      'Bajo': 'Bajo'
    };
    
    // Sugerencia 1: Reduccion de probabilidad
    if (inherentRisk.probabilidad !== residualRisk.probabilidad) {
      suggestions.push({
        id: '1',
        titulo: 'Reduccion de Probabilidad',
        descripcion: `Los controles implementados han reducido la probabilidad de ${inherentRisk.probabilidad} a ${residualRisk.probabilidad}. Esta reduccion se debe a la eficacia de los controles de seguridad aplicados.`,
        norma: 'ISO 27005',
        articulo: 'A.6.1.2',
        confianza: 0.85,
        relacion_inherente: `El riesgo inherente tenia una probabilidad ${inherentRisk.probabilidad}, que ha sido mitigada a ${residualRisk.probabilidad} mediante los controles implementados.`,
        controles_mencionados: selectedControls.slice(0, 3)
      });
    }

    // Sugerencia 2: Reduccion de impacto
    if (inherentRisk.impacto !== residualRisk.impacto) {
      suggestions.push({
        id: '2',
        titulo: 'Mitigacion de Impacto',
        descripcion: `El impacto se ha reducido de ${inherentRisk.impacto} a ${residualRisk.impacto} gracias a los controles de proteccion y recuperacion implementados.`,
        norma: 'ISO 27002',
        articulo: 'A.12.3',
        confianza: 0.80,
        relacion_inherente: `El impacto inherente era ${inherentRisk.impacto}, ahora es ${residualRisk.impacto} debido a las medidas de mitigacion.`,
        controles_mencionados: selectedControls.slice(0, 2)
      });
    }

    // Sugerencia 3: Reduccion general del nivel de riesgo
    if (inherentLevel !== residualLevel) {
      suggestions.push({
        id: '3',
        titulo: 'Reduccion del Nivel de Riesgo',
        descripcion: `El nivel de riesgo se ha reducido de ${nivelMap[inherentLevel] || inherentLevel} a ${nivelMap[residualLevel] || residualLevel}. Los controles implementados han demostrado su eficacia en la mitigacion del riesgo.`,
        norma: 'ISO 27005',
        articulo: 'A.8.1',
        confianza: 0.90,
        relacion_inherente: `El riesgo inherente era ${nivelMap[inherentLevel] || inherentLevel} (${inherentRisk.probabilidad} probabilidad, ${inherentRisk.impacto} impacto). Con los controles, ahora es ${nivelMap[residualLevel] || residualLevel} (${residualRisk.probabilidad} probabilidad, ${residualRisk.impacto} impacto).`,
        controles_mencionados: selectedControls
      });
    }

    // Sugerencia 4: Eficacia de controles especificos (SIEMPRE generar si hay controles)
    if (selectedControls.length > 0) {
      suggestions.push({
        id: '4',
        titulo: 'Eficacia de Controles',
        descripcion: `Los controles seleccionados (${selectedControls.slice(0, 3).join(', ')}) han demostrado eficacia en la reduccion del riesgo. Segun ISO 27005, la evaluacion residual debe considerar la efectividad real de los controles implementados.`,
        norma: 'ISO 27005',
        articulo: 'A.8.2',
        confianza: 0.75,
        relacion_inherente: `Los controles implementados han mitigado el riesgo inherente ${nivelMap[inherentLevel] || inherentLevel} al nivel residual ${nivelMap[residualLevel] || residualLevel}.`,
        controles_mencionados: selectedControls
      });
    }

    // Si no hay sugerencias generadas, crear una sugerencia generica
    if (suggestions.length === 0 && selectedControls.length > 0) {
      suggestions.push({
        id: 'default',
        titulo: 'Evaluacion Residual con Controles',
        descripcion: `La evaluacion residual considera el riesgo despues de aplicar los controles seleccionados (${selectedControls.slice(0, 3).join(', ')}). Segun ISO 27005, la evaluacion residual debe reflejar la efectividad de los controles implementados.`,
        norma: 'ISO 27005',
        articulo: 'A.8.1',
        confianza: 0.70,
        relacion_inherente: `El riesgo residual (${residualRisk.probabilidad} probabilidad, ${residualRisk.impacto} impacto) refleja la mitigacion lograda mediante los controles aplicados sobre el riesgo inherente (${inherentRisk.probabilidad} probabilidad, ${inherentRisk.impacto} impacto).`,
        controles_mencionados: selectedControls
      });
    }

    return suggestions.slice(0, 4); // Maximo 4 sugerencias
  };

  const handleAccept = (suggestion: ResidualJustificationSuggestion) => {
    if (onJustificationSelect) {
      // Construir justificacion completa con relacion al inherente
      const fullJustification = `${suggestion.descripcion}\n\n${suggestion.relacion_inherente}\n\nReferencia: ${suggestion.norma} ${suggestion.articulo}`;
      onJustificationSelect(fullJustification);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  useEffect(() => {
    if (residualRisk.probabilidad && residualRisk.impacto && selectedControls.length > 0) {
      loadJustificationSuggestions();
    } else {
      // Limpiar sugerencias si no se cumplen las condiciones
      setSuggestions([]);
      setError(null);
    }
  }, [residualRisk.probabilidad, residualRisk.impacto, selectedControls.length]);

  if (!residualRisk.probabilidad || !residualRisk.impacto) {
    return (
      <Alert severity="info" sx={{ borderRadius: '8px' }}>
        <Typography variant="body2">
          Completa la evaluacion residual (probabilidad e impacto) para ver sugerencias de justificacion basadas en normativa.
        </Typography>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Generando justificaciones basadas en normativa...
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

  if (suggestions.length === 0 && !isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {selectedControls.length > 0 && residualRisk.probabilidad && residualRisk.impacto
            ? 'No se pudieron generar sugerencias automaticas. Puedes escribir tu justificacion manualmente basandote en los controles seleccionados y la evaluacion residual.'
            : 'No hay sugerencias disponibles. Asegurate de haber seleccionado controles y completado la evaluacion residual.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
          <LightbulbIcon sx={{ color: '#1E3A8A', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
            ðŸ’¡ Justificaciones ISO 27005
          </Typography>
        </Box>
        <Tooltip title="Las sugerencias estan basadas en normativa ISO 27005 y consideran la relacion con el riesgo inherente evaluado">
          <IconButton size="small">
            <InfoIcon sx={{ fontSize: 18, color: '#6B7280' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box display="flex" flexDirection="column" gap={1.5}>
        {suggestions.map((suggestion, index) => (
          <Zoom
            key={`residual-justification-${suggestion.id}-${index}`}
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
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                    {suggestion.relacion_inherente}
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
                      label={`${(suggestion.confianza * 100).toFixed(0)}% confianza`}
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
              placement="left"
            >
              <Paper
                elevation={hoveredSuggestion === suggestion.id ? 4 : 1}
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
                    : '1px solid #E5E7EB',
                  transition: 'all 0.3s ease',
                  transform: hoveredSuggestion === suggestion.id ? 'scale(1.02)' : 'scale(1)',
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
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredSuggestion(suggestion.id)}
                onMouseLeave={() => setHoveredSuggestion(null)}
                onClick={() => !acceptedSuggestions.has(suggestion.id) && !rejectedSuggestions.has(suggestion.id) && handleAccept(suggestion)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#FF9800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        <LightbulbIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 'bold',
                          color: '#E65100'
                        }}
                      >
                        {suggestion.titulo}
                      </Typography>
                    </Box>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.85rem',
                        color: '#374151',
                        mb: 1,
                        lineHeight: 1.5
                      }}
                    >
                      {suggestion.descripcion}
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                      <Chip
                        label={`${suggestion.norma} ${suggestion.articulo}`}
                        size="small"
                        sx={{ 
                          backgroundColor: '#1E3A8A',
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 20
                        }}
                      />
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: getConfidenceColor(suggestion.confianza)
                        }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6B7280' }}>
                        {suggestion.norma}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Botones de accion */}
                  {!acceptedSuggestions.has(suggestion.id) && !rejectedSuggestions.has(suggestion.id) && (
                    <Box display="flex" gap={0.5} ml={1}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(suggestion);
                        }}
                        sx={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            backgroundColor: '#45A049'
                          }
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(suggestion.id);
                        }}
                        sx={{
                          backgroundColor: '#F44336',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            backgroundColor: '#D32F2F'
                          }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                  
                  {/* Indicador de estado */}
                  {acceptedSuggestions.has(suggestion.id) && (
                    <Box display="flex" alignItems="center" ml={1}>
                      <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 24 }} />
                    </Box>
                  )}
                  
                  {rejectedSuggestions.has(suggestion.id) && (
                    <Box display="flex" alignItems="center" ml={1}>
                      <CloseIcon sx={{ color: '#F44336', fontSize: 24 }} />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Tooltip>
          </Zoom>
        ))}
      </Box>
      
      {acceptedSuggestions.size > 0 && (
        <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
          <Typography variant="body2">
            <strong>âœ“ Justificacion cargada.</strong> Puedes complementar o editar el texto en el campo de justificacion.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ResidualJustificationSuggestions;

