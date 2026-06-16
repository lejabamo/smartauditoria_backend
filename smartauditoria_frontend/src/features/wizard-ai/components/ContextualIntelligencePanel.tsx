/**
 * Componente: ContextualIntelligencePanel
 * 
 * Muestra el panel de "Activos Gemelos" y métricas históricas.
 * Diseño premium con transiciones suaves y visualización clara de similitud.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  IconButton,
  Fade,
  Stack,
  Button
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  ContentCopy as ContentCopyIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Compare as CompareIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import type { SimilarAsset } from '../domain/types';

interface ContextualIntelligencePanelProps {
  twinAssets: SimilarAsset[];
  loading: boolean;
  error: string | null;
  onAdoptEvaluation: (asset: SimilarAsset) => void;
}

const ContextualIntelligencePanel: React.FC<ContextualIntelligencePanelProps> = ({
  twinAssets,
  loading,
  error,
  onAdoptEvaluation
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 2 }}>
        <CircularProgress size={30} sx={{ color: '#1E3A8A' }} />
        <Typography variant="body2" color="text.secondary" className="font-poppins">
          Consultando base de conocimiento colectiva...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return null; // Silencioso en error para no romper la UX principal
  }

  if (twinAssets.length === 0) {
    return (
      <Card sx={{ bgcolor: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <InfoIcon sx={{ color: '#94A3B8', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" className="font-poppins">
            No se encontraron activos gemelos evaluados recientemente.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <AutoAwesomeIcon sx={{ color: '#3B82F6', fontSize: '1.2rem' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E3A8A' }} className="font-poppins">
          Inteligencia de Activos Gemelos
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }} className="font-roboto">
        He identificado activos con perfiles similares. Puedes usar sus evaluaciones como base técnica.
      </Typography>

      <Stack spacing={2}>
        {twinAssets.map((asset, index) => (
          <Fade in timeout={500 + index * 100} key={asset.id}>
            <Card 
              sx={{ 
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  borderColor: '#3B82F6'
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#3B82F6' }}>
                      <SecurityIcon sx={{ fontSize: '1.1rem' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B' }} className="font-poppins">
                        {asset.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {asset.tipo} • Similitud: {(asset.similitud * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Adoptar esta base técnica">
                    <IconButton 
                      size="small" 
                      onClick={() => onAdoptEvaluation(asset)}
                      sx={{ color: '#3B82F6', '&:hover': { bgcolor: '#EFF6FF' } }}
                    >
                      <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  <Chip 
                    label={asset.evaluacionExistente.nivelRiesgo} 
                    size="small" 
                    sx={{ 
                      height: '20px', 
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: asset.evaluacionExistente.nivelRiesgo === 'ALTO' || asset.evaluacionExistente.nivelRiesgo === 'HIGH' ? '#FEE2E2' : '#F1F5F9',
                      color: asset.evaluacionExistente.nivelRiesgo === 'ALTO' || asset.evaluacionExistente.nivelRiesgo === 'HIGH' ? '#EF4444' : '#64748B'
                    }} 
                  />
                  <Chip 
                    label={`${asset.evaluacionExistente.controles.length} Controles`} 
                    size="small" 
                    variant="outlined"
                    sx={{ height: '20px', fontSize: '0.65rem' }} 
                  />
                </Box>

                <Box sx={{ mt: 1.5, p: 1, bgcolor: '#F8FAFC', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#475569', display: 'block' }}>
                    "Amenaza: {asset.evaluacionExistente.amenaza}"
                  </Typography>
                </Box>
                
                <Button 
                  fullWidth 
                  size="small"
                  variant="text"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => onAdoptEvaluation(asset)}
                  sx={{ mt: 1, fontSize: '0.7rem', textTransform: 'none', color: '#3B82F6' }}
                >
                  Usar esta Evaluación como plantilla
                </Button>
              </CardContent>
            </Card>
          </Fade>
        ))}
      </Stack>
    </Box>
  );
};

export default ContextualIntelligencePanel;
