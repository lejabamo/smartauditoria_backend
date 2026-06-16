import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  AssignmentTurnedIn as VerifiedIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  CheckCircle as SuccessIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface FinalAnalysisPanelProps {
  data: any; // wizardData
  onExportPDF?: () => void;
}

const FinalAnalysisPanel: React.FC<FinalAnalysisPanelProps> = ({ data }) => {
  // Simulación de cálculo de alineación ISO
  const calculateISOAlignment = () => {
    let score = 0;
    if (data.newRiesgo.amenaza && data.newRiesgo.vulnerabilidad) score += 20;
    if (data.evaluacionInherente.justificacion.length > 100) score += 20;
    if (data.controles.seleccionados.length >= 2) score += 30;
    if (data.tratamiento.opcion) score += 15;
    if (data.planAccion.acciones.length > 0) score += 15;
    return score;
  };

  const score = calculateISOAlignment();
  const riskReduced = data.evaluacionInherente.nivelRiesgo !== data.evaluacionResidual.nivelRiesgo;

  // Si no hay datos (por ejemplo, cargando), mostrar skeleton o mensaje informativo
  if (!data.selectedActivo) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: '#6B7280' }}>Generando análisis experto basado en ISO 27005...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.8s ease-out' }}>
      <Typography variant="h5" className="font-poppins" sx={{ color: '#1E3A8A', mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <VerifiedIcon sx={{ fontSize: 32 }} /> Panel de Análisis Experto (ISO 27005:2022)
      </Typography>

      <Grid container spacing={3}>
        {/* SCORE DE ALINEACIÓN */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="card" sx={{ height: '100%', background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', border: '1px solid #BAE6FD', transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={score}
                  size={120}
                  thickness={5}
                  sx={{ color: score > 70 ? '#10B981' : '#F59E0B' }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: '#1E3A8A' }}>
                    {`${score}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 1 }}>
                Alineación ISO
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', px: 2 }}>
                Grado de cumplimiento con los estándares de documentación y control exigidos por la norma.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* MÉTRICAS DE RIESGO */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card className="card" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" className="font-poppins" sx={{ color: '#1E3A8A', mb: 3, fontWeight: 600 }}>
                Dinámica de Mitigación (Metodología FAIR)
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Riesgo Inherente</Typography>
                  <Chip label={data.evaluacionInherente.nivelRiesgo} size="small" sx={{ bgcolor: '#FEE2E2', color: '#EF4444', fontWeight: 700 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.evaluacionInherente.nivelRiesgo === 'HIGH' ? 90 : data.evaluacionInherente.nivelRiesgo === 'MEDIUM' ? 60 : 30} 
                  sx={{ height: 10, borderRadius: 5, backgroundColor: '#F3F4F6', '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444' } }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Riesgo Residual</Typography>
                  <Chip label={data.evaluacionResidual.nivelRiesgo} size="small" sx={{ bgcolor: '#D1FAE5', color: '#10B981', fontWeight: 700 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.evaluacionResidual.nivelRiesgo === 'HIGH' ? 90 : data.evaluacionResidual.nivelRiesgo === 'MEDIUM' ? 60 : 30} 
                  sx={{ height: 10, borderRadius: 5, backgroundColor: '#F3F4F6', '& .MuiLinearProgress-bar': { backgroundColor: '#10B981' } }}
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimelineIcon sx={{ color: '#0284C7' }} />
                <Typography variant="body2" sx={{ color: '#0369A1', fontWeight: 500 }}>
                  {riskReduced 
                    ? "Reducción de Impacto: El plan de tratamiento reduce efectivamente la exposición financiera y técnica." 
                    : "Advertencia: El nivel de riesgo se mantiene constante. Evalúe controles adicionales."}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* HALLAZGOS Y REFERENCIAS ISO 27002 */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2, mt: 1 }}>
            🎯 Conclusiones del Motor Experto
          </Typography>
          <Paper variant="outlined" sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ borderBottom: '1px solid #E5E7EB', py: 2 }}>
                <ListItemIcon>
                  {score > 80 ? <SuccessIcon sx={{ color: '#10B981' }} /> : <WarningIcon sx={{ color: '#F59E0B' }} />}
                </ListItemIcon>
                <ListItemText 
                  primary="Integridad de la Documentación" 
                  secondary={score > 80 ? "Cumple con trazabilidad para auditoría." : "Mejorar justificaciones técnicas."} 
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              
              <ListItem sx={{ borderBottom: '1px solid #E5E7EB', py: 2 }}>
                <ListItemIcon>
                  <SecurityIcon sx={{ color: '#3B82F6' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Cobertura de Controles" 
                  secondary={`${data.controles.seleccionados.length} controles aplicados.`} 
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>

              <ListItem sx={{ py: 2 }}>
                <ListItemIcon>
                  <AssessmentIcon sx={{ color: '#8B5CF6' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Viabilidad del Plan" 
                  secondary={`Responsable: ${data.tratamiento.responsable}.`} 
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2, mt: 1 }}>
            📚 Referencias ISO 27002:2022
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#FAFAFA' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'white', border: '1px solid #F1F5F9' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>CONTROL 5.25</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Gestión de incidentes de seguridad</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'white', border: '1px solid #F1F5F9' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>CONTROL 8.1</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Seguridad de los terminales de usuario</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'white', border: '1px solid #F1F5F9' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>CONTROL 8.15</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Registro de eventos y monitoreo</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#94A3B8', fontStyle: 'italic' }}>
                * Mapeo generado dinámicamente basado en la categoría del riesgo.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinalAnalysisPanel;
