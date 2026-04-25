import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Stack,
  Tooltip
} from "@mui/material";
import {
  Security,
  People,
  Assessment,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  Remove,
  InfoOutlined,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { dashboardService } from "../../services/backend";
import { evaluacionRiesgosService } from "../../services/evaluacionRiesgos";
import type { DashboardHistory } from "../../services/backend";
import RiskMatrix4x5 from "../../components/riesgos/RiskMatrix4x5";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { title: "Salud Institucional", value: "0%", icon: <Security />, color: "#1976d2" },
    { title: "Riesgos Activos", value: "0", icon: <Assessment />, color: "#f57c00" },
    { title: "Mitigados", value: "0", icon: <CheckCircleIcon />, color: "#388e3c" },
    { title: "Tendencia", value: "0%", icon: <TrendingUp />, color: "#7b1fa2" },
  ]);
  const [assetsByType, setAssetsByType] = useState<{[key: string]: number}>({});
  const [risksByLevel, setRisksByLevel] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<DashboardHistory | null>(null);
  const [sisInfoBy, setSisInfoBy] = useState<'criticidad' | 'secretaria'>('criticidad');
  const [sisInfoBreakdown, setSisInfoBreakdown] = useState<{ [key: string]: number }>({});
  const [evaluacionStats, setEvaluacionStats] = useState({
    total_riesgos: 0,
    riesgos_evaluados: 0,
    riesgos_pendientes: 0,
    porcentaje_evaluacion: 0,
    distribucion_niveles: {} as { [key: string]: number }
  });
  const [saludInstitucional, setSaludInstitucional] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [sisInfoBy]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, evalStats, sisInfo, salud] = await Promise.all([
        dashboardService.getStats(),
        evaluacionRiesgosService.getEstadisticas(),
        dashboardService.getSistemasInfoBreakdown(sisInfoBy),
        dashboardService.getSaludInstitucional()
      ]);

      const tendencia = dashboardStats.tendencia || 0;
      const tendenciaColor = tendencia > 0 ? "#2e7d32" : tendencia < 0 ? "#c62828" : "#6b7280";
      const tendenciaIcon = tendencia > 0 ? <ArrowUpward /> : tendencia < 0 ? <ArrowDownward /> : <Remove />;

      const saludValue = salud?.porcentaje || 0;
      
      setStats([
        { title: "Salud Institucional", value: `${Math.round(saludValue)}%`, icon: <Security />, color: saludValue >= 80 ? "#2e7d32" : saludValue >= 60 ? "#f57c00" : "#c62828" },
        { title: "Riesgos Activos", value: String(dashboardStats.riesgos_identificados || 0), icon: <Assessment />, color: "#f57c00" },
        { title: "Mitigados", value: String(dashboardStats.riesgos_mitigados || 0), icon: <CheckCircleIcon />, color: "#388e3c" },
        { title: "Tendencia", value: `${tendencia > 0 ? '+' : ''}${tendencia}%`, icon: tendenciaIcon, color: tendenciaColor },
      ]);

      setAssetsByType(dashboardStats.activos_por_tipo || {});
      setRisksByLevel(evalStats.riesgos_evaluados > 0 ? evalStats.distribucion_niveles : dashboardStats.riesgos_por_estado || {});
      setSisInfoBreakdown(sisInfo.data || {});
      setEvaluacionStats(evalStats);
      setSaludInstitucional(salud);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1440px', mx: 'auto', backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: "#1E293B", mb: 1 }}>
            SmartAuditorIA
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, color: "#64748B" }}>
            Panel de Control Estratégico de Riesgos
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Última actualización: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              borderRadius: '16px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #E2E8F0',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    backgroundColor: `${stat.color}15`, 
                    color: stat.color, 
                    borderRadius: '12px', 
                    p: 1.5, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: stat.title === 'Tendencia' ? stat.color : "#1E293B" }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Section: Matrix & Health (THE CORE) */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1E293B', fontFamily: "'Poppins', sans-serif" }}>
                Matriz de Riesgos Institucional
              </Typography>
              <Tooltip title="Distribución de activos según Probabilidad vs Impacto">
                <InfoOutlined sx={{ color: '#94A3B8' }} />
              </Tooltip>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <LinearProgress sx={{ width: '50%' }} />
              </Box>
            ) : (
              <RiskMatrix4x5 />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1E293B', fontFamily: "'Poppins', sans-serif", mb: 4, textAlign: 'center' }}>
              Salud del Sistema
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <LinearProgress sx={{ width: '80%' }} />
              </Box>
            ) : saludInstitucional ? (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                  <Typography variant="h1" sx={{ fontWeight: 800, color: saludInstitucional.porcentaje >= 80 ? '#10B981' : saludInstitucional.porcentaje >= 60 ? '#F59E0B' : '#EF4444', mb: 1 }}>
                    {Math.round(saludInstitucional.porcentaje)}%
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: saludInstitucional.estado === 'BUENO' ? '#10B981' : saludInstitucional.estado === 'REGULAR' ? '#F59E0B' : '#EF4444', letterSpacing: '1px' }}>
                    {saludInstitucional.estado === 'BUENO' ? 'CUMPLIMIENTO ÓPTIMO' : saludInstitucional.estado === 'REGULAR' ? 'RIESGO MODERADO' : 'ESTADO CRÍTICO'}
                  </Typography>
                  <Box sx={{ mt: 3, px: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={saludInstitucional.porcentaje} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6, 
                        bgcolor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: saludInstitucional.porcentaje >= 80 ? '#10B981' : saludInstitucional.porcentaje >= 60 ? '#F59E0B' : '#EF4444',
                          borderRadius: 6
                        }
                      }} 
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 5, p: 3, backgroundColor: 'white', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2 }}>
                    Progreso de Auditoría
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <LinearProgress variant="determinate" value={saludInstitucional.porcentaje_evaluacion || 0} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: '#1E293B' }}>{saludInstitucional.porcentaje_evaluacion}%</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {saludInstitucional.activos_evaluados || 0} de {saludInstitucional.total_activos || 0} activos bajo control
                  </Typography>
                </Box>

                <Stack spacing={2.5}>
                  {[
                    { label: 'Riesgos Altos', value: saludInstitucional.distribucion?.altos || 0, color: '#EF4444' },
                    { label: 'Riesgos Medios', value: saludInstitucional.distribucion?.medios || 0, color: '#F59E0B' },
                    { label: 'Riesgos Bajos', value: saludInstitucional.distribucion?.bajos || 0, color: '#10B981' }
                  ].map((item, i) => (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>{item.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>{item.value}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={saludInstitucional.distribucion?.total > 0 ? (item.value / saludInstitucional.distribucion.total * 100) : 0} 
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: item.color } }} 
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Paper>
        </Grid>
      </Grid>

      {/* Breakdowns Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 3 }}>Activos por Categoría</Typography>
            <Stack spacing={3}>
              {Object.entries(assetsByType).map(([type, count], index) => {
                const total = Object.values(assetsByType).reduce((a, b: any) => a + b, 0);
                const perc = total > 0 ? (count as number / total * 100).toFixed(1) : '0';
                return (
                  <Box key={type}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{type}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{count} ({perc}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={parseFloat(perc)} sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9' }} />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 3 }}>Distribución de Criticidad</Typography>
            <Stack spacing={3}>
              {Object.entries(risksByLevel).map(([level, count]) => {
                const total = Object.values(risksByLevel).reduce((a, b: any) => a + b, 0);
                const perc = total > 0 ? (count as number / total * 100).toFixed(1) : '0';
                return (
                  <Box key={level}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{level}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{count} ({perc}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={parseFloat(perc)} sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9' }} />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;