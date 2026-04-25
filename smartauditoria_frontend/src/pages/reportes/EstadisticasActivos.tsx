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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { dashboardService } from '../../services/backend';
import '../../styles/design-system.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const EstadisticasActivos: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getEstadisticasActivos();
      setEstadisticas(data);
    } catch (error: any) {
      console.error('Error cargando estadisticas:', error);
      toast.error('Error al cargar las estadisticas de activos');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para graficos
  const datosPorTipo = React.useMemo(() => {
    if (!estadisticas?.por_tipo) return [];
    return Object.entries(estadisticas.por_tipo).map(([tipo, count]) => ({
      name: tipo,
      value: count,
    }));
  }, [estadisticas]);

  const datosPorEstado = React.useMemo(() => {
    if (!estadisticas?.por_estado) return [];
    return Object.entries(estadisticas.por_estado).map(([estado, count]) => ({
      name: estado,
      value: count,
    }));
  }, [estadisticas]);

  const datosPorCriticidad = React.useMemo(() => {
    if (!estadisticas?.por_criticidad) return [];
    return Object.entries(estadisticas.por_criticidad).map(([criticidad, count]) => ({
      name: criticidad,
      value: count,
    }));
  }, [estadisticas]);

  const datosBackup = React.useMemo(() => {
    if (!estadisticas?.backup) return [];
    return [
      { name: 'Con Backup', value: estadisticas.backup.con_backup },
      { name: 'Sin Backup', value: estadisticas.backup.sin_backup },
    ];
  }, [estadisticas]);

  const datosEvaluacion = React.useMemo(() => {
    if (!estadisticas?.evaluacion) return [];
    return [
      { name: 'Evaluados', value: estadisticas.evaluacion.evaluados },
      { name: 'No Evaluados', value: estadisticas.evaluacion.no_evaluados },
    ];
  }, [estadisticas]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!estadisticas) {
    return (
      <Box p={3}>
        <Alert severity="error">
          No se pudieron cargar las estadisticas de activos. Intente de nuevo mas tarde.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton onClick={() => navigate('/reportes')} sx={{ color: '#1E3A8A' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
          Estadisticas de Activos
        </Typography>
      </Stack>

      <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280', mb: 4 }}>
        Analisis detallado de la distribucion y estado de los activos del sistema.
      </Typography>

      {/* Cards de Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {estadisticas.total_activos}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Total Activos
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
                    {estadisticas.evaluacion?.evaluados || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Activos Evaluados
                  </Typography>
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#10B981' }}>
                    {estadisticas.evaluacion?.porcentaje_evaluados?.toFixed(1) || 0}%
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: '#10B981' }} />
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
                    {estadisticas.criticos?.sin_evaluar || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Criticos Sin Evaluar
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: '#EF4444' }} />
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
                    {estadisticas.backup?.con_backup || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Con Backup Configurado
                  </Typography>
                </Box>
                <BackupIcon sx={{ fontSize: 40, color: '#10B981' }} />
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
              title="Activos por Tipo"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardHeader
              title="Activos por Estado"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosPorEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardHeader
              title="Activos por Criticidad"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosPorCriticidad}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardHeader
              title="Estado de Backup"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosBackup}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosBackup.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid  size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardHeader
              title="Estado de Evaluacion"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosEvaluacion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosEvaluacion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EstadisticasActivos;





