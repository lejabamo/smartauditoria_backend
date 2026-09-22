import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
  Tooltip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  AutoAwesome as SparklesIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Shield as ShieldIcon,
  Business as OrgIcon,
  Person as PersonIcon,
  Lock as PhysicalIcon,
  Computer as TechIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { soaService, type ControlSoA, type SoAMetricas } from '../../services/backend';

export const SoAPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [controles, setControles] = useState<ControlSoA[]>([]);
  const [metricas, setMetricas] = useState<SoAMetricas | null>(null);
  const [selectedTema, setSelectedTema] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dialog de edición de control SoA
  const [editingControl, setEditingControl] = useState<ControlSoA | null>(null);
  const [editForm, setEditForm] = useState({
    aplica: true,
    estado_implementacion: 'Implementado',
    efectividad_control_evaluada: 'Alta',
    justificacion_no_aplicabilidad: '',
    documentacion_asociada_ref: '',
  });

  // Copilot Audit result
  const [copilotAuditResult, setCopilotAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchSoAData = async () => {
    try {
      setLoading(true);
      const res = await soaService.getSoA();
      setControles(res.controles);
      setMetricas(res.metricas);
    } catch (err: any) {
      console.error('Error fetching SoA:', err);
      toast.error('Error al cargar la Declaración de Aplicabilidad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoAData();
  }, []);

  const handleOpenEdit = (control: ControlSoA) => {
    setEditingControl(control);
    setEditForm({
      aplica: control.aplica,
      estado_implementacion: control.estado_implementacion,
      efectividad_control_evaluada: control.efectividad_control_evaluada || 'Alta',
      justificacion_no_aplicabilidad: control.justificacion_no_aplicabilidad || '',
      documentacion_asociada_ref: control.documentacion_asociada_ref || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingControl) return;
    try {
      await soaService.updateControl(editingControl.ID_Control, {
        aplica: editForm.aplica,
        estado_implementacion: editForm.aplica ? editForm.estado_implementacion : 'No Aplica',
        efectividad_control_evaluada: editForm.efectividad_control_evaluada,
        justificacion_no_aplicabilidad: editForm.justificacion_no_aplicabilidad,
        documentacion_asociada_ref: editForm.documentacion_asociada_ref,
      });

      toast.success(`Control ${editingControl.codigo_control_iso} actualizado exitosamente`);
      setEditingControl(null);
      await fetchSoAData();
    } catch (err: any) {
      console.error('Error actualizando control SoA:', err);
      toast.error('Error al actualizar el control');
    }
  };

  const handleToggleAplica = async (control: ControlSoA, newAplica: boolean) => {
    try {
      await soaService.updateControl(control.ID_Control, {
        aplica: newAplica,
        estado_implementacion: newAplica ? 'Parcialmente Implementado' : 'No Aplica',
        justificacion_no_aplicabilidad: newAplica ? '' : 'Control no aplicable según alcance del SGSI.',
      });
      toast.success(`Control ${control.codigo_control_iso}: ${newAplica ? 'Aplica' : 'No Aplica'}`);
      await fetchSoAData();
    } catch (err: any) {
      console.error('Error toggling aplica:', err);
      toast.error('No se pudo modificar la aplicabilidad');
    }
  };

  const handleRunCopilotAudit = async () => {
    try {
      setIsAuditing(true);
      const res = await soaService.copilotAudit();
      setCopilotAuditResult(res);
      toast.success('Auditoría agéntica SoA completada');
    } catch (err: any) {
      console.error('Error en auditoría Copilot SoA:', err);
      toast.error('No fue posible realizar la auditoría agéntica en este momento');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExportExcel = () => {
    if (!metricas) return;
    soaService.exportToExcel(controles, metricas);
    toast.success('Declaración de Aplicabilidad exportada a Excel');
  };

  // Filtrado
  const filteredControles = controles.filter((c) => {
    const matchTema = selectedTema === 'Todos' || c.categoria_control_iso === selectedTema;
    const matchSearch =
      searchTerm.trim() === '' ||
      c.codigo_control_iso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Descripcion && c.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchTema && matchSearch;
  });

  const getTemaIcon = (tema: string) => {
    switch (tema) {
      case 'Organizacional':
        return <OrgIcon sx={{ fontSize: 20, color: '#3B82F6' }} />;
      case 'Personas':
        return <PersonIcon sx={{ fontSize: 20, color: '#10B981' }} />;
      case 'Fisico':
        return <PhysicalIcon sx={{ fontSize: 20, color: '#F59E0B' }} />;
      case 'Tecnologico':
        return <TechIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />;
      default:
        return <ShieldIcon sx={{ fontSize: 20, color: '#64748B' }} />;
    }
  };

  const getEstadoChipProps = (estado: string) => {
    switch (estado) {
      case 'Implementado':
        return { label: 'Implementado', bg: '#DCFCE7', color: '#15803D' };
      case 'Parcialmente Implementado':
        return { label: 'Parcial', bg: '#FEF3C7', color: '#B45309' };
      case 'En Diseno':
      case 'En Prueba':
        return { label: estado, bg: '#EDE9FE', color: '#6D28D9' };
      case 'No Aplica':
        return { label: 'No Aplica', bg: '#F1F5F9', color: '#64748B' };
      default:
        return { label: 'No Implementado', bg: '#FEE2E2', color: '#B91C1C' };
    }
  };

  if (loading && !metricas) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <LinearProgress sx={{ borderRadius: 2, height: 6, mb: 2 }} />
        <Typography variant="body2" color="#64748B">
          Cargando catálogo oficial de 93 controles ISO/IEC 27002:2022...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* ── SECCIÓN SUPERIOR: METRICAS CLAVE POR TEMA ───────────────────── */}
      {metricas && (
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {/* Card 1: Cobertura Global */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                color: '#ffffff',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: 1 }}>
                  DECLARACIÓN DE APLICABILIDAD (SoA)
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, mb: 0.5 }}>
                  {metricas.porcentaje_implementacion}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Madurez de Implementación ({metricas.implementados} de {metricas.aplicables} aplicables)
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={metricas.porcentaje_implementacion}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#10B981' },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cards 2-5: Los 4 Temas de ISO 27002:2022 */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              {/* Cláusula 5: Organizacional */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <OrgIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={700} color="#1E293B">
                        Organizacional
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="#0F172A">
                      {metricas.por_tema.Organizacional?.porcentaje || 0}%
                    </Typography>
                    <Typography variant="caption" color="#64748B">
                      {metricas.por_tema.Organizacional?.implementados || 0} /{' '}
                      {(metricas.por_tema.Organizacional?.total || 0) - (metricas.por_tema.Organizacional?.no_aplica || 0)} controles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cláusula 6: Personas */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PersonIcon sx={{ color: '#10B981', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={700} color="#1E293B">
                        Personas
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="#0F172A">
                      {metricas.por_tema.Personas?.porcentaje || 0}%
                    </Typography>
                    <Typography variant="caption" color="#64748B">
                      {metricas.por_tema.Personas?.implementados || 0} /{' '}
                      {(metricas.por_tema.Personas?.total || 0) - (metricas.por_tema.Personas?.no_aplica || 0)} controles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cláusula 7: Físico */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PhysicalIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={700} color="#1E293B">
                        Físico
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="#0F172A">
                      {metricas.por_tema.Fisico?.porcentaje || 0}%
                    </Typography>
                    <Typography variant="caption" color="#64748B">
                      {metricas.por_tema.Fisico?.implementados || 0} /{' '}
                      {(metricas.por_tema.Fisico?.total || 0) - (metricas.por_tema.Fisico?.no_aplica || 0)} controles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cláusula 8: Tecnológico */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TechIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={700} color="#1E293B">
                        Tecnológico
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="#0F172A">
                      {metricas.por_tema.Tecnologico?.porcentaje || 0}%
                    </Typography>
                    <Typography variant="caption" color="#64748B">
                      {metricas.por_tema.Tecnologico?.implementados || 0} /{' '}
                      {(metricas.por_tema.Tecnologico?.total || 0) - (metricas.por_tema.Tecnologico?.no_aplica || 0)} controles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* ── DICTAMEN DE AUDITORÍA COPILOT IA (SI EXISTE) ─────────────────── */}
      {copilotAuditResult && (
        <Alert
          severity="info"
          icon={<SparklesIcon sx={{ color: '#7C3AED' }} />}
          sx={{
            mb: 3,
            borderRadius: 2.5,
            backgroundColor: '#F5F3FF',
            border: '1px solid #DDD6FE',
            color: '#4C1D95',
          }}
          action={
            <IconButton size="small" onClick={() => setCopilotAuditResult(null)} sx={{ color: '#6D28D9' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontWeight: 500 }}>
            {copilotAuditResult.dictamen_auditor}
          </Typography>
        </Alert>
      )}

      {/* ── BARRA DE HERRAMIENTAS Y FILTROS ──────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Tabs
            value={selectedTema}
            onChange={(_, val) => setSelectedTema(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 40,
                borderRadius: 2,
              },
            }}
          >
            <Tab label={`Todos (${controles.length})`} value="Todos" />
            <Tab label="Organizacional (37)" value="Organizacional" icon={<OrgIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Personas (8)" value="Personas" icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Físico (14)" value="Fisico" icon={<PhysicalIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Tecnológico (34)" value="Tecnologico" icon={<TechIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          </Tabs>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 240 }}
            />

            <Button
              variant="contained"
              startIcon={<SparklesIcon />}
              onClick={handleRunCopilotAudit}
              disabled={isAuditing}
              sx={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)',
              }}
            >
              {isAuditing ? 'Auditando...' : '✨ Auditar con Copilot IA'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                borderColor: '#10B981',
                color: '#047857',
                '&:hover': {
                  backgroundColor: '#ECFDF5',
                  borderColor: '#059669',
                },
              }}
            >
              Exportar SoA (.xlsx)
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── TABLA DE LOS 93 CONTROLES ISO/IEC 27002:2022 ─────────────────── */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, width: 90 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Control ISO 27002:2022</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 140 }}>Tema</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 110, textAlign: 'center' }}>¿Aplica?</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 150 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 110 }}>Efectividad</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Justificación / Evidencia</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 80, textAlign: 'center' }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredControles.map((control) => {
              const chipProps = getEstadoChipProps(control.estado_implementacion);
              return (
                <TableRow
                  key={control.ID_Control}
                  hover
                  sx={{
                    opacity: control.aplica ? 1 : 0.65,
                    backgroundColor: control.aplica ? 'transparent' : '#F8FAFC',
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, color: '#1E3A8A' }}>{control.codigo_control_iso}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#0F172A">
                      {control.Nombre}
                    </Typography>
                    <Typography variant="caption" color="#64748B" sx={{ display: 'block', maxWidth: 360 }}>
                      {control.Descripcion}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      {getTemaIcon(control.categoria_control_iso)}
                      <Typography variant="caption" fontWeight={600} color="#334155">
                        {control.categoria_control_iso}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Switch
                      size="small"
                      checked={control.aplica}
                      onChange={(e) => handleToggleAplica(control, e.target.checked)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={chipProps.label}
                      size="small"
                      sx={{
                        backgroundColor: chipProps.bg,
                        color: chipProps.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontWeight={600} color="#334155">
                      {control.efectividad_control_evaluada || 'Alta'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="#475569" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                      {control.aplica
                        ? control.documentacion_asociada_ref || 'Evidencia técnica conforme al SGSI'
                        : control.justificacion_no_aplicabilidad || 'Exclusión justificada'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="Editar aplicabilidad y justificación">
                      <IconButton size="small" onClick={() => handleOpenEdit(control)} sx={{ color: '#3B82F6' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── MODAL DE EDICIÓN DE CONTROL SOA ──────────────────────────────── */}
      {editingControl && (
        <Dialog open={true} onClose={() => setEditingControl(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', color: '#ffffff' }}>
            <Typography variant="h6" fontWeight={700}>
              Control {editingControl.codigo_control_iso}: {editingControl.Nombre}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Tema: {editingControl.categoria_control_iso} | Tipo: {editingControl.Tipo_Control}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 3 }}>
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>¿Aplica a la Organización?</InputLabel>
                    <Select
                      value={editForm.aplica ? 'SI' : 'NO'}
                      label="¿Aplica a la Organización?"
                      onChange={(e) => setEditForm((prev) => ({ ...prev, aplica: e.target.value === 'SI' }))}
                    >
                      <MenuItem value="SI">SÍ - Control Aplicable al SGSI</MenuItem>
                      <MenuItem value="NO">NO - Control Excluido del Alcance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small" disabled={!editForm.aplica}>
                    <InputLabel>Estado de Implementación</InputLabel>
                    <Select
                      value={editForm.estado_implementacion}
                      label="Estado de Implementación"
                      onChange={(e) => setEditForm((prev) => ({ ...prev, estado_implementacion: e.target.value }))}
                    >
                      <MenuItem value="Implementado">Implementado</MenuItem>
                      <MenuItem value="Parcialmente Implementado">Parcialmente Implementado</MenuItem>
                      <MenuItem value="En Diseno">En Diseño / Planificado</MenuItem>
                      <MenuItem value="En Prueba">En Prueba / Piloto</MenuItem>
                      <MenuItem value="No Implementado">No Implementado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    label={editForm.aplica ? 'Justificación de Inclusión y Alcance' : 'Justificación de No Aplicabilidad (Exclusión SoA)'}
                    value={editForm.justificacion_no_aplicabilidad}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, justificacion_no_aplicabilidad: e.target.value }))}
                    helperText="Requerido por la norma ISO 27001 para justificar por qué el control aplica o no en la entidad."
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Evidencia Documental o Procedimiento Asociado"
                    value={editForm.documentacion_asociada_ref}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, documentacion_asociada_ref: e.target.value }))}
                    placeholder="Ejemplo: Política de Control de Acceso v2.1, Manual de Procedimientos TI, Acta 2026..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={() => setEditingControl(null)} sx={{ textTransform: 'none', color: '#64748B' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              }}
            >
              Guardar Cambios SoA
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SoAPanel;
