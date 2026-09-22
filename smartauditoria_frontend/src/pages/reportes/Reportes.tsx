import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  Security,
  People,
  TableChart,
} from "@mui/icons-material";

const Reportes: React.FC = () => {
  const navigate = useNavigate();
  
  const reportes = [
    {
      titulo: "Mapa Oficial de Riesgos (DAFP V7 / MIPG)",
      descripcion: "Matriz institucional oficial según Guía DAFP V7 (2025), ISO 27005:2022 y controles ISO 27002:2022",
      icono: <TableChart sx={{ fontSize: 40, color: "#1E3A8A" }} />,
      ruta: "/reportes/mapa-riesgos-dafp",
      destacado: true,
    },
    {
      titulo: "Informe de Riesgos",
      descripcion: "Analisis completo de riesgos identificados y su estado",
      icono: <Assessment sx={{ fontSize: 40, color: "#1976d2" }} />,
      ruta: "/reportes/informe-riesgos",
    },
    {
      titulo: "Estadisticas de Activos",
      descripcion: "Metricas y analisis de la gestion de activos",
      icono: <Security sx={{ fontSize: 40, color: "#388e3c" }} />,
      ruta: "/reportes/estadisticas-activos",
    },
    {
      titulo: "Tendencias de Seguridad",
      descripcion: "Analisis de tendencias en seguridad de la informacion",
      icono: <TrendingUp sx={{ fontSize: 40, color: "#f57c00" }} />,
      ruta: "/reportes/tendencias-seguridad",
    },
    {
      titulo: "Reportes de Usuarios",
      descripcion: "Informes sobre actividad y gestion de usuarios",
      icono: <People sx={{ fontSize: 40, color: "#7b1fa2" }} />,
      ruta: "/reportes/reportes-usuarios",
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reportes y Estadisticas
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Sistema de reportes del SGRI - Gestion de Riesgos de Informacion
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {reportes.map((reporte, index) => (
          <Box key={`reporte-${reporte.titulo || reporte.titulo || index}`} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: reporte.ruta ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': reporte.ruta ? {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                } : {}
              }}
            >
              <CardActionArea 
                onClick={() => reporte.ruta && navigate(reporte.ruta)}
                disabled={!reporte.ruta}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {reporte.icono}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {reporte.titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reporte.descripcion}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Funcionalidad en Desarrollo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Los reportes detallados estaran disponibles proximamente. Esta seccion incluira:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 3 }}>
          <li>Reportes PDF de riesgos por categoria</li>
          <li>Graficos interactivos de tendencias</li>
          <li>Exportacion de datos en multiples formatos</li>
          <li>Dashboards personalizables</li>
          <li>Reportes automaticos por email</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default Reportes;
