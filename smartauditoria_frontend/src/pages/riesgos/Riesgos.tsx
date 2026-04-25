import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  BugReport as BugReportIcon,
  Lock as LockIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import RiskMatrix from '../../components/common/RiskMatrix';
import RiskMatrix4x5 from '../../components/riesgos/RiskMatrix4x5';
import '../../styles/design-system.css';
import { dashboardService } from '../../services/backend';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Riesgos: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [saludInstitucional, setSaludInstitucional] = useState<any>(null);
  const [riesgosActivosMitigados, setRiesgosActivosMitigados] = useState<any>(null);
  const [topRiesgosCriticos, setTopRiesgosCriticos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [tendenciaRiesgos, setTendenciaRiesgos] = useState<Array<{ mes: string; riesgos: number; mitigados: number }>>([]);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salud, riesgos, topCriticos, alertasData, evolucion] = await Promise.all([
          dashboardService.getSaludInstitucional(),
          dashboardService.getRiesgosActivosMitigados(),
          dashboardService.getTopRiesgosCriticos(),
          dashboardService.getAlertas(),
          dashboardService.getEvolucionRiesgos()
        ]);
        setSaludInstitucional(salud);
        setRiesgosActivosMitigados(riesgos);
        setTopRiesgosCriticos(topCriticos?.riesgos || []);
        setAlertas(alertasData || []);
        setTendenciaRiesgos(evolucion?.evolucion || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // En caso de error, mantener datos vacios
        setTendenciaRiesgos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calcular riesgos por tipo desde top riesgos criticos
  const riesgosPorTipo = React.useMemo(() => {
    const tipoMap: { [key: string]: number } = {};
    topRiesgosCriticos.forEach((riesgo: any) => {
      // Si el riesgo tiene categoria, usarla; si no, inferir del nombre
      const tipo = riesgo.categoria || 'General';
      tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;
    });
    return Object.entries(tipoMap).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      tendencia: '+0'
    }));
  }, [topRiesgosCriticos]);

  // tendenciaRiesgos ahora viene del backend (estado)

  const recomendaciones = [
    {
      id: 1,
      tipo: 'Critica',
      titulo: 'Implementar autenticacion multifactor',
      descripcion: 'Se detectaron 5 riesgos de seguridad relacionados con autenticacion debil',
      prioridad: 'Alta',
      icono: <LockIcon />,
      color: '#EF4444'
    },
    {
      id: 2,
      tipo: 'Importante',
      titulo: 'Actualizar politicas de respaldo',
      descripcion: 'Los controles de respaldo necesitan revision y actualizacion',
      prioridad: 'Media',
      icono: <ShieldIcon />,
      color: '#F59E0B'
    },
    {
      id: 3,
      tipo: 'Preventiva',
      titulo: 'Capacitacion en ciberseguridad',
      descripcion: 'Implementar programa de concientizacion para reducir riesgos humanos',
      prioridad: 'Baja',
      icono: <PublicIcon />,
      color: '#3B82F6'
    },
    {
      id: 4,
      tipo: 'Tecnica',
      titulo: 'Auditoria de vulnerabilidades',
      descripcion: 'Realizar escaneo completo de vulnerabilidades en sistemas criticos',
      prioridad: 'Alta',
      icono: <BugReportIcon />,
      color: '#EF4444'
    }
  ];

  const getNivelSalud = (puntuacion: number) => {
    if (puntuacion >= 80) return { nivel: 'BUENO', color: '#10B981' };
    if (puntuacion >= 60) return { nivel: 'REGULAR', color: '#F59E0B' };
    return { nivel: 'CRITICO', color: '#EF4444' };
  };

  const nivelSalud = saludInstitucional 
    ? getNivelSalud(saludInstitucional.porcentaje || 0)
    : { nivel: 'CARGANDO', color: '#6B7280' };
  
  const saludPuntuacion = saludInstitucional?.porcentaje || 0;
  const saludEstado = saludInstitucional?.estado || 'CARGANDO';
  const riesgosActivos = riesgosActivosMitigados?.activos || 0;
  const riesgosMitigados = riesgosActivosMitigados?.mitigados || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
          Gestion de Riesgos de Seguridad de la Informacion
        </Typography>
        <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
          Monitoreo integral del estado de evaluacion de activos, identificacion de riesgos y salud institucional basado en datos reales del sistema
        </Typography>
      </Box>

      {/* Indicadores Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 3 }}>
          <Card className="card">
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ 
                backgroundColor: nivelSalud.color,
                color: '#FFFFFF',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}>
                <AssessmentIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 700, mb: 1 }}>
                {loading ? '...' : `${Math.round(saludPuntuacion)}%`}
              </Typography>
              <Typography variant="h6" className="font-poppins" sx={{ color: nivelSalud.color, fontWeight: 600, mb: 1 }}>
                {saludEstado === 'BUENO' ? 'BUENO' : saludEstado === 'REGULAR' ? 'REGULAR' : saludEstado === 'CRITICO' ? 'CRITICO' : 'CARGANDO'}
              </Typography>
              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                Salud Institucional
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={loading ? 0 : saludPuntuacion} 
                sx={{ 
                  mt: 2, 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#E5E7EB',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: nivelSalud.color,
                    borderRadius: 4
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 3 }}>
          <Card className="card">
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ 
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}>
                <WarningIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 700, mb: 1 }}>
                {loading ? '...' : riesgosActivos}
              </Typography>
              <Typography variant="h6" className="font-poppins" sx={{ color: '#EF4444', fontWeight: 600, mb: 1 }}>
                Riesgos Activos
              </Typography>
              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                Requieren atencion
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 3 }}>
          <Card className="card">
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ 
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}>
                <CheckCircleIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 700, mb: 1 }}>
                {loading ? '...' : riesgosMitigados}
              </Typography>
              <Typography variant="h6" className="font-poppins" sx={{ color: '#10B981', fontWeight: 600, mb: 1 }}>
                Mitigados
              </Typography>
              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                Este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 3 }}>
          <Card className="card">
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ 
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}>
                <SpeedIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 700, mb: 1 }}>
                {loading ? '...' : saludInstitucional?.porcentaje_evaluacion ? `${Math.round(saludInstitucional.porcentaje_evaluacion)}%` : '0%'}
              </Typography>
              <Typography variant="h6" className="font-poppins" sx={{ color: '#3B82F6', fontWeight: 600, mb: 1 }}>
                Activos Evaluados
              </Typography>
              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                {saludInstitucional?.activos_evaluados || 0} de {saludInstitucional?.total_activos || 0} activos
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={loading ? 0 : (saludInstitucional?.porcentaje_evaluacion || 0)} 
                sx={{ 
                  mt: 1, 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#E5E7EB',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#3B82F6',
                    borderRadius: 3
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card className="card" sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Matriz de Riesgos" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Analisis" icon={<TrendingUpIcon />} iconPosition="start" />
            <Tab label="Recomendaciones" icon={<LightbulbIcon />} iconPosition="start" />
            <Tab label="Tendencias" icon={<TimelineIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 1: Matriz de Riesgos */}
        <TabPanel value={tabValue} index={0}>
          <RiskMatrix4x5 />
        </TabPanel>

        {/* Tab 2: Analisis */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid  size={{ xs: 12, md: 3 }}>
              <Card className="card">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                    Riesgos por Tipo
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riesgosPorTipo}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#1E3A8A" />
                      </BarChart>
                    </ResponsiveContainer>
      </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid  size={{ xs: 12, md: 3 }}>
              <Card className="card">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                    Top Riesgos Criticos
                  </Typography>
                  <Box>
                    {topRiesgosCriticos.length > 0 ? (
                      topRiesgosCriticos.map((riesgo, index) => (
                        <React.Fragment key={`riesgo-${riesgo.nombre}-${index}`}>
                          <Box sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Avatar sx={{ 
                                backgroundColor: riesgo.severidad === 'HIGH' || riesgo.nivel === 'ALTO' ? '#EF4444' : '#F59E0B',
                                color: '#FFFFFF',
                                width: 32,
                                height: 32
                              }}>
                                <WarningIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body1" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 500 }}>
                                  {riesgo.nombre}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={riesgo.nivel || riesgo.severidad}
                                    size="small"
                                    sx={{
                                      backgroundColor: (riesgo.severidad === 'HIGH' || riesgo.nivel === 'ALTO') ? '#EF4444' : '#F59E0B',
                                      color: '#FFFFFF',
                                      fontWeight: 500,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                  {riesgo.activo && (
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                      Activo: {riesgo.activo}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </Box>
                          {index < topRiesgosCriticos.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    ) : (
                      <Box>
                        <ListItemText
                          primary={
                            <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                              No hay riesgos criticos identificados en este momento
                            </Typography>
                          }
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Recomendaciones */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {recomendaciones.map((recomendacion) => (
              <Grid key={recomendacion.id} size={{ xs: 12, md: 3 }}>
                <Card className="card" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar sx={{ 
                        backgroundColor: recomendacion.color,
                        color: '#FFFFFF',
                        width: 48,
                        height: 48
                      }}>
                        {recomendacion.icono}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            label={recomendacion.tipo}
                            size="small"
                            sx={{
                              backgroundColor: recomendacion.color,
                              color: '#FFFFFF',
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                          />
                          <Chip
                            label={recomendacion.prioridad}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: recomendacion.color,
                              color: recomendacion.color,
                              fontWeight: 500,
                              fontSize: '0.75rem'
              }}
            />
          </Box>
                        <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                          {recomendacion.titulo}
                        </Typography>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 2 }}>
                          {recomendacion.descripcion}
                        </Typography>
            <Button
              variant="outlined"
                          size="small"
                          sx={{
                            borderColor: recomendacion.color,
                            color: recomendacion.color,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 500
                          }}
                        >
                          Ver Detalles
            </Button>
          </Box>
        </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab 4: Tendencias */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid  size={{ xs: 12 }}>
              <Card className="card">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                    Evolucion de Riesgos (Ãšltimos 6 meses)
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ color: '#6B7280' }}>Cargando datos...</Typography>
                      </Box>
                    ) : tendenciaRiesgos.length === 0 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography sx={{ color: '#6B7280' }}>No hay datos de evolucion disponibles</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tendenciaRiesgos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="riesgos" stroke="#EF4444" strokeWidth={3} name="Riesgos Identificados" />
                          <Line type="monotone" dataKey="mitigados" stroke="#10B981" strokeWidth={3} name="Riesgos Mitigados" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Alertas Criticas - Datos Reales */}
      {alertas.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alertas.map((alerta, index) => {
            const severity = alerta.severidad === 'alta' ? 'error' : alerta.severidad === 'media' ? 'warning' : 'info';
            return (
              <Alert 
                key={`alerta-${alerta.tipo}-${index}`}
                severity={severity as any}
                sx={{ 
                  mb: 2,
                  borderRadius: '12px',
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                  âš ï¸ Atencion Requerida
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }} component="div">
                    {alerta.mensaje}
                  </Typography>
                  {alerta.cantidad && (
                    <Chip 
                      label={alerta.cantidad} 
                      size="small" 
                      sx={{ 
                        backgroundColor: alerta.severidad === 'alta' ? '#EF4444' : '#F59E0B',
                        color: '#FFFFFF',
                        fontWeight: 600
                      }} 
                    />
                  )}
                </Box>
              </Alert>
            );
          })}
        </Box>
      )}
      
      {/* Alerta de riesgos criticos si hay top riesgos criticos */}
      {topRiesgosCriticos.length > 0 && topRiesgosCriticos.filter((r: any) => r.severidad === 'HIGH' || r.nivel === 'ALTO').length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '12px',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
            âš ï¸ Riesgos Criticos Identificados
          </Typography>
          <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
            Se han identificado {topRiesgosCriticos.filter((r: any) => r.severidad === 'HIGH' || r.nivel === 'ALTO').length} riesgo(s) critico(s) que requieren atencion inmediata. 
            Se recomienda revisar la pestana "Analisis" para ver los detalles y las recomendaciones prioritarias.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default Riesgos;
