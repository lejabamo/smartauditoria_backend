import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  FactCheck as FactCheckIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import AuditorCopilot from '../../components/copilot/AuditorCopilot';
import type { ActionChip } from '../../services/copilotService';
import { auditoriasService } from '../../services/backend';
import { toast } from 'react-hot-toast';

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
  tipo: string;
  severidad: string;
  descripcion: string;
  requisito: string;
  estado: string;
}

const AuditControl: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);

  // Dialogs
  const [openAuditDialog, setOpenAuditDialog] = useState(false);
  const [openHallazgoDialog, setOpenHallazgoDialog] = useState(false);

  // New Audit Form Fields
  const [newAuditTitle, setNewAuditTitle] = useState("");
  const [newAuditDesc, setNewAuditDesc] = useState("");
  const [newAuditAuditor, setNewAuditAuditor] = useState("1");

  // New Hallazgo Form Fields
  const [newHallazgoAuditId, setNewHallazgoAuditId] = useState("");
  const [newHallazgoTipo, setNewHallazgoTipo] = useState("No Conformidad");
  const [newHallazgoSeveridad, setNewHallazgoSeveridad] = useState("Menor");
  const [newHallazgoRequisito, setNewHallazgoRequisito] = useState("");
  const [newHallazgoDesc, setNewHallazgoDesc] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const audits = await auditoriasService.getAll();
      const findings = await auditoriasService.getHallazgos();

      // Map APIAuditoria to local Auditoria interface
      const mappedAudits = audits.map((a: any) => ({
        id: a.id_auditoria?.toString() || 'AUD-N/A',
        titulo: a.titulo || 'Auditoría sin título',
        fecha: a.fecha_inicio ? a.fecha_inicio.substring(0, 10) : '2026-06-24',
        estado: (a.estado === 'En curso' ? 'En Proceso' : a.estado) || 'Planificada',
        auditor: a.id_auditor_responsable === 1 ? 'Leonardo Bastidas' : 'Agente IA Auditor',
        hallazgos: findings.filter((f: any) => f.id_auditoria === a.id_auditoria).length
      }));

      // Map APIHallazgo to local Hallazgo interface
      const mappedFindings = findings.map((f: any) => ({
        id: f.id_hallazgo?.toString() || 'NC-N/A',
        tipo: f.tipo_hallazgo || 'No Conformidad',
        severidad: f.severidad || 'Menor',
        descripcion: f.descripcion || '',
        requisito: f.requisito_iso || 'ISO 27001',
        estado: f.estado === 'Abierto' ? 'Abierto' : (f.estado === 'En progreso AC' ? 'En Análisis' : 'Cerrado')
      }));

      setAuditorias(mappedAudits);
      setHallazgos(mappedFindings);
    } catch (error) {
      console.error('Error loading auditorias:', error);
      toast.error('Error al cargar la información de auditorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAudit = async () => {
    if (!newAuditTitle || !newAuditDesc) {
      toast.error("Por favor complete el título y descripción");
      return;
    }

    try {
      await auditoriasService.create({
        titulo: newAuditTitle,
        descripcion: newAuditDesc,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date().toISOString(),
        estado: "Planificada",
        id_auditor_responsable: parseInt(newAuditAuditor) || 1
      });
      toast.success("Nueva auditoría planificada exitosamente");
      setOpenAuditDialog(false);
      setNewAuditTitle("");
      setNewAuditDesc("");
      loadData();
    } catch (e) {
      toast.error("Error al crear auditoría");
    }
  };

  const handleSaveHallazgo = async () => {
    if (!newHallazgoAuditId || !newHallazgoDesc || !newHallazgoRequisito) {
      toast.error("Por favor complete todos los campos del hallazgo");
      return;
    }

    try {
      await auditoriasService.createHallazgo({
        id_auditoria: parseInt(newHallazgoAuditId),
        descripcion: newHallazgoDesc,
        tipo_hallazgo: newHallazgoTipo,
        severidad: newHallazgoSeveridad,
        requisito_iso: newHallazgoRequisito,
        analisis_causa_raiz: ""
      });
      toast.success("Hallazgo registrado con éxito");
      setOpenHallazgoDialog(false);
      setNewHallazgoDesc("");
      setNewHallazgoRequisito("");
      loadData();
    } catch (e) {
      toast.error("Error al registrar el hallazgo");
    }
  };

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
      case 'Crítica': case 'Critica': return 'error';
      case 'Mayor': return 'warning';
      case 'Menor': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <AuditorCopilot
        context={{
          stepTitle: "Control de Auditoría y Cumplimiento",
          activeAuditTitle: auditorias.length > 0 ? auditorias[0].titulo : "Auditorías de Seguridad"
        }}
        initialMessage="Bienvenido al Módulo de Control de Auditoría. Como tu copiloto ISO/IEC 27001:2022, puedo ayudarte a analizar la causa raíz de No Conformidades (5 Porqués), sugerir controles mitigantes del Anexo A y estructurar planes de acción correctiva ejecutables."
        onActionChipClick={(chip: ActionChip) => {
          if (chip.action === 'APPLY_CONTROL' && chip.control_id) {
            setNewHallazgoRequisito(`ISO 27001:2022 - ${chip.control_id}`);
            setOpenHallazgoDialog(true);
          }
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, mt: 2 }}>
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
                  <TableCell sx={{ fontWeight: 'medium' }}>AUD-2026-{audit.id.padStart(3, '0')}</TableCell>
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
              {auditorias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No hay auditorías registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {hallazgos.map((hallazgo) => (
            <Grid size={{ xs: 12, md: 6 }} key={hallazgo.id}>
              <Card sx={{ borderRadius: 3, borderLeft: `6px solid ${hallazgo.tipo.includes('No Conformidad') ? '#ef4444' : '#f59e0b'}` }}>
                <CardHeader 
                  title={`Hallazgo NC-00${hallazgo.id}`}
                  subheader={hallazgo.requisito}
                  action={
                    <Chip label={hallazgo.severidad} color={getSeveridadColor(hallazgo.severidad) as any} size="small" />
                  }
                />
                <CardContent>
                  <Typography variant="body1" sx={{ mb: 2 }}>{hallazgo.descripcion}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Tipo:</Typography>
                    <Chip label={hallazgo.tipo} size="small" variant="outlined" />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">Estado:</Typography>
                    <Chip label={hallazgo.estado} variant="outlined" size="small" color={getEstadoColor(hallazgo.estado) as any} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {hallazgos.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
                No hay hallazgos registrados
              </Typography>
            </Grid>
          )}
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
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
            Se han identificado planes de acción sugeridos. El avatar de seguridad recomienda priorizar la automatización de la revisión de logs de seguridad.
          </Alert>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Plan de Acción General</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Acción: Implementar script de recolección automática de logs y revisión semanal automatizada por el motor RAG.
            </Typography>
            <Box sx={{ width: '100%', mb: 1 }}>
              <LinearProgress variant="determinate" value={65} sx={{ height: 10, borderRadius: 5 }} />
            </Box>
            <Typography variant="caption">Progreso: 65% - Fecha límite: 2026-08-30</Typography>
          </Paper>
        </Box>
      )}

      {/* Dialog para planificar Auditoria */}
      <Dialog open={openAuditDialog} onClose={() => setOpenAuditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Planificar Nueva Auditoría</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Título de la Auditoría" 
              value={newAuditTitle}
              onChange={(e) => setNewAuditTitle(e.target.value)}
              fullWidth 
              required
            />
            <FormControl fullWidth>
              <InputLabel>Auditor Responsable</InputLabel>
              <Select
                value={newAuditAuditor}
                label="Auditor Responsable"
                onChange={(e) => setNewAuditAuditor(e.target.value)}
              >
                <MenuItem value="1">Leonardo Bastidas (Senior)</MenuItem>
                <MenuItem value="2">Agente IA Auditor (RAG)</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Alcance / Descripción" 
              value={newAuditDesc}
              onChange={(e) => setNewAuditDesc(e.target.value)}
              multiline 
              rows={4} 
              fullWidth 
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAuditDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveAudit}>Guardar Plan</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para registrar Hallazgo */}
      <Dialog open={openHallazgoDialog} onClose={() => setOpenHallazgoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Nuevo Hallazgo</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Auditoría Asociada</InputLabel>
              <Select
                value={newHallazgoAuditId}
                label="Auditoría Asociada"
                onChange={(e) => setNewHallazgoAuditId(e.target.value)}
              >
                {auditorias.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tipo de Hallazgo</InputLabel>
              <Select
                value={newHallazgoTipo}
                label="Tipo de Hallazgo"
                onChange={(e) => setNewHallazgoTipo(e.target.value)}
              >
                <MenuItem value="No Conformidad">No Conformidad</MenuItem>
                <MenuItem value="Observacion">Observación</MenuItem>
                <MenuItem value="Oportunidad de Mejora">Oportunidad de Mejora</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Severidad</InputLabel>
              <Select
                value={newHallazgoSeveridad}
                label="Severidad"
                onChange={(e) => setNewHallazgoSeveridad(e.target.value)}
              >
                <MenuItem value="Crítica">Crítica</MenuItem>
                <MenuItem value="Mayor">Mayor</MenuItem>
                <MenuItem value="Menor">Menor</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Requisito ISO / Norma" 
              value={newHallazgoRequisito}
              onChange={(e) => setNewHallazgoRequisito(e.target.value)}
              fullWidth 
              required
            />
            <TextField 
              label="Descripción del Hallazgo" 
              value={newHallazgoDesc}
              onChange={(e) => setNewHallazgoDesc(e.target.value)}
              multiline 
              rows={4} 
              fullWidth 
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHallazgoDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveHallazgo}>Guardar Hallazgo</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditControl;
