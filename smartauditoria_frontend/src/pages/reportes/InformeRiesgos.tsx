import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Shield as ShieldIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  PictureAsPdf as PdfFileIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  TableChart as ExcelFileIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { dashboardService } from '../../services/backend';
import { activosService } from '../../services/activos';
import '../../styles/design-system.css';

const InformeRiesgos: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [reporteData, setReporteData] = useState<any>(null);
  
  // Estados para modales
  const [modalTotalActivos, setModalTotalActivos] = useState(false);
  const [modalActivosEvaluados, setModalActivosEvaluados] = useState(false);
  const [modalRiesgos, setModalRiesgos] = useState(false);
  const [modalRiesgosAltos, setModalRiesgosAltos] = useState(false);
  const [dataModalTotalActivos, setDataModalTotalActivos] = useState<any>(null);
  const [dataModalActivos, setDataModalActivos] = useState<any>(null);
  const [dataModalRiesgos, setDataModalRiesgos] = useState<any>(null);
  const [dataModalRiesgosAltos, setDataModalRiesgosAltos] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    cargarReporte();
    
    // Refrescar datos cada 5 minutos (300000ms) para no ser molesto
    const interval = setInterval(() => {
      cargarReporte();
    }, 300000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const reporte = await dashboardService.getReporteCompletoRiesgos();
      
      // Verificar que la respuesta tenga la estructura esperada
      if (reporte && (reporte.activos !== undefined || reporte.estadisticas !== undefined)) {
        setReporteData(reporte);
      } else {
        // Si la respuesta no tiene la estructura esperada, inicializar con valores por defecto
        console.warn('Respuesta del servidor no tiene la estructura esperada:', reporte);
        setReporteData({
          activos: [],
          estadisticas: {
            total_activos: 0,
            activos_evaluados: 0,
            total_riesgos: 0,
            riesgos_altos: 0,
            riesgos_medios: 0,
            riesgos_bajos: 0
          }
        });
      }
    } catch (error: any) {
      console.error('Error cargando reporte:', error);
      toast.error(`Error al cargar el reporte de riesgos: ${error.message || 'Error desconocido'}`);
      // Inicializar con valores por defecto en caso de error
      setReporteData({
        activos: [],
        estadisticas: {
          total_activos: 0,
          activos_evaluados: 0,
          total_riesgos: 0,
          riesgos_altos: 0,
          riesgos_medios: 0,
          riesgos_bajos: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para graficos
  const datosGrafico = React.useMemo(() => {
    if (!reporteData?.activos) return [];
    
    // Agrupar por tipo de activo - incluir TODOS los tipos
    const porTipo: { [key: string]: { activos: number; riesgos: number } } = {};
    
    reporteData.activos.forEach((activo: any) => {
      const tipo = activo.tipo || 'Sin tipo';
      if (!porTipo[tipo]) {
        porTipo[tipo] = { activos: 0, riesgos: 0 };
      }
      porTipo[tipo].activos += 1;
      porTipo[tipo].riesgos += activo.riesgos?.length || 0;
    });
    
    // Ordenar por cantidad de activos (descendente) para mejor visualizacion
    return Object.entries(porTipo)
      .map(([tipo, datos]) => ({
        tipo,
        activos: datos.activos,
        riesgos: datos.riesgos
      }))
      .sort((a, b) => b.activos - a.activos); // Ordenar por cantidad de activos
  }, [reporteData]);

  const datosNivelRiesgo = React.useMemo(() => {
    if (!reporteData?.estadisticas) return [];
    
    return [
      { nivel: 'Alto', cantidad: reporteData.estadisticas.riesgos_altos || 0, color: '#EF4444' },
      { nivel: 'Medio', cantidad: reporteData.estadisticas.riesgos_medios || 0, color: '#F59E0B' },
      { nivel: 'Bajo', cantidad: reporteData.estadisticas.riesgos_bajos || 0, color: '#10B981' },
    ];
  }, [reporteData]);

  const exportarPDF = async () => {
    if (!reporteData) return;
    
    try {
      setExportando(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Titulo
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138);
      doc.text('INFORME COMPLETO DE RIESGOS', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      // Estadisticas Generales
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text('ESTADISTICAS GENERALES', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.text(`Total de Activos: ${reporteData.estadisticas?.total_activos || 0}`, margin, yPos);
      yPos += 6;
      doc.text(`Activos Evaluados: ${reporteData.estadisticas?.activos_evaluados || 0}`, margin, yPos);
      yPos += 6;
      doc.text(`Total de Riesgos: ${reporteData.estadisticas?.total_riesgos || 0}`, margin, yPos);
      yPos += 6;
      doc.text(`Riesgos Altos: ${reporteData.estadisticas?.riesgos_altos || 0}`, margin, yPos);
      yPos += 6;
      doc.text(`Riesgos Medios: ${reporteData.estadisticas?.riesgos_medios || 0}`, margin, yPos);
      yPos += 6;
      doc.text(`Riesgos Bajos: ${reporteData.estadisticas?.riesgos_bajos || 0}`, margin, yPos);
      yPos += 10;
      
      // Activos y Riesgos
      if (reporteData.activos && reporteData.activos.length > 0) {
        reporteData.activos.forEach((activo: any, index: number) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(14);
          doc.setTextColor(30, 58, 138);
          doc.text(`${index + 1}. ${activo.nombre}`, margin, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.text(`Tipo: ${activo.tipo || 'N/A'}`, margin, yPos);
          yPos += 5;
          doc.text(`Criticidad: ${activo.criticidad || 'N/A'}`, margin, yPos);
          yPos += 5;
          doc.text(`Estado: ${activo.estado || 'N/A'}`, margin, yPos);
          yPos += 5;
          
          if (activo.descripcion) {
            const descLines = doc.splitTextToSize(`Descripcion: ${activo.descripcion}`, maxWidth);
            doc.text(descLines, margin, yPos);
            yPos += descLines.length * 5;
          }
          
          yPos += 3;
          
          // Riesgos del activo
          if (activo.riesgos && activo.riesgos.length > 0) {
            doc.setFontSize(12);
            doc.text(`Riesgos Identificados (${activo.riesgos.length}):`, margin, yPos);
            yPos += 6;
            
            activo.riesgos.forEach((riesgo: any, riesgoIndex: number) => {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }
              
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              doc.text(`${riesgoIndex + 1}. ${riesgo.nombre}`, margin + 5, yPos);
              yPos += 6;
              
              doc.setFontSize(10);
              if (riesgo.descripcion) {
                const riesgoDescLines = doc.splitTextToSize(`  ${riesgo.descripcion}`, maxWidth - 10);
                doc.text(riesgoDescLines, margin + 5, yPos);
                yPos += riesgoDescLines.length * 5;
              }
              
              // Evaluacion Inherente
              if (riesgo.evaluacion_inherente) {
                doc.text(`  Evaluacion Inherente:`, margin + 5, yPos);
                yPos += 5;
                doc.text(`    Probabilidad: ${riesgo.evaluacion_inherente.probabilidad || 'N/A'}`, margin + 10, yPos);
                yPos += 5;
                doc.text(`    Impacto: ${riesgo.evaluacion_inherente.impacto || 'N/A'}`, margin + 10, yPos);
                yPos += 5;
                doc.text(`    Nivel de Riesgo: ${riesgo.evaluacion_inherente.nivel_riesgo || 'N/A'}`, margin + 10, yPos);
                yPos += 5;
                if (riesgo.evaluacion_inherente.justificacion) {
                  const justLines = doc.splitTextToSize(`    Justificacion: ${riesgo.evaluacion_inherente.justificacion}`, maxWidth - 15);
                  doc.text(justLines, margin + 10, yPos);
                  yPos += justLines.length * 5;
                }
              }
              
              // Evaluacion Residual
              if (riesgo.evaluacion_residual) {
                doc.text(`  Evaluacion Residual:`, margin + 5, yPos);
                yPos += 5;
                doc.text(`    Probabilidad: ${riesgo.evaluacion_residual.probabilidad || 'N/A'}`, margin + 10, yPos);
                yPos += 5;
                doc.text(`    Impacto: ${riesgo.evaluacion_residual.impacto || 'N/A'}`, margin + 10, yPos);
                yPos += 5;
                doc.text(`    Nivel de Riesgo: ${riesgo.evaluacion_residual.nivel_riesgo || 'N/A'}`, margin + 10, yPos);
                yPos += 5;
                if (riesgo.evaluacion_residual.justificacion) {
                  const justLines = doc.splitTextToSize(`    Justificacion: ${riesgo.evaluacion_residual.justificacion}`, maxWidth - 15);
                  doc.text(justLines, margin + 10, yPos);
                  yPos += justLines.length * 5;
                }
              }
              
              yPos += 3;
            });
          } else {
            doc.setFontSize(10);
            doc.text('No hay riesgos identificados para este activo', margin + 5, yPos);
            yPos += 6;
          }
          
          yPos += 5;
        });
      }
      
      // Pie de pagina
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Pagina ${i} de ${totalPages} - SGRI Sistema de Gestion de Riesgos de Informacion`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      const fileName = `Informe_Completo_Riesgos_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('âœ… Reporte PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('âŒ Error al generar el reporte PDF');
    } finally {
      setExportando(false);
    }
  };

  const exportarExcel = async () => {
    if (!reporteData) return;
    
    try {
      setExportando(true);
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default || XLSXModule;
      
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Resumen
      const resumenData = [
        ['INFORME COMPLETO DE RIESGOS'],
        ['Generado el', new Date().toLocaleDateString('es-ES')],
        [''],
        ['ESTADISTICAS GENERALES'],
        ['Total de Activos', reporteData.estadisticas?.total_activos || 0],
        ['Activos Evaluados', reporteData.estadisticas?.activos_evaluados || 0],
        ['Total de Riesgos', reporteData.estadisticas?.total_riesgos || 0],
        ['Riesgos Altos', reporteData.estadisticas?.riesgos_altos || 0],
        ['Riesgos Medios', reporteData.estadisticas?.riesgos_medios || 0],
        ['Riesgos Bajos', reporteData.estadisticas?.riesgos_bajos || 0],
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
      
      // Hoja 2: Activos y Riesgos Consolidado
      const consolidadoData = [
        ['ID Activo', 'Nombre Activo', 'Tipo', 'Criticidad', 'Estado', 'ID Riesgo', 'Nombre Riesgo', 
         'Categoria', 'Prob. Inh.', 'Impacto Inh.', 'Nivel Inh.', 'Prob. Res.', 'Impacto Res.', 
         'Nivel Res.', 'Justificacion Inh.', 'Justificacion Res.', 'Total Controles']
      ];
      
      reporteData.activos?.forEach((activo: any) => {
        if (activo.riesgos && activo.riesgos.length > 0) {
          activo.riesgos.forEach((riesgo: any) => {
            consolidadoData.push([
              activo.id || '',
              activo.nombre || '',
              activo.tipo || '',
              activo.criticidad || '',
              activo.estado || '',
              riesgo.id_riesgo || '',
              riesgo.nombre || '',
              riesgo.categoria || '',
              riesgo.evaluacion_inherente?.probabilidad || '',
              riesgo.evaluacion_inherente?.impacto || '',
              riesgo.evaluacion_inherente?.nivel_riesgo || '',
              riesgo.evaluacion_residual?.probabilidad || '',
              riesgo.evaluacion_residual?.impacto || '',
              riesgo.evaluacion_residual?.nivel_riesgo || '',
              riesgo.evaluacion_inherente?.justificacion || '',
              riesgo.evaluacion_residual?.justificacion || '',
              riesgo.total_controles || 0
            ]);
          });
        } else {
          // Activo sin riesgos
          consolidadoData.push([
            activo.id || '',
            activo.nombre || '',
            activo.tipo || '',
            activo.criticidad || '',
            activo.estado || '',
            '', '', '', '', '', '', '', '', '', '', '', ''
          ]);
        }
      });
      
      const ws2 = XLSX.utils.aoa_to_sheet(consolidadoData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Activos y Riesgos');
      
      // Hoja 3: Detalle por Activo
      const detalleData: any[] = [];
      reporteData.activos?.forEach((activo: any) => {
        detalleData.push([`ACTIVO: ${activo.nombre}`]);
        detalleData.push(['Tipo', activo.tipo || '']);
        detalleData.push(['Criticidad', activo.criticidad || '']);
        detalleData.push(['Estado', activo.estado || '']);
        detalleData.push(['Descripcion', activo.descripcion || '']);
        detalleData.push(['']);
        
        if (activo.riesgos && activo.riesgos.length > 0) {
          detalleData.push(['RIESGOS IDENTIFICADOS']);
          detalleData.push(['Nombre', 'Categoria', 'Prob. Inh.', 'Impacto Inh.', 'Nivel Inh.', 
                           'Prob. Res.', 'Impacto Res.', 'Nivel Res.', 'Controles']);
          
          activo.riesgos.forEach((riesgo: any) => {
            detalleData.push([
              riesgo.nombre || '',
              riesgo.categoria || '',
              riesgo.evaluacion_inherente?.probabilidad || '',
              riesgo.evaluacion_inherente?.impacto || '',
              riesgo.evaluacion_inherente?.nivel_riesgo || '',
              riesgo.evaluacion_residual?.probabilidad || '',
              riesgo.evaluacion_residual?.impacto || '',
              riesgo.evaluacion_residual?.nivel_riesgo || '',
              riesgo.total_controles || 0
            ]);
          });
        } else {
          detalleData.push(['No hay riesgos identificados para este activo']);
        }
        
        detalleData.push(['']);
        detalleData.push(['']);
      });
      
      const ws3 = XLSX.utils.aoa_to_sheet(detalleData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Detalle por Activo');
      
      const fileName = `Informe_Completo_Riesgos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('âœ… Reporte Excel generado exitosamente');
    } catch (error) {
      console.error('Error generando Excel:', error);
      toast.error('âŒ Error al generar el reporte Excel');
    } finally {
      setExportando(false);
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/reportes')}
            sx={{ mb: 2, textTransform: 'none' }}
          >
            Volver a Reportes
          </Button>
          <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
            Informe de Riesgos
          </Typography>
          <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
            Analisis completo de activos y riesgos identificados
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={exportarPDF}
            disabled={exportando}
            startIcon={<PdfIcon />}
            variant="outlined"
            sx={{
              borderColor: '#DC2626',
              color: '#DC2626',
              '&:hover': { borderColor: '#B91C1C', backgroundColor: '#FEF2F2' }
            }}
          >
            {exportando ? 'Exportando...' : 'PDF'}
          </Button>
          <Button
            onClick={exportarExcel}
            disabled={exportando}
            startIcon={<ExcelIcon />}
            variant="outlined"
            sx={{
              borderColor: '#10B981',
              color: '#10B981',
              '&:hover': { borderColor: '#059669', backgroundColor: '#D1FAE5' }
            }}
          >
            {exportando ? 'Exportando...' : 'Excel'}
          </Button>
        </Box>
      </Box>

      {/* Estadisticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SecurityIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    {reporteData?.estadisticas?.total_activos || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Total Activos
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={async () => {
                  setLoadingModal(true);
                  setModalTotalActivos(true);
                  try {
                    const data = await activosService.getActivos();
                    setDataModalTotalActivos(data);
                  } catch (error) {
                    toast.error('Error al cargar activos');
                    console.error(error);
                  } finally {
                    setLoadingModal(false);
                  }
                }}
                sx={{
                  borderColor: '#3B82F6',
                  color: '#3B82F6',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#2563EB',
                    backgroundColor: '#EFF6FF',
                  }
                }}
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 40, color: '#10B981' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    {reporteData?.estadisticas?.activos_evaluados || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Activos Evaluados
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={async () => {
                  setLoadingModal(true);
                  setModalActivosEvaluados(true);
                  try {
                    const data = await dashboardService.getActivosEvaluadosDetalle();
                    setDataModalActivos(data);
                  } catch (error) {
                    toast.error('Error al cargar activos evaluados');
                    console.error(error);
                  } finally {
                    setLoadingModal(false);
                  }
                }}
                sx={{
                  borderColor: '#10B981',
                  color: '#10B981',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#059669',
                    backgroundColor: '#D1FAE5',
                  }
                }}
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    {reporteData?.estadisticas?.total_riesgos || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Total Riesgos
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={async () => {
                  setLoadingModal(true);
                  setModalRiesgos(true);
                  try {
                    const data = await dashboardService.getRiesgosConActivos();
                    setDataModalRiesgos(data);
                  } catch (error) {
                    toast.error('Error al cargar riesgos');
                    console.error(error);
                  } finally {
                    setLoadingModal(false);
                  }
                }}
                sx={{
                  borderColor: '#F59E0B',
                  color: '#F59E0B',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#D97706',
                    backgroundColor: '#FEF3C7',
                  }
                }}
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 40, color: '#EF4444' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    {reporteData?.estadisticas?.riesgos_altos || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Riesgos Altos
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={async () => {
                  setLoadingModal(true);
                  setModalRiesgosAltos(true);
                  try {
                    const data = await dashboardService.getRiesgosAltosDetalle();
                    setDataModalRiesgosAltos(data);
                  } catch (error) {
                    toast.error('Error al cargar riesgos altos');
                    console.error(error);
                  } finally {
                    setLoadingModal(false);
                  }
                }}
                sx={{
                  borderColor: '#EF4444',
                  color: '#EF4444',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#DC2626',
                    backgroundColor: '#FEE2E2',
                  }
                }}
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title="Activos y Riesgos por Tipo"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activos" fill="#3B82F6" name="Activos" />
                  <Bar dataKey="riesgos" fill="#10B981" name="Riesgos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="Distribucion por Nivel de Riesgo"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              {datosNivelRiesgo.length > 0 && datosNivelRiesgo.some(d => d.cantidad > 0) ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={datosNivelRiesgo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `:  (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="cantidad"
                    >
                      {datosNivelRiesgo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} riesgos`,
                        props.payload?.nivel || name
                      ]}
                      labelFormatter={(label) => ''}
                    />
                    <Legend 
                      formatter={(value, entry: any) => {
                        const nivel = entry.payload?.nivel || value;
                        const cantidad = entry.payload?.cantidad || entry.value || 0;
                        return `: `;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    No hay datos de distribucion de riesgos disponibles
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Activos y Riesgos */}
      <Card>
        <CardHeader
          title="Detalle de Activos y Riesgos"
          titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
        />
        <CardContent>
          {reporteData?.activos && reporteData.activos.length > 0 ? (
            <Stack spacing={4}>
              {reporteData.activos.map((activo: any, index: number) => (
                <Box key={activo.id || index}>
                  <Paper sx={{ p: 3, backgroundColor: '#F9FAFB' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                          {activo.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Chip label={activo.tipo || 'Sin tipo'} size="small" />
                          <Chip 
                            label={activo.criticidad || 'Sin criticidad'} 
                            size="small"
                            sx={{
                              backgroundColor: activo.criticidad === 'Alto' || activo.criticidad === 'Critico' ? '#FEE2E2' : '#D1FAE5',
                              color: activo.criticidad === 'Alto' || activo.criticidad === 'Critico' ? '#DC2626' : '#065F46'
                            }}
                          />
                          <Chip label={activo.estado || 'Sin estado'} size="small" />
                        </Box>
                      </Box>
                      <Chip 
                        label={`${activo.riesgos?.length || 0} Riesgo(s)`}
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    
                    {activo.descripcion && (
                      <Typography variant="body2" component="div" className="font-roboto" sx={{ color: '#6B7280', mb: 2 }}>
                        {activo.descripcion}
                      </Typography>
                    )}
                    
                    {activo.riesgos && activo.riesgos.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        {activo.riesgos.map((riesgo: any, riesgoIndex: number) => (
                          <Paper key={riesgo.id_riesgo || riesgoIndex} sx={{ p: 2, mb: 2, backgroundColor: '#FFFFFF' }}>
                            <Typography variant="subtitle1" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                              {riesgo.nombre}
                            </Typography>
                            {riesgo.descripcion && (
                              <Typography variant="body2" component="div" className="font-roboto" sx={{ color: '#6B7280', mb: 2 }}>
                                {riesgo.descripcion}
                              </Typography>
                            )}
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              {riesgo.evaluacion_inherente && (
                                <Grid  size={{ xs: 12, md: 6 }}>
                                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                                    Evaluacion Inherente
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label={`Prob: ${riesgo.evaluacion_inherente.probabilidad || 'N/A'}`} size="small" />
                                    <Chip label={`Impacto: ${riesgo.evaluacion_inherente.impacto || 'N/A'}`} size="small" />
                                    <Chip 
                                      label={riesgo.evaluacion_inherente.nivel_riesgo || 'N/A'}
                                      size="small"
                                      sx={{
                                        backgroundColor: riesgo.evaluacion_inherente.nivel_riesgo === 'Alto' ? '#FEE2E2' :
                                                       riesgo.evaluacion_inherente.nivel_riesgo === 'Medio' ? '#FEF3C7' : '#D1FAE5',
                                        color: riesgo.evaluacion_inherente.nivel_riesgo === 'Alto' ? '#DC2626' :
                                               riesgo.evaluacion_inherente.nivel_riesgo === 'Medio' ? '#92400E' : '#065F46'
                                      }}
                                    />
                                  </Box>
                                  {riesgo.evaluacion_inherente.justificacion && (
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
                                      {riesgo.evaluacion_inherente.justificacion}
                                    </Typography>
                                  )}
                                </Grid>
                              )}
                              
                              {riesgo.evaluacion_residual && (
                                <Grid  size={{ xs: 12, md: 6 }}>
                                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                                    Evaluacion Residual
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label={`Prob: ${riesgo.evaluacion_residual.probabilidad || 'N/A'}`} size="small" />
                                    <Chip label={`Impacto: ${riesgo.evaluacion_residual.impacto || 'N/A'}`} size="small" />
                                    <Chip 
                                      label={riesgo.evaluacion_residual.nivel_riesgo || 'N/A'}
                                      size="small"
                                      sx={{
                                        backgroundColor: riesgo.evaluacion_residual.nivel_riesgo === 'Alto' ? '#FEE2E2' :
                                                       riesgo.evaluacion_residual.nivel_riesgo === 'Medio' ? '#FEF3C7' : '#D1FAE5',
                                        color: riesgo.evaluacion_residual.nivel_riesgo === 'Alto' ? '#DC2626' :
                                               riesgo.evaluacion_residual.nivel_riesgo === 'Medio' ? '#92400E' : '#065F46'
                                      }}
                                    />
                                  </Box>
                                  {riesgo.evaluacion_residual.justificacion && (
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
                                      {riesgo.evaluacion_residual.justificacion}
                                    </Typography>
                                  )}
                                </Grid>
                              )}
                              
                              {riesgo.total_controles > 0 && (
                                <Grid  size={{ xs: 12 }}>
                                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                    Controles aplicados: {riesgo.total_controles}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Este activo no tiene riesgos identificados
                      </Alert>
                    )}
                  </Paper>
                  {index < reporteData.activos.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">
              No hay datos disponibles para mostrar
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Modal: Activos Evaluados */}
      <Dialog 
        open={modalActivosEvaluados} 
        onClose={() => setModalActivosEvaluados(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
            Activos Evaluados ({dataModalActivos?.total || 0})
          </Typography>
          <IconButton onClick={() => setModalActivosEvaluados(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingModal ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : dataModalActivos?.activos && dataModalActivos.activos.length > 0 ? (
            <Stack spacing={3}>
              {dataModalActivos.activos.map((activo: any, index: number) => (
                <Accordion key={activo.id || index} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <SecurityIcon sx={{ color: '#10B981' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600 }}>
                          {activo.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={activo.tipo} size="small" />
                          <Chip label={activo.criticidad} size="small" />
                          <Chip label={`${activo.riesgos?.length || 0} Riesgo(s)`} size="small" color="primary" />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {/* Columna izquierda: Detalles del Activo */}
                      <Grid  size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 2, backgroundColor: '#F9FAFB', height: '100%' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E3A8A' }}>
                            Detalles del Activo
                          </Typography>
                          {activo.descripcion && (
                            <Typography variant="body2" component="div" sx={{ mb: 2, color: '#6B7280' }}>
                              {activo.descripcion}
                            </Typography>
                          )}
                          <Stack spacing={1}>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                Tipo
                              </Typography>
                              <Chip label={activo.tipo} size="small" />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                Criticidad
                              </Typography>
                              <Chip 
                                label={activo.criticidad} 
                                size="small"
                                sx={{
                                  backgroundColor: activo.criticidad === 'Alto' || activo.criticidad === 'Critico' ? '#FEE2E2' : '#D1FAE5',
                                  color: activo.criticidad === 'Alto' || activo.criticidad === 'Critico' ? '#DC2626' : '#065F46'
                                }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                Estado
                              </Typography>
                              <Chip label={activo.estado} size="small" />
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                      
                      {/* Columna derecha: Evaluaciones */}
                      <Grid  size={{ xs: 12, md: 8 }}>
                        {activo.riesgos && activo.riesgos.length > 0 ? (
                          <Stack spacing={2}>
                            {activo.riesgos.map((riesgo: any, riesgoIndex: number) => (
                              <Paper key={riesgoIndex} sx={{ p: 2, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                                <Typography variant="subtitle1" className="font-poppins" sx={{ fontWeight: 600, mb: 1, color: '#1E3A8A' }}>
                                  {riesgo.nombre}
                                </Typography>
                                {riesgo.descripcion && (
                                  <Typography variant="body2" component="div" sx={{ mb: 2, color: '#6B7280' }}>
                                    {riesgo.descripcion}
                                  </Typography>
                                )}
                                
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  {riesgo.evaluacion_inherente && (
                                    <Grid  size={{ xs: 12, md: 6 }}>
                                      <Paper sx={{ p: 1.5, backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#1E3A8A' }}>
                                          Evaluacion Inherente
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                          <Chip label={`Prob: ${riesgo.evaluacion_inherente.probabilidad}`} size="small" />
                                          <Chip label={`Impacto: ${riesgo.evaluacion_inherente.impacto}`} size="small" />
                                        </Box>
                                        <Chip 
                                          label={riesgo.evaluacion_inherente.nivel_riesgo}
                                          size="small"
                                          sx={{
                                            backgroundColor: riesgo.evaluacion_inherente.nivel_riesgo === 'Alto' ? '#FEE2E2' : '#D1FAE5',
                                            color: riesgo.evaluacion_inherente.nivel_riesgo === 'Alto' ? '#DC2626' : '#065F46',
                                            fontWeight: 600
                                          }}
                                        />
                                        {riesgo.evaluacion_inherente.justificacion && (
                                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1, fontStyle: 'italic' }}>
                                            {riesgo.evaluacion_inherente.justificacion}
                                          </Typography>
                                        )}
                                      </Paper>
                                    </Grid>
                                  )}
                                  {riesgo.evaluacion_residual && (
                                    <Grid  size={{ xs: 12, md: 6 }}>
                                      <Paper sx={{ p: 1.5, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#1E3A8A' }}>
                                          Evaluacion Residual
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                          <Chip label={`Prob: ${riesgo.evaluacion_residual.probabilidad}`} size="small" />
                                          <Chip label={`Impacto: ${riesgo.evaluacion_residual.impacto}`} size="small" />
                                        </Box>
                                        <Chip 
                                          label={riesgo.evaluacion_residual.nivel_riesgo}
                                          size="small"
                                          sx={{
                                            backgroundColor: riesgo.evaluacion_residual.nivel_riesgo === 'Alto' ? '#FEE2E2' : '#D1FAE5',
                                            color: riesgo.evaluacion_residual.nivel_riesgo === 'Alto' ? '#DC2626' : '#065F46',
                                            fontWeight: 600
                                          }}
                                        />
                                        {riesgo.evaluacion_residual.justificacion && (
                                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1, fontStyle: 'italic' }}>
                                            {riesgo.evaluacion_residual.justificacion}
                                          </Typography>
                                        )}
                                      </Paper>
                                    </Grid>
                                  )}
                                </Grid>

                                {riesgo.controles && riesgo.controles.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1E3A8A' }}>
                                      Controles Aplicados ({riesgo.controles.length})
                                    </Typography>
                                    <List dense>
                                      {riesgo.controles.map((control: any, ctrlIndex: number) => (
                                        <ListItem key={ctrlIndex} sx={{ borderBottom: '1px solid #E5E7EB', py: 1 }}>
                                          <Box sx={{ width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                              <ShieldIcon sx={{ fontSize: 18, color: '#1E3A8A' }} />
                                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {control.nombre}
                                              </Typography>
                                              {control.codigo_iso && (
                                                <Chip label={control.codigo_iso} size="small" variant="outlined" />
                                              )}
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                              {control.descripcion}
                                            </Typography>
                                            {control.justificacion && (
                                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                                Justificacion: {control.justificacion}
                                              </Typography>
                                            )}
                                          </Box>
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                )}
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Alert severity="info">Este activo no tiene riesgos evaluados</Alert>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">No hay activos evaluados disponibles</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalActivosEvaluados(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Riesgos con Activos */}
      <Dialog 
        open={modalRiesgos} 
        onClose={() => setModalRiesgos(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
            Riesgos con Activos Enlazados ({dataModalRiesgos?.total || 0})
          </Typography>
          <IconButton onClick={() => setModalRiesgos(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingModal ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : dataModalRiesgos?.riesgos && dataModalRiesgos.riesgos.length > 0 ? (
            <Stack spacing={3}>
              {dataModalRiesgos.riesgos.map((riesgo: any, index: number) => (
                <Accordion key={riesgo.id_riesgo || index} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <AssessmentIcon sx={{ color: '#F59E0B' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600 }}>
                          {riesgo.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={riesgo.tipo} size="small" />
                          <Chip label={riesgo.estado} size="small" />
                          <Chip label={`${riesgo.activos?.length || 0} Activo(s)`} size="small" color="primary" />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {riesgo.descripcion && (
                      <Typography variant="body2" sx={{ mb: 2, color: '#6B7280' }}>
                        {riesgo.descripcion}
                      </Typography>
                    )}
                    
                    {riesgo.activos && riesgo.activos.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Activos Enlazados
                        </Typography>
                        <List dense>
                          {riesgo.activos.map((activo: any, activoIndex: number) => (
                            <ListItem key={activoIndex}>
                              <ListItemText
                                primary={activo.nombre}
                                secondary={`Tipo: ${activo.tipo}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {riesgo.controles_sugeridos && riesgo.controles_sugeridos.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Controles Sugeridos por Norma ISO ({riesgo.controles_sugeridos.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Control</TableCell>
                                <TableCell>Categoria</TableCell>
                                <TableCell>Codigo ISO</TableCell>
                                <TableCell>Eficacia</TableCell>
                                <TableCell>Descripcion</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.controles_sugeridos.map((control: any, ctrlIndex: number) => (
                                <TableRow key={ctrlIndex}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <ShieldIcon sx={{ fontSize: 18, color: '#1E3A8A' }} />
                                      {control.nombre}
                                    </Box>
                                  </TableCell>
                                  <TableCell>{control.categoria_iso || control.categoria}</TableCell>
                                  <TableCell>
                                    {control.codigo_iso && (
                                      <Chip label={control.codigo_iso} size="small" variant="outlined" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={control.eficacia_esperada || 'Media'} 
                                      size="small"
                                      sx={{
                                        backgroundColor: control.eficacia_esperada === 'Muy Alta' ? '#D1FAE5' : '#FEF3C7',
                                        color: control.eficacia_esperada === 'Muy Alta' ? '#065F46' : '#92400E'
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                      {control.descripcion?.substring(0, 100)}...
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">No hay riesgos disponibles</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalRiesgos(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Riesgos Altos con Evidencia */}
      <Dialog 
        open={modalRiesgosAltos} 
        onClose={() => setModalRiesgosAltos(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
            Riesgos Altos - Estado de Mitigacion ({dataModalRiesgosAltos?.total || 0})
          </Typography>
          <IconButton onClick={() => setModalRiesgosAltos(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingModal ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : dataModalRiesgosAltos?.riesgos && dataModalRiesgosAltos.riesgos.length > 0 ? (
            <Stack spacing={3}>
              {dataModalRiesgosAltos.riesgos.map((riesgo: any, index: number) => (
                <Accordion key={riesgo.id_riesgo || index} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <WarningIcon sx={{ color: '#EF4444' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600 }}>
                          {riesgo.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={riesgo.estado_mitigacion}
                            size="small"
                            sx={{
                              backgroundColor: riesgo.estado_mitigacion === 'Mitigado' ? '#D1FAE5' :
                                             riesgo.estado_mitigacion === 'Aceptado' ? '#FEF3C7' :
                                             riesgo.estado_mitigacion === 'En Mitigacion' ? '#DBEAFE' : '#FEE2E2',
                              color: riesgo.estado_mitigacion === 'Mitigado' ? '#065F46' :
                                     riesgo.estado_mitigacion === 'Aceptado' ? '#92400E' :
                                     riesgo.estado_mitigacion === 'En Mitigacion' ? '#1E40AF' : '#DC2626',
                              fontWeight: 600
                            }}
                            icon={riesgo.estado_mitigacion === 'Mitigado' ? <CheckCircleIcon /> :
                                  riesgo.estado_mitigacion === 'Aceptado' ? <WarningIcon /> :
                                  riesgo.estado_mitigacion === 'En Mitigacion' ? <SecurityIcon /> : <CancelIcon />}
                          />
                          <Chip label={riesgo.estado} size="small" />
                          <Chip label={`${riesgo.controles?.length || 0} Controles`} size="small" color="primary" />
                          <Chip label={`${riesgo.documentos_evidencia?.length || 0} Evidencias`} size="small" color="secondary" />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {/* Columna izquierda: Informacion del Riesgo y Responsable */}
                      <Grid  size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 2, backgroundColor: '#F9FAFB', height: '100%' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E3A8A' }}>
                            Informacion del Riesgo
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                                Activo
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {riesgo.activo?.nombre}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                {riesgo.activo?.tipo}
                              </Typography>
                            </Box>
                            {riesgo.descripcion && (
                              <Box>
                                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                                  Descripcion
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ color: '#6B7280' }}>
                                  {riesgo.descripcion}
                                </Typography>
                              </Box>
                            )}
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                                Responsable
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SecurityIcon sx={{ fontSize: 18, color: '#1E3A8A' }} />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {riesgo.responsable || 'No asignado'}
                                  </Typography>
                                  {riesgo.email_responsable && (
                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                      {riesgo.email_responsable}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            {riesgo.justificacion && (
                              <Box>
                                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                                  Justificacion
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                                  {riesgo.justificacion}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                      
                      {/* Columna derecha: Controles y Documentos */}
                      <Grid  size={{ xs: 12, md: 8 }}>
                        <Stack spacing={2}>
                          {riesgo.controles && riesgo.controles.length > 0 && (
                            <Paper sx={{ p: 2, border: '1px solid #E5E7EB' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#1E3A8A' }}>
                                Controles Aplicados ({riesgo.controles.length})
                              </Typography>
                              <List dense>
                                {riesgo.controles.map((control: any, ctrlIndex: number) => (
                                  <ListItem key={ctrlIndex} sx={{ borderBottom: '1px solid #E5E7EB', py: 1.5 }}>
                                    <Box sx={{ width: '100%' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <ShieldIcon sx={{ fontSize: 18, color: '#1E3A8A' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {control.nombre}
                                        </Typography>
                                        {control.eficacia && (
                                          <Chip 
                                            label={`Eficacia: ${control.eficacia}`} 
                                            size="small"
                                            sx={{
                                              backgroundColor: control.eficacia === 'Muy Alta' || control.eficacia === 'Alta' ? '#D1FAE5' : '#FEF3C7',
                                              color: control.eficacia === 'Muy Alta' || control.eficacia === 'Alta' ? '#065F46' : '#92400E'
                                            }}
                                          />
                                        )}
                                      </Box>
                                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                        {control.descripcion}
                                      </Typography>
                                      {control.justificacion && (
                                        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                          Justificacion: {control.justificacion}
                                        </Typography>
                                      )}
                                    </Box>
                                  </ListItem>
                                ))}
                              </List>
                            </Paper>
                          )}

                          {riesgo.documentos_evidencia && riesgo.documentos_evidencia.length > 0 && (
                            <Paper sx={{ p: 2, border: '1px solid #E5E7EB' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#1E3A8A' }}>
                                Documentos de Evidencia ({riesgo.documentos_evidencia.length})
                              </Typography>
                              <List dense>
                                {riesgo.documentos_evidencia.map((documento: any, docIndex: number) => (
                                  <ListItem key={docIndex} 
                                    sx={{ 
                                      borderBottom: '1px solid #E5E7EB', 
                                      py: 1,
                                      '&:hover': { backgroundColor: '#F9FAFB' },
                                      cursor: documento.url ? 'pointer' : 'default'
                                    }}
                                    onClick={() => {
                                      if (documento.url) {
                                        window.open(documento.url, '_blank');
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                      {documento.tipo?.includes('pdf') ? <PdfFileIcon sx={{ color: '#DC2626', fontSize: 24 }} /> :
                                       documento.tipo?.includes('word') ? <DescriptionIcon sx={{ color: '#2563EB', fontSize: 24 }} /> :
                                       documento.tipo?.includes('excel') ? <ExcelFileIcon sx={{ color: '#059669', fontSize: 24 }} /> :
                                       documento.tipo?.includes('image') ? <ImageIcon sx={{ color: '#7C3AED', fontSize: 24 }} /> :
                                       <FileIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                                    </Box>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: documento.url ? '#1E3A8A' : '#374151' }}>
                                          {documento.nombre}
                                          {documento.url && (
                                            <VisibilityIcon sx={{ fontSize: 16, ml: 1, verticalAlign: 'middle' }} />
                                          )}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                          {documento.tamano && `${documento.tamano} â€¢ `}
                                          {documento.fechaSubida && new Date(documento.fechaSubida).toLocaleDateString()}
                                          {documento.descripcion && ` â€¢ ${documento.descripcion}`}
                                        </Typography>
                                      }
                                    />
                                    {documento.url && (
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(documento.url, '_blank');
                                        }}
                                        sx={{ color: '#1E3A8A' }}
                                        title="Ver documento"
                                      >
                                        <VisibilityIcon />
                                      </IconButton>
                                    )}
                                  </ListItem>
                                ))}
                              </List>
                            </Paper>
                          )}
                          
                          {(!riesgo.controles || riesgo.controles.length === 0) && (!riesgo.documentos_evidencia || riesgo.documentos_evidencia.length === 0) && (
                            <Alert severity="info">
                              No hay controles aplicados ni documentos de evidencia para este riesgo
                            </Alert>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">No hay riesgos altos disponibles</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalRiesgosAltos(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Total Activos */}
      <Dialog 
        open={modalTotalActivos} 
        onClose={() => setModalTotalActivos(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
            Total Activos ({dataModalTotalActivos?.length || 0})
          </Typography>
          <IconButton onClick={() => setModalTotalActivos(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingModal ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : dataModalTotalActivos && dataModalTotalActivos.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Criticidad</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descripcion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataModalTotalActivos.map((activo: any, index: number) => (
                    <TableRow key={activo.id || activo.ID_Activo || index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SecurityIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activo.nombre || activo.Nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={activo.tipo || activo.Tipo_Activo} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={activo.estado || activo.estado_activo} 
                          size="small"
                          sx={{
                            backgroundColor: (activo.estado || activo.estado_activo) === 'Activo' ? '#D1FAE5' : '#FEE2E2',
                            color: (activo.estado || activo.estado_activo) === 'Activo' ? '#065F46' : '#DC2626'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={activo.criticidad || activo.nivel_criticidad_negocio} 
                          size="small"
                          sx={{
                            backgroundColor: (activo.criticidad || activo.nivel_criticidad_negocio) === 'Alto' || (activo.criticidad || activo.nivel_criticidad_negocio) === 'Critico' ? '#FEE2E2' : '#D1FAE5',
                            color: (activo.criticidad || activo.nivel_criticidad_negocio) === 'Alto' || (activo.criticidad || activo.nivel_criticidad_negocio) === 'Critico' ? '#DC2626' : '#065F46'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          {(activo.descripcion || activo.Descripcion || '').substring(0, 100)}
                          {(activo.descripcion || activo.Descripcion || '').length > 100 ? '...' : ''}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No hay activos disponibles</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalTotalActivos(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InformeRiesgos;

