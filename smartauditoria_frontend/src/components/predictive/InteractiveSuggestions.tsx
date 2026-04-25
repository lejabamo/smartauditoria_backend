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
  Zoom
} from '@mui/material';
import {
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Shield as ShieldIcon,
  TouchApp as TouchAppIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { apiRequest } from '../../services/api';

interface Suggestion {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  confianza: number;
}

interface InteractiveSuggestionsProps {
  assetType: string | any; // Puede ser string o objeto con datos del activo
  context?: string;
  onSuggestionSelect?: (suggestion: { type: string; data: any }) => void;
  selectedThreat?: string;
  selectedVulnerability?: string;
  showCategories?: ('amenazas' | 'vulnerabilidades' | 'controles')[];
}

const InteractiveSuggestions: React.FC<InteractiveSuggestionsProps> = ({
  assetType,
  context = '',
  onSuggestionSelect,
  selectedThreat,
  selectedVulnerability,
  showCategories = ['amenazas', 'vulnerabilidades', 'controles']
}) => {
  const [suggestions, setSuggestions] = useState<{
    amenazas: Suggestion[];
    vulnerabilidades: Suggestion[];
    controles: Suggestion[];
  }>({
    amenazas: [],
    vulnerabilidades: [],
    controles: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Extraer activo_id del contexto si esta disponible
      const activoId = (assetType as any)?.ID_Activo || (assetType as any)?.id || null;
      const tipoActivo = typeof assetType === 'string' ? assetType : (assetType as any)?.tipo || (assetType as any)?.Tipo_Activo || '';
      
      const response = (await apiRequest('/predictive/suggestions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_type: tipoActivo,
          context: context,
          activo_id: activoId,
          threat: selectedThreat,
          vulnerability: selectedVulnerability
        })
      })) as any;

      if (response.success) {
        setSuggestions(response.data);
      } else {
        setError('Error al cargar sugerencias');
      }
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Error al cargar sugerencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (type: string, suggestion: Suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect({ type, data: suggestion });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'amenazas':
        return <SecurityIcon />;
      case 'vulnerabilidades':
        return <BugReportIcon />;
      case 'controles':
        return <ShieldIcon />;
      default:
        return <TouchAppIcon />;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'amenazas':
        return '#E3F2FD';
      case 'vulnerabilidades':
        return '#FCE4EC';
      case 'controles':
        return '#E8F5E8';
      default:
        return '#F5F5F5';
    }
  };

  useEffect(() => {
    const tipoActivo = typeof assetType === 'string' ? assetType : (assetType?.tipo || assetType?.Tipo_Activo || '');
    if (tipoActivo) {
      loadSuggestions();
    }
  }, [assetType, selectedThreat, selectedVulnerability]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando sugerencias...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadSuggestions}>
          Reintentar
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  const renderSuggestionBubbles = (type: string, items: Suggestion[]) => {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={2}>
          {getCategoryIcon(type)}
          <Typography variant="h6" sx={{ ml: 1, color: '#1E3A8A' }}>
            {type === 'amenazas' ? 'Amenazas' : 
             type === 'vulnerabilidades' ? 'Vulnerabilidades' : 'Controles'}
          </Typography>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={1.5}>
          {items.map((item, index) => (
            <Zoom
              key={`interactive-${type}-${item.id}-${index}`}
              in={true}
              timeout={300 + index * 100}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Tooltip
                title={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {item.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {item.descripcion}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip
                        label={`${(item.confianza * 100).toFixed(0)}%`}
                        size="small"
                        sx={{ 
                          backgroundColor: getConfidenceColor(item.confianza),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip
                        label={item.categoria}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Paper
                  elevation={hoveredSuggestion === item.id ? 8 : 2}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: getCategoryColor(type),
                    border: '2px solid transparent',
                    transition: 'all 0.3s ease',
                    transform: hoveredSuggestion === item.id ? 'scale(1.05)' : 'scale(1)',
                    '&:hover': {
                      borderColor: '#1E3A8A',
                      backgroundColor: getCategoryColor(type),
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
                  onMouseEnter={() => setHoveredSuggestion(item.id)}
                  onMouseLeave={() => setHoveredSuggestion(null)}
                  onClick={() => handleSuggestionClick(type, item)}
                >
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#1E3A8A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                        color: 'white'
                      }}
                    >
                      {getCategoryIcon(type)}
                    </Box>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        lineHeight: 1.3,
                        mb: 0.5,
                        color: '#1E3A8A',
                        minHeight: '2.6em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.nombre}
                    </Typography>
                    
                    {/* Mostrar descripcion si esta disponible */}
                    {item.descripcion && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.7rem',
                          color: '#6B7280',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          mb: 0.5,
                          display: 'block',
                          maxHeight: '2.4em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={item.descripcion}
                      >
                        {item.descripcion.length > 60 ? `${item.descripcion.substring(0, 60)}...` : item.descripcion}
                      </Typography>
                    )}
                    
                    <Box display="flex" gap={0.5} justifyContent="center" alignItems="center" flexWrap="wrap">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: getConfidenceColor(item.confianza)
                        }}
                        title={`${(item.confianza * 100).toFixed(0)}% de relevancia`}
                      />
                      {item.categoria && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                        >
                          {item.categoria}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: getConfidenceColor(item.confianza),
                          fontWeight: 600
                        }}
                      >
                        {(item.confianza * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Indicador de seleccion - Comparar por nombre */}
                  {((type === 'amenazas' && selectedThreat && item.nombre === selectedThreat) ||
                   (type === 'vulnerabilidades' && selectedVulnerability && item.nombre === selectedVulnerability)) ? (
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
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                  ) : null}
                </Paper>
              </Tooltip>
            </Zoom>
          ))}
        </Box>
      </Box>
    );
  };

  const tipoActivo = typeof assetType === 'string' ? assetType : (assetType?.tipo || assetType?.Tipo_Activo || 'Activo');
  const nombreActivo = typeof assetType === 'object' ? (assetType?.Nombre || assetType?.nombre || '') : '';

  return (
    <Card sx={{ height: '100%', border: '1px solid #E5E7EB' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 1, fontWeight: 600 }}>
            Sugerencias Basadas en el Activo
          </Typography>
          {nombreActivo && (
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
              <strong>Activo:</strong> {nombreActivo}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
            <strong>Tipo:</strong> {tipoActivo}
          </Typography>
          <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '0.875rem' }}>
            <Typography variant="body2">
              Estas sugerencias provienen de evaluaciones previas de activos similares en la base de datos. 
              <strong> Haz clic para seleccionar</strong> y auto-completar el formulario.
            </Typography>
          </Alert>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Cargando sugerencias desde la base de datos...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {showCategories.includes('amenazas') && (
                <Grid  size={{ xs: 12 }}>
                  {renderSuggestionBubbles('amenazas', suggestions.amenazas)}
                </Grid>
              )}
              
              {showCategories.includes('vulnerabilidades') && (
                <Grid  size={{ xs: 12 }}>
                  {renderSuggestionBubbles('vulnerabilidades', suggestions.vulnerabilidades)}
                </Grid>
              )}
              
              {showCategories.includes('controles') && (
                <Grid  size={{ xs: 12 }}>
                  {renderSuggestionBubbles('controles', suggestions.controles)}
                </Grid>
              )}
              
              {suggestions.amenazas.length === 0 && suggestions.vulnerabilidades.length === 0 && suggestions.controles.length === 0 && (
                <Grid  size={{ xs: 12 }}>
                  <Alert severity="warning" sx={{ borderRadius: '8px' }}>
                    <Typography variant="body2">
                      No se encontraron sugerencias en la base de datos para este tipo de activo. 
                      Puedes crear nuevas amenazas y vulnerabilidades escribiendo en los campos del formulario.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
        
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E5E7EB' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            <strong>💡 Cómo usar:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Haz clic en cualquier sugerencia para auto-completar el campo correspondiente en el formulario principal.
            Las sugerencias estan basadas en datos reales de la base de datos.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InteractiveSuggestions;





