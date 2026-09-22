import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  TableChart as ExcelIcon,
  PictureAsPdf as PdfIcon,
  AutoAwesome as CopilotIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  WarningAmber as WarningIcon,
  Description as DocumentIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  reportesService,
  type FilaMapaRiesgoDAFP,
  type KPIsMapaRiesgos,
  type CopilotMapaAnalysisResponse
} from '../../services/reportesService';

const getZoneColor = (zona: string) => {
  switch (zona?.toLowerCase()) {
    case 'extremo':
      return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' };
    case 'alto':
      return { bg: '#FFEDD5', text: '#9A3412', border: '#FB923C' };
    case 'moderado':
      return { bg: '#FEF9C3', text: '#854D0E', border: '#FACC15' };
    case 'bajo':
    default:
      return { bg: '#DCFCE7', text: '#166534', border: '#4ADE80' };
  }
};

const getTreatmentColor = (opcion: string) => {
  switch (opcion?.toLowerCase()) {
    case 'mitigar':
      return { bg: '#EFF6FF', text: '#1D4ED8' };
    case 'transferir':
      return { bg: '#FAF5FF', text: '#7E22CE' };
    case 'evitar':
      return { bg: '#FEF2F2', text: '#B91C1C' };
    case 'aceptar':
    default:
      return { bg: '#F3F4F6', text: '#374151' };
  }
};

