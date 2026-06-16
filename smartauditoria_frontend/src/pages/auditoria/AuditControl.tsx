import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  FactCheck as FactCheckIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import ConversationalAuditor from '../../components/common/ConversationalAuditor';

interface Auditoria {
  id: string;
  titulo: string;
  fecha: string;
  estado: 'Planificada' | 'En Proceso' | 'Finalizada';
  auditor: string;
  hallazgos: number;
}

interface Hallazgo {
  id: string;
  tipo: 'No Conformidad' | 'Observación' | 'Oportunidad de Mejora';
  severidad: 'Crítica' | 'Mayor' | 'Menor';
  descripcion: string;
  requisito: string;
  estado: 'Abierto' | 'En Análisis' | 'Cerrado';
}

const AuditControl: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openAuditDialog, setOpenAuditDialog] = useState(false);
  const [openHallazgoDialog, setOpenHallazgoDialog] = useState(false);

  // Datos de ejemplo para visualizar el control institucional
  const [auditorias] = useState<Auditoria[]>([
    { id: 'AUD-2026-001', titulo: 'Auditoría Interna ISO 27001 - Q1', fecha: '2026-03-15', estado: 'Finalizada', auditor: 'Leonardo Bastidas', hallazgos: 3 },
    { id: 'AUD-2026-002', titulo: 'Revisión Técnica Controles de Acceso', fecha: '2026-04-20', estado: 'En Proceso', auditor: 'Agente IA Auditor', hallazgos: 1 },
  ]);

  const [hallazgos] = useState<Hallazgo[]>([
    { id: 'NC-001', tipo: 'No Conformidad', severidad: 'Mayor', descripcion: 'Falta de evidencia en la revisión mensual de logs de firewall.', requisito: 'ISO 27001 - A.12.4.1', estado: 'En Análisis' },
    { id: 'OBS-002', tipo: 'Observación', severidad: 'Menor', descripcion: 'La política de contraseñas no se ha actualizado con los nuevos estándares NIST.', requisito: 'ISO 27001 - A.9.4.3', estado: 'Abierto' },
  ]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Finalizada': case 'Cerrado': return 'success';
      case 'En Proceso': case 'En Análisis': return 'warning';
      case 'Planificada': case 'Abierto': return 'primary';
      default: return 'default';
    }
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'Crítica': return 'error';
      case 'Mayor': return 'warning';
      case 'Menor': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <ConversationalAuditor 
        message="Bienvenido al Módulo de Control de Auditoría. Aquí podrá gestionar el cumplimiento normativo, registrar No Conformidades y realizar el seguimiento a los planes de acción correctiva."
        isTyping={false}
        sentiment="neutral"
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Control de Auditoría y Cumplimiento
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenAuditDialog(true)}
          sx={{ borderRadius: 2, px: 3, bgcolor: '#1e3a8a' }}
        >
          Nueva Auditoría
        </Button>
      </Stack>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab icon={<FactCheckIcon />} label="Auditorías" />
        <Tab icon={<WarningIcon />} label="No Conformidades / Hallazgos" />
        <Tab icon={<AssessmentIcon />} label="Análisis y Planes de Acción" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID Auditoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Título / Alcance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Auditor Responsable</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Hallazgos</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditorias.map((audit) => (
                <TableRow key={audit.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{audit.id}</TableCell>
                  <TableCell>{audit.titulo}</TableCell>
                  <TableCell>{audit.fecha}</TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>
                    <Chip label={audit.estado} color={getEstadoColor(audit.estado) as any} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{audit.hallazgos}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver Detalles">
                      <IconButton size="small"><VisibilityIcon color="primary" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small"><EditIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {hallazgos.map((hallazgo) => (
            <Grid size={{ xs: 12, md: 6 }} key={hallazgo.id}>
              <Card sx={{ borderRadius: 3, borderLeft: `6px solid ${hallazgo.tipo === 'No Conformidad' ? '#ef4444' : '#f59e0b'}` }}>
                <CardHeader 
                  title={hallazgo.id}
                  subheader={hallazgo.requisito}
                  action={
                    <Chip label={hallazgo.severidad} color={getSeveridadColor(hallazgo.severidad) as any} size="small" />
                  }
                />
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 2 }}>{hallazgo.descripcion}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">Estado:</Typography>
                    <Chip label={hallazgo.estado} variant="outlined" size="small" color={getEstadoColor(hallazgo.estado) as any} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenHallazgoDialog(true)}>
              Registrar Nuevo Hallazgo
            </Button>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Seguimiento a Planes de Acción</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Se han identificado 2 planes de acción pendientes de cierre real. El avatar de seguridad recomienda priorizar el análisis de causa raíz para NC-001.
          </Alert>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Plan de Acción: NC-001</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Acción: Implementar script de recolección automática de logs y revisión semanal automatizada por el motor RAG.
            </Typography>
            <Box sx={{ width: '100%', mb: 1 }}>
              <LinearProgress variant="determinate" value={65} sx={{ height: 10, borderRadius: 5 }} />
            </Box>
            <Typography variant="caption">Progreso: 65% - Fecha límite: 2026-05-15</Typography>
          </Paper>
        </Box>
      )}

      {/* Diálogos (Placeholders para funcionalidad futura) */}
      <Dialog open={openAuditDialog} onClose={() => setOpenAuditDialog(false)}>
        <DialogTitle>Planificar Nueva Auditoría</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Título de la Auditoría" fullWidth />
            <TextField label="Auditor Responsable" fullWidth />
            <TextField label="Fecha de Inicio" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Alcance / Descripción" multiline rows={4} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAuditDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => setOpenAuditDialog(false)}>Guardar Plan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditControl;
