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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Policy as PolicyIcon,
  Shield as ShieldIcon,
  Assignment as AssignmentIcon,
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

const getCategoriaIcon = (categoria: string) => {
  switch (categoria) {
    case 'Gestion de Riesgo':
      return <SecurityIcon />;
    case 'Mitigacion':
      return <ShieldIcon />;
    case 'Politica':
      return <PolicyIcon />;
    case 'Control':
      return <AssignmentIcon />;
    case 'Contrato':
      return <GavelIcon />;
    default:
      return <FolderIcon />;
  }
};

const getCategoriaColor = (categoria: string) => {
  switch (categoria) {
    case 'Gestion de Riesgo':
      return '#3B82F6';
    case 'Mitigacion':
      return '#10B981';
    case 'Politica':
      return '#F59E0B';
    case 'Control':
      return '#8B5CF6';
    case 'Contrato':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const ReportesUsuarios: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reporteData, setReporteData] = useState<any>(null);

  useEffect(() => {
    cargarReporte();
  }, []);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getReporteUsuariosEvidencias();
      setReporteData(data);
    } catch (error: any) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte de usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para graficos
  const datosPorCategoria = React.useMemo(() => {
    if (!reporteData?.estadisticas?.por_categoria) return [];
    return Object.entries(reporteData.estadisticas.por_categoria).map(([categoria, count]: [string, any]) => ({
      name: categoria,
      value: count,
    }));
  }, [reporteData]);

  const datosTopUsuarios = React.useMemo(() => {
    if (!reporteData?.usuarios) return [];
    return reporteData.usuarios
      .slice(0, 10)
      .map((usuario: any) => ({
        name: usuario.nombre.split(' ').slice(0, 2).join(' '),
        documentos: usuario.documentos.length,
      }));
  }, [reporteData]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!reporteData) {
    return (
      <Box p={3}>
        <Alert severity="error">
          No se pudo cargar el reporte de usuarios. Intente de nuevo mas tarde.
        </Alert>
      </Box>
    );
  }

  const { estadisticas, usuarios } = reporteData;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton onClick={() => navigate('/reportes')} sx={{ color: '#1E3A8A' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
          Reportes de Usuarios
        </Typography>
      </Stack>

      <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280', mb: 4 }}>
        Analisis de evidencias subidas por usuarios: gestion de riesgo, mitigacion, politicas, controles y contratos.
      </Typography>

      {/* Cards de Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                    {estadisticas?.total_usuarios_con_evidencias || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Usuarios con Evidencias
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
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
                    {estadisticas?.total_documentos || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Total Documentos
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: '#10B981' }} />
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
                    {estadisticas?.promedio_documentos_por_usuario?.toFixed(1) || 0}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Promedio por Usuario
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
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
                    {Object.keys(estadisticas?.por_categoria || {}).length}
                  </Typography>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Categorias de Evidencias
                  </Typography>
                </Box>
                <FolderIcon sx={{ fontSize: 40, color: '#8B5CF6' }} />
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
              title="Documentos por Categoria"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoriaColor(entry.name) || COLORS[index % COLORS.length]} />
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
              title="Top 10 Usuarios con Mas Documentos"
              titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosTopUsuarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="documentos" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Usuarios */}
      <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
        <CardHeader
          title="Usuarios y sus Evidencias"
          titleTypographyProps={{ className: 'font-poppins', fontWeight: 600, color: '#1E3A8A' }}
        />
        <CardContent>
          {usuarios && usuarios.length > 0 ? (
            <Stack spacing={2}>
              {usuarios.map((usuario: any) => (
                <Accordion key={usuario.id_usuario} sx={{ borderRadius: '8px', boxShadow: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <PeopleIcon sx={{ color: '#3B82F6' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                          {usuario.nombre}
                        </Typography>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                          {usuario.email} â€¢ {usuario.puesto}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${usuario.documentos.length} documento(s)`}
                        sx={{ backgroundColor: '#EFF6FF', color: '#3B82F6', fontWeight: 600 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 1 }}>
                        Documentos por Categoria:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {Object.entries(usuario.por_categoria).map(([categoria, count]: [string, any]) => {
                          if (count > 0) {
                            return (
                              <Chip
                                key={categoria}
                                icon={getCategoriaIcon(categoria)}
                                label={`${categoria}: ${count}`}
                                size="small"
                                sx={{
                                  backgroundColor: getCategoriaColor(categoria) + '20',
                                  color: getCategoriaColor(categoria),
                                  fontWeight: 500,
                                }}
                              />
                            );
                          }
                          return null;
                        })}
                      </Box>
                    </Box>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                              Documento
                            </TableCell>
                            <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                              Categoria
                            </TableCell>
                            <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                              Tamano
                            </TableCell>
                            <TableCell className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A' }}>
                              Fecha
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {usuario.documentos.map((doc: any) => (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500 }}>
                                  {doc.nombre}
                                </Typography>
                                {doc.descripcion && (
                                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                    {doc.descripcion}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={getCategoriaIcon(doc.categoria)}
                                  label={doc.categoria}
                                  size="small"
                                  sx={{
                                    backgroundColor: getCategoriaColor(doc.categoria) + '20',
                                    color: getCategoriaColor(doc.categoria),
                                    fontWeight: 500,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" className="font-roboto">
                                  {formatFileSize(doc.tamano)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" className="font-roboto">
                                  {doc.fecha_subida
                                    ? new Date(doc.fecha_subida).toLocaleDateString('es-ES')
                                    : 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">No hay usuarios con evidencias subidas.</Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportesUsuarios;





