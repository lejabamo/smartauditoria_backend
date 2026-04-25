import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  Download,
  FilterList,
  Close
} from '@mui/icons-material';
import { dashboardService } from '../../services/backend';

// Tipos de datos
interface Risk {
  id: number;
  nombre: string;
  nivel: 'LOW' | 'MEDIUM' | 'HIGH';
  propietario: string;
  fecha: string;
  activo: string;
  proceso: string;
}

interface MatrixCell {
  probabilidad_key: string;
  impacto_key: string;
  count: number;
  risks: Risk[];
}

interface HealthData {
  low: number;
  medium: number;
  high: number;
  score: number;
}

interface MatrixData {
  cells: MatrixCell[];
  health: HealthData;
}

interface MatrizRiesgoBackend {
  cantidad: number;
  nivel: 'BAJO' | 'MEDIO' | 'ALTO';
}

// Configuracion de la matriz
const PROBABILIDADES = ['Frecuente', 'Ocasional', 'Posible', 'Improbable'];
const IMPACTOS = ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrofico'];

// Mapeo de niveles de riesgo
const RISK_LEVELS = {
  'BAJO': { color: '#27AE60', label: 'BAJO' },
  'MEDIO': { color: '#FACC15', label: 'MEDIO' },
  'ALTO': { color: '#D9534F', label: 'ALTO' }
};

// Funcion para calcular nivel de riesgo (fallback)
const calculateRiskLevel = (probabilidad: string, impacto: string): 'BAJO' | 'MEDIO' | 'ALTO' => {
  const probValues: { [key: string]: number } = {
    'Improbable': 1,
    'Posible': 2,
    'Ocasional': 3,
    'Frecuente': 4
  };
  
  const impactoValues: { [key: string]: number } = {
    'Insignificante': 1,
    'Menor': 2,
    'Moderado': 3,
    'Mayor': 4,
    'Catastrofico': 5
  };
  
  const score = probValues[probabilidad] * impactoValues[impacto];
  
  if (score <= 6) return 'BAJO';
  if (score <= 11) return 'MEDIO';
  return 'ALTO';
};

// Funcion para obtener recomendaciones
const getRecommendations = (level: 'BAJO' | 'MEDIO' | 'ALTO'): string => {
  const recommendations = {
    'BAJO': 'Monitoreo periodico',
    'MEDIO': 'Evaluar controles y planificar tratamiento',
    'ALTO': 'Priorizar plan de mitigacion y asignar responsable'
  };
  return recommendations[level];
};

// Funcion para obtener estado de salud
const getHealthStatus = (score: number): { status: string; color: string } => {
  if (score >= 70) return { status: 'Salud Buena', color: '#27AE60' };
  if (score >= 40) return { status: 'Salud Moderada', color: '#FACC15' };
  return { status: 'Salud Critica', color: '#D9534F' };
};