export const MapaRiesgosDAFPView: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [filas, setFilas] = useState<FilaMapaRiesgoDAFP[]>([]);
  const [kpis, setKpis] = useState<KPIsMapaRiesgos | null>(null);
  const [copilotAnalysis, setCopilotAnalysis] = useState<CopilotMapaAnalysisResponse | null>(null);
  const [loadingCopilot, setLoadingCopilot] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroZonaInh, setFiltroZonaInh] = useState<string>('TODAS');
  const [filtroZonaRes, setFiltroZonaRes] = useState<string>('TODAS');
  const [filtroTratamiento, setFiltroTratamiento] = useState<string>('TODAS');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await reportesService.getMapaRiesgosDAFP();
      setFilas(res.filas || []);
      setKpis(res.kpis || null);
    } catch (err: any) {
      console.error('Error cargando mapa de riesgos DAFP:', err);
      toast.error('No se pudo cargar la matriz oficial de riesgos.');
    } finally {
      setLoading(false);
    }
  };

  const ejecutarCopilotAnalysis = async () => {
    try {
      setLoadingCopilot(true);
      const res = await reportesService.getCopilotAnalysis();
      setCopilotAnalysis(res);
      toast.success('Dictamen de auditoría Copilot generado.');
    } catch (err: any) {
      console.error('Error al analizar con Copilot:', err);
      toast.error('No fue posible generar el dictamen de Copilot.');
    } finally {
      setLoadingCopilot(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await reportesService.downloadMapaRiesgosExcel();
      toast.success('Matriz Excel DAFP V7 descargada exitosamente.');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      toast.error('Error al descargar el archivo Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header institucional
      doc.setFillColor(30, 58, 138); // #1E3A8A
      doc.rect(0, 0, pageWidth, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('SECRETARÍA DE EDUCACIÓN Y CULTURA DEL CAUCA - MIPG', 14, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(226, 232, 240);
      doc.text('MAPA OFICIAL DE RIESGOS DE SEGURIDAD DIGITAL (GUÍA INTEGRAL DAFP V7 / ISO 27005:2022)', 14, 16);

      // Metadatos
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')} | Total Riesgos: ${filas.length}`, 14, 28);

      let yPos = 34;

      // Resumen Ejecutivo de KPIs
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, yPos, pageWidth - 28, 18, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN EJECUTIVO DE IMPACTO INSTITUCIONAL:', 18, yPos + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const kpiText = `• Riesgos Evaluados: ${kpis?.total_riesgos || filas.length}  |  • Activos Críticos: ${kpis?.total_activos_unicos || 0}  |  • Reducción de Riesgo Crítico: ${kpis?.reduccion_riesgos_criticos_pct || 0}%  |  • Tratamiento Mitigar: ${kpis?.tratamientos?.Mitigar || 0}`;
      doc.text(kpiText, 18, yPos + 12);

      yPos += 24;

      // Tabla Simplificada de Riesgos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos, pageWidth - 28, 7, 'F');
      doc.setTextColor(30, 41, 59);

      doc.text('CÓDIGO', 16, yPos + 5);
      doc.text('ACTIVO (TRD / CID)', 35, yPos + 5);
      doc.text('EVENTO DE RIESGO', 85, yPos + 5);
      doc.text('ZONA INH.', 150, yPos + 5);
      doc.text('CONTROLES ISO 27002', 175, yPos + 5);
      doc.text('ZONA RES.', 225, yPos + 5);
      doc.text('TRATAMIENTO', 250, yPos + 5);

      yPos += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      filas.forEach((f) => {
        if (yPos > pageHeight - 15) {
          doc.addPage('landscape');
          yPos = 20;
        }

        doc.setTextColor(51, 65, 85);
        doc.text(f.codigo_riesgo, 16, yPos);
        doc.text(f.activo_nombre.substring(0, 26), 35, yPos);
        doc.text(f.evento_riesgo.substring(0, 36), 85, yPos);
        doc.text(f.zona_inherente, 150, yPos);
        doc.text(f.controles_aplicados_texto.substring(0, 26), 175, yPos);
        doc.text(f.zona_residual, 225, yPos);
        doc.text(f.opcion_tratamiento, 250, yPos);

        yPos += 6;
      });

      doc.save(`Informe_Ejecutivo_Mapa_Riesgos_DAFP_V7_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Informe PDF institucional generado exitosamente.');
    } catch (err) {
      console.error('Error generando PDF:', err);
      toast.error('Error al generar el informe PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Filtrado reactivo en cliente
  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      const matchSearch =
        searchTerm === '' ||
        f.activo_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.evento_riesgo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.codigo_riesgo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.proceso.toLowerCase().includes(searchTerm.toLowerCase());

      const matchZonaInh = filtroZonaInh === 'TODAS' || f.zona_inherente.toLowerCase() === filtroZonaInh.toLowerCase();
      const matchZonaRes = filtroZonaRes === 'TODAS' || f.zona_residual.toLowerCase() === filtroZonaRes.toLowerCase();
      const matchTratamiento =
        filtroTratamiento === 'TODAS' || f.opcion_tratamiento.toLowerCase() === filtroTratamiento.toLowerCase();

      return matchSearch && matchZonaInh && matchZonaRes && matchTratamiento;
    });
  }, [filas, searchTerm, filtroZonaInh, filtroZonaRes, filtroTratamiento]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, margin: '0 auto' }}>
      {/* Botón Volver & Encabezado */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reportes')}
          variant="outlined"
          size="small"
          sx={{ borderColor: '#CBD5E1', color: '#475569' }}
        >
          Volver a Reportes
        </Button>
      </Stack>

      {/* Banner Oficial Institucional */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #0369A1 100%)',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.25)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label="Guía DAFP Versión 7 (2025)"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                label="MIPG / Función Pública"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                label="ISO/IEC 27005:2022"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
              Mapa Oficial de Riesgos Institucional de Seguridad Digital
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 850 }}>
              Matriz oficial de identificación, evaluación inherente 5x5, controles mitigantes ISO 27002:2022,
              evaluación residual y plan de tratamiento institucional para la Secretaría de Educación y Cultura del Cauca.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={exportingExcel ? <CircularProgress size={16} color="inherit" /> : <ExcelIcon />}
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              sx={{
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Descargar Excel Oficial
            </Button>
            <Button
              variant="contained"
              startIcon={exportingPdf ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
              onClick={handleExportPDF}
              disabled={exportingPdf || loading}
              sx={{
                bgcolor: '#EF4444',
                '&:hover': { bgcolor: '#DC2626' },
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Exportar PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Riesgos Evaluados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                  {kpis.total_riesgos}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  Asociados a <strong>{kpis.total_activos_unicos}</strong> activos únicos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Reducción Riesgos Críticos
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  <TrendingDownIcon sx={{ color: '#10B981', fontSize: 32 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981' }}>
                    {kpis.reduccion_riesgos_criticos_pct}%
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  De {kpis.riesgos_criticos_inherentes} inherentes a {kpis.riesgos_criticos_residuales} residuales
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Distribución Residual (5x5)
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`Bajo: ${kpis.distribucion_residual.Bajo}`}
                    size="small"
                    sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
                  />
                  <Chip
                    label={`Mod: ${kpis.distribucion_residual.Moderado}`}
                    size="small"
                    sx={{ bgcolor: '#FEF9C3', color: '#854D0E', fontWeight: 700 }}
                  />
                  <Chip
                    label={`Alto: ${kpis.distribucion_residual.Alto}`}
                    size="small"
                    sx={{ bgcolor: '#FFEDD5', color: '#9A3412', fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
                  Zona Extrema Residual: <strong>{kpis.distribucion_residual.Extremo}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Estrategia Tratamiento
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`Mitigar: ${kpis.tratamientos.Mitigar}`}
                    size="small"
                    sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}
                  />
                  <Chip
                    label={`Transferir: ${kpis.tratamientos.Transferir}`}
                    size="small"
                    sx={{ bgcolor: '#FAF5FF', color: '#7E22CE', fontWeight: 700 }}
                  />
                  <Chip
                    label={`Aceptar: ${kpis.tratamientos.Aceptar}`}
                    size="small"
                    sx={{ bgcolor: '#F3F4F6', color: '#374151', fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
                  Controles ISO 27002:2022 articulados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Copilot Executive Audit Section */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid #C7D2FE',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CopilotIcon sx={{ color: '#4F46E5', fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E1B4B' }}>
                  Asistente Copilot: Dictamen Agéntico para Comité de Control Interno
                </Typography>
                <Typography variant="caption" sx={{ color: '#6366F1' }}>
                  Evaluación autónoma con IA sobre la reducción del riesgo institucional y cumplimiento DAFP V7
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={loadingCopilot ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={ejecutarCopilotAnalysis}
              disabled={loadingCopilot}
              sx={{ borderColor: '#6366F1', color: '#4F46E5', textTransform: 'none', fontWeight: 600 }}
            >
              {copilotAnalysis ? 'Actualizar Dictamen IA' : '💡 Generar Dictamen con IA'}
            </Button>
          </Stack>

          {copilotAnalysis ? (
            <Box>
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E0E7FF', mb: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#1E293B', lineHeight: 1.6 }}>
                  {copilotAnalysis.dictamen_ejecutivo}
                </Typography>
              </Paper>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {copilotAnalysis.action_chips?.map((chip, i) => (
                  <Chip
                    key={i}
                    label={chip.label}
                    onClick={() => {
                      if (chip.action === 'EXPORT_EXCEL') handleExportExcel();
                      if (chip.action === 'EXPORT_PDF') handleExportPDF();
                      if (chip.action === 'FILTER_CRITICAL') setFiltroZonaRes('MODERADO');
                    }}
                    clickable
                    sx={{ bgcolor: '#4F46E5', color: '#fff', fontWeight: 600, mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Haga clic en <strong>"Generar Dictamen con IA"</strong> para que el Copilot analice la concentración de
              riesgos y genere las observaciones para el Comité Institucional de Coordinación de Control Interno.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Barra de Filtros */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar por activo, riesgo, proceso o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: Servidor, R-SEG-01, Talento Humano"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Zona Inherente (5x5)"
              value={filtroZonaInh}
              onChange={(e) => setFiltroZonaInh(e.target.value)}
            >
              <MenuItem value="TODAS">Todas las Zonas</MenuItem>
              <MenuItem value="EXTREMO">Extremo</MenuItem>
              <MenuItem value="ALTO">Alto</MenuItem>
              <MenuItem value="MODERADO">Moderado</MenuItem>
              <MenuItem value="BAJO">Bajo</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Zona Residual (5x5)"
              value={filtroZonaRes}
              onChange={(e) => setFiltroZonaRes(e.target.value)}
            >
              <MenuItem value="TODAS">Todas las Zonas</MenuItem>
              <MenuItem value="EXTREMO">Extremo</MenuItem>
              <MenuItem value="ALTO">Alto</MenuItem>
              <MenuItem value="MODERADO">Moderado</MenuItem>
              <MenuItem value="BAJO">Bajo</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tratamiento DAFP"
              value={filtroTratamiento}
              onChange={(e) => setFiltroTratamiento(e.target.value)}
            >
              <MenuItem value="TODAS">Todos</MenuItem>
              <MenuItem value="MITIGAR">Mitigar</MenuItem>
              <MenuItem value="TRANSFERIR">Transferir</MenuItem>
              <MenuItem value="EVITAR">Evitar</MenuItem>
              <MenuItem value="ACEPTAR">Aceptar</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 0.5 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="Recargar Matriz">
              <IconButton onClick={cargarDatos} size="small" sx={{ color: '#475569' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Matriz Oficial DAFP V7 Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #CBD5E1', overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2, color: '#64748B' }}>
              Compilando el Mapa de Riesgos Institucional conforme a la Guía DAFP V7...
            </Typography>
          </Box>
        ) : filasFiltradas.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 600 }}>
              No se encontraron registros en el Mapa de Riesgos
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              No hay evaluaciones de riesgo que coincidan con los filtros seleccionados.
            </Typography>
          </Box>
        ) : (
          <Table size="small" aria-label="mapa-dafp-table">
            <TableHead sx={{ bgcolor: '#0F172A' }}>
              <TableRow>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700, width: 40 }} />
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700 }}>Proceso & Macroproceso</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700 }}>Activo de Información (DAFP V7)</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700 }}>Evento de Riesgo</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700, textAlign: 'center' }}>Zona Inherente</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700 }}>Controles ISO 27002</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700, textAlign: 'center' }}>Zona Residual</TableCell>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 700, textAlign: 'center' }}>Tratamiento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filasFiltradas.map((f) => {
                const isExpanded = expandedRow === f.id;
                const colInh = getZoneColor(f.zona_inherente);
                const colRes = getZoneColor(f.zona_residual);
                const colTrat = getTreatmentColor(f.opcion_tratamiento);

                return (
                  <React.Fragment key={f.id}>
                    <TableRow
                      hover
                      sx={{
                        cursor: 'pointer',
                        bgcolor: isExpanded ? '#F8FAFC' : 'inherit',
                        '&:hover': { bgcolor: '#F1F5F9' }
                      }}
                      onClick={() => setExpandedRow(isExpanded ? null : f.id)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1E3A8A' }}>{f.codigo_riesgo}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {f.proceso}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {f.macroproceso}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {f.activo_nombre}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                          <Chip label={f.activo_trd} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#E2E8F0' }} />
                          {f.es_iccn === 'SÍ' && (
                            <Chip label="ICCN" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }} />
                          )}
                          <Chip label={f.activo_clasificacion_ley1712} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#FEF3C7', color: '#92400E' }} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {f.evento_riesgo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {f.factor_riesgo}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={f.zona_inherente}
                          size="small"
                          sx={{
                            bgcolor: colInh.bg,
                            color: colInh.text,
                            border: `1px solid ${colInh.border}`,
                            fontWeight: 700,
                            minWidth: 80
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#334155', maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {f.controles_aplicados_texto}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
                          {f.cantidad_controles} control(es) ISO 27002
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={f.zona_residual}
                          size="small"
                          sx={{
                            bgcolor: colRes.bg,
                            color: colRes.text,
                            border: `1px solid ${colRes.border}`,
                            fontWeight: 700,
                            minWidth: 80
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={f.opcion_tratamiento}
                          size="small"
                          sx={{ bgcolor: colTrat.bg, color: colTrat.text, fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Fila Expansible con Detalle DAFP V7 */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, borderBottom: isExpanded ? '2px solid #CBD5E1' : 'none' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: '#F8FAFC' }}>
                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
                                    1. Análisis de Causa y Efecto (DAFP V7)
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Factor de Riesgo / Causa:</strong> {f.factor_riesgo}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Consecuencias:</strong> {f.consecuencias}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Tipo de Riesgo:</strong> {f.tipo_riesgo}
                                  </Typography>
                                </Paper>
                              </Grid>

                              <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369A1', mb: 1 }}>
                                    2. Justificación Técnica ISO 27005 (5x5)
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Inherente:</strong> {f.probabilidad_inherente_nombre} × {f.impacto_inherente_nombre} → <strong>{f.zona_inherente}</strong>
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1.5 }}>
                                    "{f.justificacion_inherente}"
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Residual:</strong> {f.probabilidad_residual_nombre} × {f.impacto_residual_nombre} → <strong>{f.zona_residual}</strong>
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                                    "{f.justificacion_residual}"
                                  </Typography>
                                </Paper>
                              </Grid>

                              <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7E22CE', mb: 1 }}>
                                    3. Plan de Tratamiento Institucional (MIPG)
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Opción de Tratamiento:</strong> {f.opcion_tratamiento}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Acciones Formuladas:</strong> {f.acciones_mitigacion}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Responsable:</strong> {f.responsable}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    Cronograma: {f.fecha_inicio || '2026-01-01'} al {f.fecha_fin || '2026-12-31'}
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};
