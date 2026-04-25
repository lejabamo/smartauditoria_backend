import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
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
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { dashboardService } from '../../services/backend';
import '../../styles/design-system.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const TendenciasSeguridad: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tendenciasData, setTendenciasData] = useState<any>(null);

  useEffect(() => {
    cargarTendencias();
  }, []);

  const cargarTendencias = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getTendenciasSeguridad();
      setTendenciasData(data);
    } catch (error: any) {
      console.error('Error cargando tendencias:', error);
      toast.error('Error al cargar las tendencias de seguridad');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para graficos
  const datosPorCategoria = React.useMemo(() => {
    if (!tendenciasData?.estadisticas?.por_categoria) return [];
    return Object.entries(tendenciasData.estadisticas.por_categoria).map(([categoria, data]: [string, any]) => ({
      categoria,
      total: data.total,
      con_controles: data.con_controles,
      sin_controles: data.total - data.con_controles,
    }));
  }, [tendenciasData]);

  const datosComparacionRiesgo = React.useMemo(() => {
    if (!tendenciasData?.riesgos) return [];
    const niveles = { 'Bajo': 1, 'Medio': 2, 'Alto': 3 };
    const inherente = { 'Bajo': 0, 'Medio': 0, 'Alto': 0 };
    const residual = { 'Bajo': 0, 'Medio': 0, 'Alto': 0 };

    tendenciasData.riesgos.forEach((riesgo: any) => {
      if (riesgo.evaluacion_inherente?.nivel) {
        const nivel = riesgo.evaluacion_inherente.nivel;
        if (nivel in inherente) {
          inherente[nivel as keyof typeof inherente]++;
        }
      }
      if (riesgo.evaluacion_residual?.nivel) {
        const nivel = riesgo.evaluacion_residual.nivel;
        if (nivel in residual) {
          residual[nivel as keyof typeof residual]++;
        }
      }
    });

    return [
      { nivel: 'Bajo', Inherente: inherente.Bajo, Residual: residual.Bajo },
      { nivel: 'Medio', Inherente: inherente.Medio, Residual: residual.Medio },
      { nivel: 'Alto', Inherente: inherente.Alto, Residual: residual.Alto },
    ];
  }, [tendenciasData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tendenciasData) {
    return (
      <Box p={3}>
        <Alert severity="error">
          No se pudieron cargar las tendencias de seguridad. Intente de nuevo mas tarde.
        </Alert>
      </Box>
    );
  }

  const { estadisticas, riesgos } = tendenciasData;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton onClick={() => navigate('/reportes')} sx={{ color: '#1E3A8A' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
          Tendencias de Seguridad
        </Typography>
      </Stack>

      <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280', mb: 4 }}>
        Analisis de riesgos identificados, controles aplicados y efectividad de las medidas de mitigacion.
      </Typography>

      {/* Cards de Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {estadisticas?.total_riesgos || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Total Riesgos Evaluados
                  </Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {estadisticas?.con_controles || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Con Controles Aplicados
                  </Typography>
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#10B981' }}>
                    {estadisticas?.total_riesgos > 0
                      ? ((estadisticas.con_controles / estadisticas.total_riesgos) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                </Box>
                <ShieldIcon sx={{ fontSize: 40, color: '#10B981' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {estadisticas?.sin_controles || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Sin Controles
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 40, color: '#EF4444' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {estadisticas?.mejora_riesgo || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Riesgos Mejorados
                  </Typography>
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#10B981' }}>
                    Inherente â†’ Residual
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: '#10B981' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardHeader
              title="Riesgos por Categoria"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="con_controles" name="Con Controles" fill="#10B981" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="sin_controles" name="Sin Controles" fill="#EF4444" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardHeader
              title="Comparacion Inherente vs Residual"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosComparacionRiesgo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nivel" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Inherente" name="Riesgo Inherente" fill="#F59E0B" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="Residual" name="Riesgo Residual" fill="#10B981" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Riesgos */}
      <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
        <CardHeader
          title="Detalle de Riesgos y Controles"
          titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
        />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    Riesgo
                  </TableCell>
                  <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    Activo
                  </TableCell>
                  <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    Nivel Inherente
                  </TableCell>
                  <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    Nivel Residual
                  </TableCell>
                  <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                    Controles
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riesgos && riesgos.length > 0 ? (
                  riesgos.slice(0, 20).map((riesgo: any, index: number) => (
                    <TableRow key={`riesgo-${riesgo.id_riesgo}-${index}`}>
                      <TableCell>
                        <Typography variant="body2" className="font-poppins" sx={{ fontWeight: 500 }}>
                          {riesgo.nombre_riesgo}
                        </Typography>
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                          {riesgo.categoria}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-roboto">
                          {riesgo.activo?.nombre || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={riesgo.evaluacion_inherente?.nivel || 'N/A'}
                          size="small"
                          sx={{
                            backgroundColor:
                              riesgo.evaluacion_inherente?.nivel === 'Alto'
                                ? '#FEE2E2'
                                : riesgo.evaluacion_inherente?.nivel === 'Medio'
                                ? '#FEF3C7'
                                : '#D1FAE5',
                            color:
                              riesgo.evaluacion_inherente?.nivel === 'Alto'
                                ? '#DC2626'
                                : riesgo.evaluacion_inherente?.nivel === 'Medio'
                                ? '#D97706'
                                : '#059669',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {riesgo.evaluacion_residual ? (
                          <Chip
                            label={riesgo.evaluacion_residual.nivel}
                            size="small"
                            sx={{
                              backgroundColor:
                                riesgo.evaluacion_residual.nivel === 'Alto'
                                  ? '#FEE2E2'
                                  : riesgo.evaluacion_residual.nivel === 'Medio'
                                  ? '#FEF3C7'
                                  : '#D1FAE5',
                            color:
                              riesgo.evaluacion_residual.nivel === 'Alto'
                                ? '#DC2626'
                                : riesgo.evaluacion_residual.nivel === 'Medio'
                                ? '#D97706'
                                : '#059669',
                              fontWeight: 500,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                            No evaluado
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {riesgo.controles?.aplicados > 0 ? (
                          <Box>
                            <Chip
                              icon={<CheckCircleIcon />}
                              label={`${riesgo.controles.aplicados} aplicado(s)`}
                              size="small"
                              sx={{
                                backgroundColor: '#D1FAE5',
                                color: '#059669',
                                fontWeight: 500,
                                mb: 0.5,
                              }}
                            />
                            {riesgo.controles.nombres && riesgo.controles.nombres.length > 0 && (
                              <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block' }}>
                                {riesgo.controles.nombres.slice(0, 2).join(', ')}
                                {riesgo.controles.nombres.length > 2 && '...'}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label="Sin controles"
                            size="small"
                            sx={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              fontWeight: 500,
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                        No hay riesgos evaluados para mostrar
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TendenciasSeguridad;





