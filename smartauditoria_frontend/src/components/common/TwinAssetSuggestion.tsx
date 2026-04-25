import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ContentCopy as CloneIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Computer as ComputerIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';

interface TwinAsset {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  criticidad: string;
  ultimaEvaluacion: string;
  nivelRiesgo: string;
  similitud: number;
  evaluacionExistente: {
    amenaza: string;
    vulnerabilidad: string;
    controles: string[];
    justificacion: string;
  };
}

interface TwinAssetSuggestionProps {
  currentAsset: {
    nombre: string;
    tipo: string;
    descripcion: string;
  };
  onCloneEvaluation?: (twinAsset: TwinAsset) => void;
}

const TwinAssetSuggestion: React.FC<TwinAssetSuggestionProps> = ({
  currentAsset,
  onCloneEvaluation
}) => {
  const [twinAssets, setTwinAssets] = useState<TwinAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTwin, setSelectedTwin] = useState<TwinAsset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadTwinAssets = async () => {
    setIsLoading(true);
    
    try {
      // Obtener ID del activo actual si esta disponible
      const activoId = (currentAsset as any).ID_Activo || (currentAsset as any).id;
      
      if (!activoId) {
        console.warn('No se pudo obtener ID del activo para buscar similares');
        setTwinAssets([]);
        setIsLoading(false);
        return;
      }

      // Llamar al endpoint real del backend
      const { apiRequest } = await import('../../services/api');
      const response = (await apiRequest('/evaluacion-riesgos/activos-similares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activo_id: activoId,
          tipo_activo: currentAsset.tipo,
          nombre_activo: currentAsset.nombre
        })
      })) as any;

      if (response.success && response.activos) {
        // Filtrar activos con similitud > 0.5 y convertir al formato esperado
        const similarAssets: TwinAsset[] = response.activos
          .filter((asset: any) => asset.similitud >= 0.5)
          .map((asset: any) => ({
            id: asset.id,
            nombre: asset.nombre,
            tipo: asset.tipo,
            descripcion: asset.descripcion,
            criticidad: asset.criticidad,
            ultimaEvaluacion: asset.ultimaEvaluacion,
            nivelRiesgo: asset.nivelRiesgo,
            similitud: asset.similitud,
            evaluacionExistente: asset.evaluacionExistente
          }));

        setTwinAssets(similarAssets);
      } else {
        setTwinAssets([]);
      }
    } catch (error) {
      console.error('Error loading twin assets:', error);
      setTwinAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloneEvaluation = (twinAsset: TwinAsset) => {
    setSelectedTwin(twinAsset);
    setIsDialogOpen(true);
  };

  const confirmClone = () => {
    if (selectedTwin && onCloneEvaluation) {
      onCloneEvaluation(selectedTwin);
    }
    setIsDialogOpen(false);
    setSelectedTwin(null);
  };

  const getAssetIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'servidor': return <ComputerIcon />;
      case 'base de datos': return <StorageIcon />;
      case 'aplicacion': return <CloudIcon />;
      default: return <ComputerIcon />;
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

  const getCriticityColor = (criticidad: string) => {
    switch (criticidad.toLowerCase()) {
      case 'critica': return '#D32F2F';
      case 'alta': return '#F57C00';
      case 'media': return '#FFC107';
      case 'baja': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  useEffect(() => {
    loadTwinAssets();
  }, [currentAsset]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Buscando activos similares...
        </Typography>
      </Box>
    );
  }

  if (twinAssets.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          No se encontraron activos similares con evaluaciones previas.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center">
          <InfoIcon sx={{ mr: 1 }} />
          <Typography variant="body2">
            <strong>Â¡Encontramos {twinAssets.length} activo(s) similar(es) con evaluaciones previas!</strong>
            <br />
            Puedes clonar la evaluacion existente para acelerar el proceso.
          </Typography>
        </Box>
      </Alert>

      <Grid container spacing={2}>
        {twinAssets.map((twin) => (
          <Grid key={twin.id} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', border: '2px solid #E3F2FD' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {getAssetIcon(twin.tipo)}
                  <Typography variant="h6" sx={{ ml: 1, color: '#1E3A8A', fontWeight: 'bold' }}>
                    {twin.nombre}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {twin.descripcion}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  <Chip
                    label={`${(twin.similitud * 100).toFixed(0)}% Similitud`}
                    size="small"
                    sx={{ backgroundColor: '#1E3A8A', color: 'white' }}
                  />
                  <Chip
                    label={twin.criticidad}
                    size="small"
                    sx={{ 
                      backgroundColor: getCriticityColor(twin.criticidad),
                      color: 'white'
                    }}
                  />
                  <Chip
                    label={twin.nivelRiesgo}
                    size="small"
                    sx={{ 
                      backgroundColor: getRiskLevelColor(twin.nivelRiesgo),
                      color: 'white'
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Ãšltima evaluacion:</strong> {twin.ultimaEvaluacion}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#1E3A8A', mb: 1 }}>
                    Evaluacion Existente:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Amenaza:</strong> {twin.evaluacionExistente.amenaza}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Vulnerabilidad:</strong> {twin.evaluacionExistente.vulnerabilidad}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Controles:</strong> {twin.evaluacionExistente.controles.join(', ')}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<CloneIcon />}
                  onClick={() => handleCloneEvaluation(twin)}
                  fullWidth
                  sx={{
                    backgroundColor: '#4CAF50',
                    '&:hover': { backgroundColor: '#45A049' }
                  }}
                >
                  Clonar Evaluacion
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de confirmacion de clonacion */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CloneIcon sx={{ mr: 1, color: '#4CAF50' }} />
            Confirmar Clonacion de Evaluacion
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedTwin && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Â¿Estas seguro de que quieres clonar la evaluacion de "{selectedTwin.nombre}"?</strong>
                  <br />
                  Esto copiara la amenaza, vulnerabilidad, controles y justificacion a tu evaluacion actual.
                </Typography>
              </Alert>

              <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>
                Detalles de la Evaluacion a Clonar:
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Amenaza"
                    secondary={selectedTwin.evaluacionExistente.amenaza}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vulnerabilidad"
                    secondary={selectedTwin.evaluacionExistente.vulnerabilidad}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Controles"
                    secondary={selectedTwin.evaluacionExistente.controles.join(', ')}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                <strong>Justificacion:</strong> {selectedTwin.evaluacionExistente.justificacion}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmClone}
            variant="contained"
            startIcon={<CloneIcon />}
            sx={{ backgroundColor: '#4CAF50' }}
          >
            Confirmar Clonacion
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwinAssetSuggestion;