const RiskMatrix4x5: React.FC = () => {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    activo_id: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activosList, setActivosList] = useState<any[]>([]);
  const [totalActivosEvaluados, setTotalActivosEvaluados] = useState<number>(0);

  // Datos de ejemplo (simulando respuesta del backend)
  const mockData: MatrixData = {
    cells: [
      {
        probabilidad_key: 'Frecuente',
        impacto_key: 'Insignificante',
        count: 3,
        risks: [
          { id: 1, nombre: 'Falla de sistema menor', nivel: 'MEDIUM', propietario: 'Juan Perez', fecha: '2025-01-15', activo: 'Servidor Web', proceso: 'Operaciones' },
          { id: 2, nombre: 'Interrupcion temporal', nivel: 'MEDIUM', propietario: 'Maria Garcia', fecha: '2025-01-10', activo: 'Base de Datos', proceso: 'Desarrollo' }
        ]
      },
      {
        probabilidad_key: 'Frecuente',
        impacto_key: 'Menor',
        count: 2,
        risks: [
          { id: 3, nombre: 'Error de configuracion', nivel: 'MEDIUM', propietario: 'Carlos Lopez', fecha: '2025-01-12', activo: 'Firewall', proceso: 'Seguridad' }
        ]
      },
      {
        probabilidad_key: 'Frecuente',
        impacto_key: 'Moderado',
        count: 5,
        risks: [
          { id: 4, nombre: 'Brecha de seguridad', nivel: 'HIGH', propietario: 'Ana Martinez', fecha: '2025-01-08', activo: 'Sistema de Autenticacion', proceso: 'Seguridad' },
          { id: 5, nombre: 'Perdida de datos', nivel: 'HIGH', propietario: 'Luis Rodriguez', fecha: '2025-01-05', activo: 'Backup System', proceso: 'Operaciones' }
        ]
      },
      {
        probabilidad_key: 'Ocasional',
        impacto_key: 'Insignificante',
        count: 1,
        risks: [
          { id: 6, nombre: 'Retraso menor', nivel: 'LOW', propietario: 'Pedro Sanchez', fecha: '2025-01-14', activo: 'Sistema de Reportes', proceso: 'Administracion' }
        ]
      },
      {
        probabilidad_key: 'Ocasional',
        impacto_key: 'Menor',
        count: 4,
        risks: [
          { id: 7, nombre: 'Falla de red', nivel: 'MEDIUM', propietario: 'Elena Ruiz', fecha: '2025-01-11', activo: 'Router Principal', proceso: 'Infraestructura' }
        ]
      },
      {
        probabilidad_key: 'Posible',
        impacto_key: 'Insignificante',
        count: 2,
        risks: [
          { id: 8, nombre: 'Actualizacion pendiente', nivel: 'LOW', propietario: 'Miguel Torres', fecha: '2025-01-13', activo: 'Sistema de Monitoreo', proceso: 'Mantenimiento' }
        ]
      },
      {
        probabilidad_key: 'Improbable',
        impacto_key: 'Catastrofico',
        count: 1,
        risks: [
          { id: 9, nombre: 'Desastre natural', nivel: 'MEDIUM', propietario: 'Sistema', fecha: '2025-01-01', activo: 'Centro de Datos', proceso: 'Infraestructura' }
        ]
      }
    ],
    health: {
      low: 40,
      medium: 35,
      high: 25,
      score: 71
    }
  };

  useEffect(() => {
    fetchMatrixData();
  }, [filters]);

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      // Construir parametros de filtro
      const params: any = {};
      if (filters.activo_id) params.activo_id = parseInt(filters.activo_id);
      if (filters.fechaInicio) params.fecha_inicio = filters.fechaInicio;
      if (filters.fechaFin) params.fecha_fin = filters.fechaFin;
      
      // Obtener datos reales desde el backend con filtros
      const backendData = await dashboardService.getMatrizRiesgos(params);
        
        if (backendData && backendData.matriz) {
          // Convertir datos del backend al formato del componente
          const cells: MatrixCell[] = [];
          
          backendData.matriz.forEach((row: any[], probIdx: number) => {
            row.forEach((cell, impIdx) => {
              if (cell.cantidad > 0) {
                // Convertir activos del backend al formato del componente
                // Ahora cell.activos contiene los activos evaluados, no riesgos individuales
                const risks: Risk[] = (cell.activos || []).map((activo: any) => ({
                  id: activo.id || 0,
                  nombre: activo.nombre || 'Sin nombre',
                  nivel: (activo.nivel_riesgo === 'ALTO' ? 'HIGH' : 
                         activo.nivel_riesgo === 'MEDIO' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
                  propietario: activo.propietario || 'No asignado',
                  fecha: activo.fecha || new Date().toISOString().split('T')[0],
                  activo: activo.nombre || 'Sin activo',
                  proceso: 'Evaluacion'
                }));
                
                cells.push({
                  probabilidad_key: PROBABILIDADES[probIdx],
                  impacto_key: IMPACTOS[impIdx],
                  count: cell.cantidad, // Ahora cuenta activos, no riesgos
                  risks: risks
                });
              }
            });
          });
          
          // Obtener salud institucional real del backend
          try {
            const saludData = await dashboardService.getSaludInstitucional();
            const totalActivos = backendData.estadisticas.total || 0;
            
            // Verificar que la suma de celdas coincida con el total
            const sumaCeldas = cells.reduce((sum, cell) => sum + cell.count, 0);
            console.log(`Total activos evaluados (backend): ${totalActivos}, Suma de celdas: ${sumaCeldas}`);
            
            if (sumaCeldas !== totalActivos && totalActivos > 0) {
              console.warn(`âš ï¸ Advertencia: La suma de celdas (${sumaCeldas}) no coincide con el total de activos evaluados (${totalActivos})`);
            }
            
            setTotalActivosEvaluados(totalActivos);
            
            // Calcular porcentajes de distribucion basados en total real
            const health: HealthData = {
              low: saludData.distribucion?.bajos || 0,
              medium: saludData.distribucion?.medios || 0,
              high: saludData.distribucion?.altos || 0,
              score: saludData.porcentaje || 0  // Usar el score calculado por el backend
            };
            
            setMatrixData({ cells, health });
          } catch (error) {
            console.error('Error fetching salud institucional:', error);
            // Fallback a calculo local si falla
            const health: HealthData = {
              low: backendData.estadisticas.bajos || 0,
              medium: backendData.estadisticas.medios || 0,
              high: backendData.estadisticas.altos || 0,
              score: 0
            };
            setMatrixData({ cells, health });
          }
        } else {
          // Usar datos mock si no hay datos del backend
          setMatrixData(mockData);
        }
      } catch (error) {
        console.error('Error fetching matrix data:', error);
        // Usar datos mock en caso de error
        setMatrixData(mockData);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    // Cargar lista de activos para el filtro
    const loadActivos = async () => {
      try {
        const activos = await dashboardService.getActivos();
        setActivosList(activos || []);
      } catch (error) {
        console.error('Error loading activos:', error);
      }
    };
    loadActivos();
  }, []);

  const handleCellClick = (cell: MatrixCell) => {
    setSelectedCell(cell);
    setModalOpen(true);
  };

  const handleExport = async (format: 'PDF' | 'CSV') => {
    try {
      setLoading(true);
      // Construir parametros de filtro
      const params: any = {};
      if (filters.activo_id) params.activo_id = parseInt(filters.activo_id);
      if (filters.fechaInicio) params.fecha_inicio = filters.fechaInicio;
      if (filters.fechaFin) params.fecha_fin = filters.fechaFin;
      
      // Obtener datos del reporte
      const reporte = await dashboardService.exportarMatrizRiesgos(params);
      
      if (format === 'CSV') {
        // Generar CSV
        let csv = 'Activo ID,Nombre Activo,Tipo,Criticidad,Estado,Riesgo ID,Nombre Riesgo,Probabilidad,Impacto,Nivel Riesgo,Fecha Evaluacion,Evaluador\n';
        
        reporte.activos.forEach((activo: any) => {
          activo.evaluaciones.forEach((evaluacion: any) => {
            csv += `"${activo.id}","${activo.nombre}","${activo.tipo || ''}","${activo.criticidad || ''}","${activo.estado || ''}",`;
            csv += `"${evaluacion.id_riesgo}","${evaluacion.nombre_riesgo}","${evaluacion.probabilidad || ''}","${evaluacion.impacto || ''}","${evaluacion.nivel_riesgo || ''}",`;
            csv += `"${evaluacion.fecha_evaluacion || ''}","${evaluacion.evaluador || ''}"\n`;
          });
        });
        
        // Descargar CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_activos_evaluados_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generar PDF usando jsPDF
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF();
        let yPosition = 20;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Titulo
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Reporte de Activos Evaluados', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Fecha de generacion: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
        pdf.text(`Total de activos: ${reporte.total_activos}`, pageWidth / 2, yPosition + 5, { align: 'center' });
        yPosition += 15;
        
        // Contenido
        reporte.activos.forEach((activo: any, idx: number) => {
          // Verificar si necesitamos nueva pagina
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Informacion del activo
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${idx + 1}. ${activo.nombre}`, 20, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Tipo: ${activo.tipo || 'N/A'} | Criticidad: ${activo.criticidad || 'N/A'} | Estado: ${activo.estado || 'N/A'}`, 20, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Evaluaciones (${activo.evaluaciones.length}):`, 20, yPosition);
          yPosition += 5;
          
          activo.evaluaciones.forEach((evaluacion: any) => {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`  â€¢ ${evaluacion.nombre_riesgo}`, 25, yPosition);
            yPosition += 5;
            pdf.text(`    Probabilidad: ${evaluacion.probabilidad || 'N/A'} | Impacto: ${evaluacion.impacto || 'N/A'} | Nivel: ${evaluacion.nivel_riesgo || 'N/A'}`, 25, yPosition);
            yPosition += 5;
            pdf.text(`    Fecha: ${evaluacion.fecha_evaluacion || 'N/A'} | Evaluador: ${evaluacion.evaluador || 'N/A'}`, 25, yPosition);
            yPosition += 8;
          });
          
          yPosition += 5;
        });
        
        // Descargar PDF
        pdf.save(`reporte_activos_evaluados_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error al exportar el reporte. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (probabilidad: string, impacto: string): MatrixCell | null => {
    if (!matrixData) return null;
    return matrixData.cells.find(
      cell => cell.probabilidad_key === probabilidad && cell.impacto_key === impacto
    ) || null;
  };

  const getRiskLevel = (probabilidad: string, impacto: string): 'BAJO' | 'MEDIO' | 'ALTO' => {
    const cell = getCellData(probabilidad, impacto);
    if (cell && cell.risks.length > 0) {
      // Si hay riesgos, usar el nivel mas alto
      const levels = cell.risks.map(risk => risk.nivel);
      if (levels.includes('HIGH')) return 'ALTO';
      if (levels.includes('MEDIUM')) return 'MEDIO';
      return 'BAJO';
    }
    // Fallback al calculo local
    return calculateRiskLevel(probabilidad, impacto);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Cargando matriz de riesgos...
        </Typography>
      </Box>
    );
  }

  if (!matrixData) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Error al cargar los datos de la matriz de riesgos
      </Alert>
    );
  }

  const healthStatus = getHealthStatus(matrixData.health.score);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Matriz de Riesgos - Optimizada para ancho total */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 0.5 }}>
                    Matriz de Evaluacion de Riesgo
                  </Typography>
                  {totalActivosEvaluados > 0 && (
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Total de activos evaluados: {totalActivosEvaluados}
                      {matrixData && (
                        <span style={{ color: '#9CA3AF', marginLeft: '8px' }}>
                          (Suma de celdas: {matrixData.cells.reduce((sum, cell) => sum + cell.count, 0)})
                        </span>
                      )}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                    onClick={() => setFiltersOpen(true)}
                  >
                    Filtros
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                    onClick={() => {
                      const format = window.confirm('Â¿Exportar como PDF? (Cancelar para CSV)') ? 'PDF' : 'CSV';
                      handleExport(format);
                    }}
                  >
                    Exportar
                  </Button>
                </Stack>
              </Box>

              {/* Matriz Grid */}
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: '600px' }}>
                  {/* Header con etiquetas de impacto */}
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Box sx={{ width: '120px' }} /> {/* Espacio para etiquetas de probabilidad */}
                    {IMPACTOS.map((impacto) => (
                      <Box
                        key={impacto}
                        sx={{
                          flex: 1,
                          textAlign: 'center',
                          py: 1,
                          px: 0.5
                        }}
                      >
                        <Typography
                          variant="body2"
                          className="font-roboto"
                          sx={{
                            color: '#1E3A8A',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            lineHeight: 1.2
                          }}
                        >
                          {impacto}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Filas de la matriz */}
                  {PROBABILIDADES.map((probabilidad) => (
                    <Box key={probabilidad} sx={{ display: 'flex', mb: 1 }}>
                      {/* Etiqueta de probabilidad */}
                      <Box
                        sx={{
                          width: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          pr: 2
                        }}
                      >
                        <Typography
                          variant="body2"
                          className="font-roboto"
                          sx={{
                            color: '#1E3A8A',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        >
                          {probabilidad}
                        </Typography>
                      </Box>

                      {/* Celdas de la matriz */}
                      {IMPACTOS.map((impacto) => {
                        const cellData = getCellData(probabilidad, impacto);
                        const riskLevel = getRiskLevel(probabilidad, impacto);
                        const levelConfig = RISK_LEVELS[riskLevel];
                        const count = cellData?.count || 0;

                        return (
                          <Tooltip
                            key={`${probabilidad}-${impacto}`}
                            title={
                              cellData && cellData.risks.length > 0 ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Top 3 Riesgos:
                                  </Typography>
                                  {cellData.risks.slice(0, 3).map((risk) => (
                                    <Box key={risk.id} sx={{ mb: 0.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block' }}>
                                        {risk.nombre} - {risk.propietario}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                        {risk.fecha}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                'Sin riesgos registrados'
                              )
                            }
                            arrow
                          >
                            <Box
                              onClick={() => cellData && handleCellClick(cellData)}
                              sx={{
                                flex: 1,
                                height: '60px',
                                backgroundColor: levelConfig.color,
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: cellData ? 'pointer' : 'default',
                                border: '2px solid transparent',
                                transition: 'all 0.2s ease',
                                mx: 0.5,
                                '&:hover': cellData ? {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  border: '2px solid #1E3A8A'
                                } : {}
                              }}
                            >
                              <Typography
                                variant="h6"
                                className="font-poppins"
                                sx={{
                                  color: '#FFFFFF',
                                  fontWeight: 700,
                                  fontSize: '1.2rem',
                                  lineHeight: 1
                                }}
                              >
                                {count}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="font-roboto"
                                sx={{
                                  color: '#FFFFFF',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  opacity: 0.9
                                }}
                              >
                                {levelConfig.label}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Leyenda */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                {Object.entries(RISK_LEVELS).map(([level, config]) => (
                  <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        backgroundColor: config.color,
                        borderRadius: '4px'
                      }}
                    />
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      {config.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
          </Grid>
      </Grid>

      {/* Modal de Detalles */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
            Activos Evaluados: {selectedCell?.probabilidad_key} - {selectedCell?.impacto_key}
          </Typography>
          <IconButton onClick={() => setModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedCell && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
                  Total de activos evaluados: {selectedCell.count}
                </Typography>
                <Chip
                  label={getRiskLevel(selectedCell.probabilidad_key, selectedCell.impacto_key)}
                  sx={{
                    backgroundColor: RISK_LEVELS[getRiskLevel(selectedCell.probabilidad_key, selectedCell.impacto_key)].color,
                    color: '#FFFFFF',
                    fontWeight: 600
                  }}
                />
              </Box>

              <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Activo</TableCell>
                      <TableCell>Nivel de Riesgo</TableCell>
                      <TableCell>Evaluador</TableCell>
                      <TableCell>Fecha Evaluacion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedCell.risks.map((activo) => (
                      <TableRow key={activo.id}>
                        <TableCell>
                          <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500 }}>
                            {activo.activo || activo.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activo.nivel === 'HIGH' ? 'ALTO' : activo.nivel === 'MEDIUM' ? 'MEDIO' : 'BAJO'}
                            size="small"
                            sx={{
                              backgroundColor: RISK_LEVELS[activo.nivel === 'HIGH' ? 'ALTO' : activo.nivel === 'MEDIUM' ? 'MEDIO' : 'BAJO'].color,
                              color: '#FFFFFF',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell>{activo.propietario}</TableCell>
                        <TableCell>{activo.fecha}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={() => handleExport('PDF')}
            sx={{ borderRadius: '8px' }}
          >
            Exportar Reporte
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Filtros */}
      <Dialog 
        open={filtersOpen} 
        onClose={() => setFiltersOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
              Filtros de Matriz de Riesgos
            </Typography>
            <IconButton
              size="small"
              onClick={() => setFiltersOpen(false)}
              sx={{ color: '#6B7280' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 3, pb: 3 }}>
          <Grid container spacing={3}>
            <Grid  size={{ xs: 12 }}>
              <Autocomplete
                options={activosList}
                getOptionLabel={(option) => option.Nombre || option.nombre || 'Sin nombre'}
                value={activosList.find(a => (a.ID_Activo || a.id)?.toString() === filters.activo_id) || null}
                onChange={(event, newValue) => {
                  setFilters({
                    ...filters,
                    activo_id: newValue ? (newValue.ID_Activo || newValue.id)?.toString() || '' : ''
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Activo"
                    placeholder="Seleccionar activo (opcional)"
                    className="input"
                    InputProps={{
                      ...params.InputProps,
                      sx: { borderRadius: '12px' }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.ID_Activo || option.id}>
                    <Typography variant="body2">
                      {option.Nombre || option.nombre || 'Sin nombre'}
                    </Typography>
                  </Box>
                )}
              />
            </Grid>
            <Grid  size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Inicio"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                className="input"
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
            </Grid>
            <Grid  size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Fin"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                className="input"
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => {
              setFilters({
                activo_id: '',
                fechaInicio: '',
                fechaFin: ''
              });
            }}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Limpiar Filtros
          </Button>
          <Button
            onClick={() => setFiltersOpen(false)}
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              backgroundColor: '#1E3A8A',
              '&:hover': { backgroundColor: '#1E40AF' }
            }}
          >
            Aplicar Filtros
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskMatrix4x5;
