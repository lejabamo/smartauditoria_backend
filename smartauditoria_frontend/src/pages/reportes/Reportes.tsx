import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  Security,
  People,
  TableChart,
  VerifiedUser,
  ArrowForward,
  CheckCircle,
} from "@mui/icons-material";

const Reportes: React.FC = () => {
  const navigate = useNavigate();
  
  const reportes = [
    {
      titulo: "Mapa Oficial de Riesgos (DAFP V7 / MIPG)",
      descripcion: "Matriz institucional oficial según Guía DAFP V7 (2025), ISO 27005:2022 y controles ISO 27002:2022. Exportación a Excel y PDF con cálculo automático de riesgo residual.",
      icono: <TableChart sx={{ fontSize: 44, color: "#1E3A8A" }} />,
      ruta: "/reportes/mapa-riesgos-dafp",
      destacado: true,
      badge: "OFICIAL DAFP V7",
      estado: "Disponible",
    },
    {
      titulo: "Informe Completo de Riesgos",
      descripcion: "Análisis integral de riesgos inherentes y residuales, estado de controles mitigantes y evidencias documentales asociadas.",
      icono: <Assessment sx={{ fontSize: 40, color: "#2563EB" }} />,
      ruta: "/reportes/informe-riesgos",
      badge: "ANÁLISIS GLOBAL",
      estado: "Disponible",
    },
    {
      titulo: "Estadísticas de Activos de Información",
      descripcion: "Métricas consolidadas de activos inventariados, niveles de criticidad (Alta, Media, Baja), custodios y requisitos de continuidad.",
      icono: <Security sx={{ fontSize: 40, color: "#059669" }} />,
      ruta: "/reportes/estadisticas-activos",
      badge: "ACTIVOS V7",
      estado: "Disponible",
    },
    {
      titulo: "Tendencias de Seguridad y Madurez",
      descripcion: "Evolución histórica del perfil de riesgo institucional, seguimiento temporal de mitigaciones y nivel de cumplimiento SGSI.",
      icono: <TrendingUp sx={{ fontSize: 40, color: "#D97706" }} />,
      ruta: "/reportes/tendencias-seguridad",
      badge: "HISTÓRICO",
      estado: "Disponible",
    },
    {
      titulo: "Reportes de Usuarios y Evidencias",
      descripcion: "Consolidado de custodios, asignación de responsabilidades de activos y registro de evidencias de controles y auditoría.",
      icono: <People sx={{ fontSize: 40, color: "#7C3AED" }} />,
      ruta: "/reportes/reportes-usuarios",
      badge: "CUSTODIOS",
      estado: "Disponible",
    },
  ];

  return (
    <Box p={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header Banner */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #3B82F6 100%)',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <VerifiedUser sx={{ fontSize: 28, color: '#93C5FD' }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Centro Institucional de Reportes
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: '#E0E7FF', maxWidth: 800 }}>
              Generación y exportación de matrices de riesgo oficiales alineadas con la Guía de Gestión de Riesgos DAFP Versión 7 (2025), MIPG e ISO/IEC 27001:2022.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<TableChart />}
            onClick={() => navigate('/reportes/mapa-riesgos-dafp')}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#1E3A8A',
              fontWeight: 700,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': { bgcolor: '#F0F9FF' },
              whiteSpace: 'nowrap'
            }}
          >
            Abrir Mapa Oficial DAFP V7
          </Button>
        </Stack>
      </Paper>

      {/* Grid of Report Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {reportes.map((reporte, index) => (
          <Card 
            key={`reporte-${index}`}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'all 0.25s ease-in-out',
              borderRadius: 3,
              position: 'relative',
              border: reporte.destacado ? '2px solid #2563EB' : '1px solid #E2E8F0',
              background: reporte.destacado 
                ? 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)' 
                : '#FFFFFF',
              boxShadow: reporte.destacado ? '0 10px 25px -5px rgba(37, 99, 235, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 14px 28px rgba(0, 0, 0, 0.12)',
                borderColor: '#1E3A8A'
              }
            }}
          >
            <CardActionArea 
              onClick={() => navigate(reporte.ruta)}
              sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
            >
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: reporte.destacado ? '#DBEAFE' : '#F1F5F9' }}>
                  {reporte.icono}
                </Box>
                <Chip
                  label={reporte.badge}
                  size="small"
                  sx={{
                    bgcolor: reporte.destacado ? '#1E3A8A' : '#E2E8F0',
                    color: reporte.destacado ? '#FFFFFF' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, textAlign: 'left' }}>
                {reporte.titulo}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'left', mb: 2, flexGrow: 1, lineHeight: 1.6 }}>
                {reporte.descripcion}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: '#2563EB', fontWeight: 600, fontSize: '0.875rem', mt: 'auto' }}>
                <span>Ingresar al informe</span>
                <ArrowForward sx={{ fontSize: 16 }} />
              </Stack>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Compliance & Standards Status Panel */}
      <Paper sx={{ p: 3.5, borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
          Estándares y Marcos de Cumplimiento Integrados
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Todos los reportes generados cuentan con validación técnica y matemática acorde a los marcos normativos vigentes para el sector público colombiano:
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <CheckCircle sx={{ color: '#16A34A', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534' }}>
                Guía DAFP V7 (2025)
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#15803D' }}>
              Metodología 5x5, valoración de activos y matriz institucional MIPG.
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <CheckCircle sx={{ color: '#2563EB', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                ISO/IEC 27005:2022
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#1D4ED8' }}>
              Gestión de riesgos de seguridad de la información y criterios de impacto.
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <CheckCircle sx={{ color: '#7C3AED', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#5B21B6' }}>
                ISO 27002:2022 (93 Controles)
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#6D28D9' }}>
              Controles aplicados, eficacia y Declaración de Aplicabilidad (SoA).
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <CheckCircle sx={{ color: '#D97706', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400E' }}>
                Ley 1712 de 2014
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#B45309' }}>
              Clasificación de información pública, reservada y clasificada.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Reportes;
