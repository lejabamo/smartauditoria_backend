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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Shield as ShieldIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiRequest } from '../../services/api';

interface ThreatSuggestion {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  confianza: number;
  controles_sugeridos: string[];
  vulnerabilidades_relacionadas: string[];
}

interface VulnerabilitySuggestion {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  confianza: number;
  controles_mitigadores: string[];
  amenazas_relacionadas: string[];
}

interface ControlSuggestion {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  confianza: number;
  implementacion: string;
  prioridad: number;
}

interface PredictiveSuggestionPanelProps {
  assetType: string;
  context?: string;
  onSuggestionSelect?: (suggestion: any) => void;
}

const PredictiveSuggestionPanel: React.FC<PredictiveSuggestionPanelProps> = ({
  assetType,
  context = '',
  onSuggestionSelect
}) => {
  const [suggestions, setSuggestions] = useState<{
    amenazas: ThreatSuggestion[];
    vulnerabilidades: VulnerabilitySuggestion[];
    controles: ControlSuggestion[];
  }>({
    amenazas: [],
    vulnerabilidades: [],
    controles: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const [selectedVulnerability, setSelectedVulnerability] = useState<string | null>(null);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = (await apiRequest('/predictive/suggestions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_type: assetType,
          context: context
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

  const loadVulnerabilities = async (threatId: string) => {
    try {
      const response = (await apiRequest('/predictive/suggestions/vulnerabilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threat_id: threatId,
          asset_type: assetType
        })
      })) as any;

      if (response.success) {
        setSuggestions(prev => ({
          ...prev,
          vulnerabilidades: response.suggestions
        }));
      }
    } catch (err) {
      console.error('Error loading vulnerabilities:', err);
    }
  };

  const loadControls = async (threatId: string, vulnerabilityId: string) => {
    try {
      const response = (await apiRequest('/predictive/suggestions/controls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threat_id: threatId,
          vulnerability_id: vulnerabilityId,
          asset_type: assetType
        })
      })) as any;

      if (response.success) {
        setSuggestions(prev => ({
          ...prev,
          controles: response.suggestions
        }));
      }
    } catch (err) {
      console.error('Error loading controls:', err);
    }
  };

  const handleThreatSelect = (threat: ThreatSuggestion) => {
    setSelectedThreat(threat.id);
    setSelectedVulnerability(null);
    loadVulnerabilities(threat.id);
    
    if (onSuggestionSelect) {
      onSuggestionSelect({ type: 'threat', data: threat });
    }
  };

  const handleVulnerabilitySelect = (vulnerability: VulnerabilitySuggestion) => {
    setSelectedVulnerability(vulnerability.id);
    
    if (selectedThreat) {
      loadControls(selectedThreat, vulnerability.id);
    }
    
    if (onSuggestionSelect) {
      onSuggestionSelect({ type: 'vulnerability', data: vulnerability });
    }
  };

  const handleControlSelect = (control: ControlSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect({ type: 'control', data: control });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'error';
    if (priority >= 3) return 'warning';
    return 'success';
  };

  useEffect(() => {
    if (assetType) {
      loadSuggestions();
    }
  }, [assetType]); // Removemos context de las dependencias para evitar bucles

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando sugerencias basadas en ISO 27002/27005...
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A' }}>
          Sugerencias Predictivas ISO 27002/27005
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSuggestions}
          size="small"
        >
          Actualizar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Amenazas */}
        <Grid  size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ color: '#1E3A8A', mr: 1 }} />
                <Typography variant="h6" className="font-poppins">
                  Amenazas Sugeridas
                </Typography>
              </Box>
              
              {suggestions.amenazas.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay amenazas sugeridas
                </Typography>
              ) : (
                <List>
                  {suggestions.amenazas.map((threat) => (
                    <ListItem
                      key={threat.id}
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton
                        onClick={() => handleThreatSelect(threat)}
                        selected={selectedThreat === threat.id}
                        sx={{
                          borderRadius: 1,
                          '&.Mui-selected': {
                            backgroundColor: '#E3F2FD'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <SecurityIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={threat.nombre}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {threat.descripcion}
                              </Typography>
                              <Box display="flex" gap={1} mt={1}>
                                <Chip
                                  label={`${(threat.confianza * 100).toFixed(0)}%`}
                                  size="small"
                                  color={getConfidenceColor(threat.confianza)}
                                />
                                <Chip
                                  label={threat.categoria}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vulnerabilidades */}
        <Grid  size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BugReportIcon sx={{ color: '#1E3A8A', mr: 1 }} />
                <Typography variant="h6" className="font-poppins">
                  Vulnerabilidades
                </Typography>
              </Box>
              
              {suggestions.vulnerabilidades.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Selecciona una amenaza para ver vulnerabilidades
                </Typography>
              ) : (
                <List>
                  {suggestions.vulnerabilidades.map((vulnerability) => (
                    <ListItem
                      key={vulnerability.id}
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton
                        onClick={() => handleVulnerabilitySelect(vulnerability)}
                        selected={selectedVulnerability === vulnerability.id}
                        sx={{
                          borderRadius: 1,
                          '&.Mui-selected': {
                            backgroundColor: '#E3F2FD'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <BugReportIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={vulnerability.nombre}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {vulnerability.descripcion}
                              </Typography>
                              <Box display="flex" gap={1} mt={1}>
                                <Chip
                                  label={`${(vulnerability.confianza * 100).toFixed(0)}%`}
                                  size="small"
                                  color={getConfidenceColor(vulnerability.confianza)}
                                />
                                <Chip
                                  label={vulnerability.categoria}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Controles */}
        <Grid  size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ShieldIcon sx={{ color: '#1E3A8A', mr: 1 }} />
                <Typography variant="h6" className="font-poppins">
                  Controles Sugeridos
                </Typography>
              </Box>
              
              {suggestions.controles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Selecciona amenaza y vulnerabilidad para ver controles
                </Typography>
              ) : (
                <List>
                  {suggestions.controles.map((control, index) => (
                    <ListItem
                      key={`predictive-control-${control.id}-${index}`}
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton
                        onClick={() => handleControlSelect(control)}
                        sx={{
                          borderRadius: 1,
                        }}
                      >
                        <ListItemIcon>
                          <ShieldIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={control.titulo}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {control.descripcion}
                              </Typography>
                              <Box display="flex" gap={1} mt={1}>
                                <Chip
                                  label={`${(control.confianza * 100).toFixed(0)}%`}
                                  size="small"
                                  color={getConfidenceColor(control.confianza)}
                                />
                                <Chip
                                  label={`P${control.prioridad}`}
                                  size="small"
                                  color={getPriorityColor(control.prioridad)}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                {control.implementacion}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumen de selecciones */}
      {(selectedThreat || selectedVulnerability) && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" className="font-poppins" mb={2}>
              Resumen de Selecciones
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {selectedThreat && (
                <Chip
                  label={`Amenaza: ${suggestions.amenazas.find(t => t.id === selectedThreat)?.nombre}`}
                  color="primary"
                  icon={<SecurityIcon />}
                />
              )}
              {selectedVulnerability && (
                <Chip
                  label={`Vulnerabilidad: ${suggestions.vulnerabilidades.find(v => v.id === selectedVulnerability)?.nombre}`}
                  color="secondary"
                  icon={<BugReportIcon />}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PredictiveSuggestionPanel;
