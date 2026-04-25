import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  Divider,
  Tooltip,
  Avatar,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Clear as ClearIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { usuariosService, type Usuario } from '../../services/backend';
import '../../styles/design-system.css';

interface CreateUsuarioData {
  nombre: string;
  email: string;
  puesto: string;
  estado: string;
}

interface UpdateUsuarioData extends Partial<CreateUsuarioData> {}

const Usuarios: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [puestoFilter, setPuestoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [detalleUsuario, setDetalleUsuario] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<CreateUsuarioData>({
    nombre: '',
    email: '',
    puesto: '',
    estado: 'Activo',
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['usuarios', puestoFilter, estadoFilter],
    queryFn: async () => {
      try {
        const { usuariosService } = await import('../../services/backend');
        return await usuariosService.getAll();
      } catch (error) {
        console.error('Error fetching usuarios:', error);
        return [];
      }
    },
  });

  const { data: puestos = [] } = useQuery({
    queryKey: ['puestos-usuario'],
    queryFn: async () => {
      // Datos mock para puestos
      return ['Administrador', 'Consultor', 'Analista', 'Gerente', 'Director'];
    },
  });

  const { data: estados = [] } = useQuery({
    queryKey: ['estados-usuario'],
    queryFn: async () => {
      // Datos mock para estados
      return ['Activo', 'Inactivo', 'Bloqueado', 'Pendiente'];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { usuariosService } = await import('../../services/backend');
      return await usuariosService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado exitosamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Error al crear usuario: ${error.response?.data?.error || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUsuarioData }) => {
      const { usuariosService } = await import('../../services/backend');
      return await usuariosService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado exitosamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar usuario: ${error.response?.data?.error || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { usuariosService } = await import('../../services/backend');
      return await usuariosService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar usuario: ${error.response?.data?.error || error.message}`);
    },
  });

  // Filtered usuarios based on search term and filters
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = !searchTerm || 
      (usuario.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.rol && usuario.rol.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPuesto = !puestoFilter || usuario.rol === puestoFilter;
    const matchesEstado = !estadoFilter || usuario.estado === estadoFilter;
    
    return matchesSearch && matchesPuesto && matchesEstado;
  });

  const handleOpenDialog = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        puesto: usuario.rol || '',
        estado: usuario.estado,
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        nombre: '',
        email: '',
        puesto: '',
        estado: 'Activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUsuario(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUsuario) {
      updateMutation.mutate({ id: editingUsuario.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Â¿Esta seguro de que desea eliminar este usuario?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleConsultarUsuario = async (usuario: Usuario) => {
    try {
      setSelectedUsuario(usuario);
      setOpenDetalleDialog(true);
      setLoadingDetalle(true);
      const { usuariosService } = await import('../../services/backend');
      const detalle = await usuariosService.getDetalleUsuario(usuario.id);
      setDetalleUsuario(detalle);
    } catch (error: any) {
      console.error('Error fetching detalle usuario:', error);
      toast.error('Error al cargar el detalle del usuario');
      setDetalleUsuario(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCloseDetalleDialog = () => {
    setOpenDetalleDialog(false);
    setSelectedUsuario(null);
    setDetalleUsuario(null);
  };

  const exportarPDF = async () => {
    if (!detalleUsuario) return;
    
    try {
      setExportando(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Titulo
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138);
      doc.text('Reporte de Detalle de Usuario', margin, yPos);
      yPos += 10;
      
      // Informacion General
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Informacion General', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.text(`Nombre: ${detalleUsuario.usuario?.nombre || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Email: ${detalleUsuario.usuario?.email || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Puesto: ${detalleUsuario.usuario?.puesto || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Estado: ${detalleUsuario.usuario?.estado || 'N/A'}`, margin, yPos);
      yPos += 6;
      
      if (detalleUsuario.usuario?.fecha_creacion_registro) {
        doc.text(`Fecha Creacion: ${new Date(detalleUsuario.usuario.fecha_creacion_registro).toLocaleDateString('es-ES')}`, margin, yPos);
        yPos += 6;
      }
      
      yPos += 5;
      
      // Proceso
      if (detalleUsuario.proceso) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Proceso Asociado', margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.text(`Nombre: ${detalleUsuario.proceso.nombre || 'No definido'}`, margin, yPos);
        yPos += 6;
        if (detalleUsuario.proceso.descripcion) {
          const descLines = doc.splitTextToSize(detalleUsuario.proceso.descripcion, maxWidth);
          doc.text(descLines, margin, yPos);
          yPos += descLines.length * 5;
        }
        yPos += 5;
      }
      
      // Oficina
      if (detalleUsuario.oficina) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Oficina', margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.text(`Nombre: ${detalleUsuario.oficina.nombre || 'No definido'}`, margin, yPos);
        yPos += 6;
        if (detalleUsuario.oficina.descripcion) {
          const descLines = doc.splitTextToSize(detalleUsuario.oficina.descripcion, maxWidth);
          doc.text(descLines, margin, yPos);
          yPos += descLines.length * 5;
        }
        if (detalleUsuario.oficina.direccion) {
          doc.text(`Direccion: ${detalleUsuario.oficina.direccion}`, margin, yPos);
          yPos += 6;
        }
        yPos += 5;
      }
      
      // Activos
      if (detalleUsuario.activos && detalleUsuario.activos.total > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text(`Activos Asociados (${detalleUsuario.activos.total})`, margin, yPos);
        yPos += 8;
        
        if (detalleUsuario.activos.como_propietario.length > 0) {
          doc.setFontSize(12);
          doc.text(`Como Propietario (${detalleUsuario.activos.total_propietario}):`, margin, yPos);
          yPos += 6;
          doc.setFontSize(10);
          detalleUsuario.activos.como_propietario.slice(0, 10).forEach((activo: any) => {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`  - ${activo.Nombre} (${activo.Tipo_Activo})`, margin + 5, yPos);
            yPos += 5;
          });
          yPos += 3;
        }
        
        if (detalleUsuario.activos.como_custodio.length > 0) {
          doc.setFontSize(12);
          doc.text(`Como Custodio (${detalleUsuario.activos.total_custodio}):`, margin, yPos);
          yPos += 6;
          doc.setFontSize(10);
          detalleUsuario.activos.como_custodio.slice(0, 10).forEach((activo: any) => {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`  - ${activo.Nombre} (${activo.Tipo_Activo})`, margin + 5, yPos);
            yPos += 5;
          });
        }
      }
      
      // Pie de pagina
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Pagina ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString('es-ES')}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Guardar PDF
      const fileName = `Reporte_Usuario_${detalleUsuario.usuario?.nombre?.replace(/[^a-z0-9]/gi, '_') || 'Usuario'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
    if (!detalleUsuario) return;
    
    try {
      setExportando(true);
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default || XLSXModule;
      
      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Informacion General
      const infoData = [
        ['REPORTE DE DETALLE DE USUARIO'],
        [''],
        ['INFORMACIÃ“N GENERAL'],
        ['Nombre Completo', detalleUsuario.usuario?.nombre || 'N/A'],
        ['Email Institucional', detalleUsuario.usuario?.email || 'N/A'],
        ['Puesto Organizacional', detalleUsuario.usuario?.puesto || 'N/A'],
        ['Estado', detalleUsuario.usuario?.estado || 'N/A'],
        ['Fecha Creacion', detalleUsuario.usuario?.fecha_creacion_registro ? new Date(detalleUsuario.usuario.fecha_creacion_registro).toLocaleDateString('es-ES') : 'N/A'],
        [''],
        ['PROCESO ASOCIADO'],
        ['Nombre', detalleUsuario.proceso?.nombre || 'No definido'],
        ['Descripcion', detalleUsuario.proceso?.descripcion || ''],
        [''],
        ['OFICINA'],
        ['Nombre', detalleUsuario.oficina?.nombre || 'No definido'],
        ['Descripcion', detalleUsuario.oficina?.descripcion || ''],
        ['Direccion', detalleUsuario.oficina?.direccion || ''],
        [''],
        ['ACTIVOS ASOCIADOS'],
        ['Total Activos', detalleUsuario.activos?.total || 0],
        ['Como Propietario', detalleUsuario.activos?.total_propietario || 0],
        ['Como Custodio', detalleUsuario.activos?.total_custodio || 0],
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Informacion General');
      
      // Hoja 2: Activos como Propietario
      if (detalleUsuario.activos?.como_propietario.length > 0) {
        const activosPropData = [
          ['ID', 'Nombre', 'Tipo', 'Estado', 'Descripcion']
        ];
        
        detalleUsuario.activos.como_propietario.forEach((activo: any) => {
          activosPropData.push([
            activo.ID_Activo || '',
            activo.Nombre || '',
            activo.Tipo_Activo || '',
            activo.estado_activo || '',
            activo.Descripcion || ''
          ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(activosPropData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Activos Propietario');
      }
      
      // Hoja 3: Activos como Custodio
      if (detalleUsuario.activos?.como_custodio.length > 0) {
        const activosCustData = [
          ['ID', 'Nombre', 'Tipo', 'Estado', 'Descripcion']
        ];
        
        detalleUsuario.activos.como_custodio.forEach((activo: any) => {
          activosCustData.push([
            activo.ID_Activo || '',
            activo.Nombre || '',
            activo.Tipo_Activo || '',
            activo.estado_activo || '',
            activo.Descripcion || ''
          ]);
        });
        
        const ws3 = XLSX.utils.aoa_to_sheet(activosCustData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Activos Custodio');
      }
      
      // Guardar archivo
      const fileName = `Reporte_Usuario_${detalleUsuario.usuario?.nombre?.replace(/[^a-z0-9]/gi, '_') || 'Usuario'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('âœ… Reporte Excel generado exitosamente');
    } catch (error) {
      console.error('Error generando Excel:', error);
      toast.error('âŒ Error al generar el reporte Excel');
    } finally {
      setExportando(false);
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 80,
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: 'nombre', 
      headerName: 'Nombre Completo', 
      width: 250,
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {params.value?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </Avatar>
          <Typography variant="body2" className="font-roboto" sx={{ color: '#374151', fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'email', 
      headerName: 'Email Institucional', 
      width: 280,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 16, color: '#6B7280' }} />
          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'puesto', 
      headerName: 'Puesto', 
      width: 180,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <WorkIcon sx={{ fontSize: 16, color: '#6B7280' }} />
          <Typography variant="body2" className="font-roboto" sx={{ color: '#374151', fontSize: '0.875rem' }}>
            {params.value || 'No especificado'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: params.value === 'Activo' ? '#D1FAE5' :
                             params.value === 'Inactivo' ? '#FEF3C7' :
                             params.value === 'Bloqueado' ? '#FEE2E2' : '#F3F4F6',
              color: params.value === 'Activo' ? '#065F46' :
                     params.value === 'Inactivo' ? '#92400E' :
                     params.value === 'Bloqueado' ? '#DC2626' : '#6B7280',
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        </Box>
      ),
    },
    { 
      field: 'fecha_creacion_registro', 
      headerName: 'Fecha Creacion', 
      width: 160,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
          {new Date(params.value).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 160,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Consultar detalle del usuario">
            <IconButton
              size="small"
              onClick={() => handleConsultarUsuario(params.row)}
              sx={{
                color: '#3B82F6',
                '&:hover': {
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar usuario">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              sx={{
                color: '#1E3A8A',
                '&:hover': {
                  backgroundColor: '#EFF6FF',
                  color: '#1E40AF',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar usuario">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{
                color: '#EF4444',
                '&:hover': {
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error al cargar los usuarios: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
              Gestion de Usuarios
            </Typography>
            <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
              Administra los usuarios del sistema y sus roles organizacionales
            </Typography>
          </Box>
          <Button
            className="btn btn-primary"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              px: 3,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(30, 58, 138, 0.4)',
              },
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Nuevo Usuario
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
            <Card className="card" sx={{ 
              background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              border: 'none'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {usuarios.length}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ opacity: 0.9 }}>
                      Total Usuarios
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
            <Card className="card">
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5, color: '#1E3A8A' }}>
                      {usuarios.filter(u => u.estado === 'Activo').length}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Usuarios Activos
                    </Typography>
                  </Box>
                  <PersonAddIcon sx={{ fontSize: 40, color: '#10B981' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
            <Card className="card">
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5, color: '#1E3A8A' }}>
                      {usuarios.filter(u => u.estado === 'Inactivo').length}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Usuarios Inactivos
                    </Typography>
                  </Box>
                  <GroupIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid  size={{ xs: 12, md: 3, sm: 6 }}>
            <Card className="card">
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5, color: '#1E3A8A' }}>
                      {usuarios.filter(u => u.estado === 'Bloqueado').length}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Usuarios Bloqueados
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: '#EF4444' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Filters Section */}
      <Card className="card" sx={{ mb: 3 }}>
        <CardHeader 
          title="Filtros y Busqueda" 
          titleTypographyProps={{ 
            className: 'font-poppins', 
            fontWeight: 500, 
            color: '#1E3A8A',
            fontSize: '1.1rem'
          }}
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1, minWidth: '280px' }}>
              <Autocomplete
                freeSolo
                options={usuarios.map(usuario => usuario.nombre || usuario.nombre || '')}
                value={searchTerm}
                onInputChange={(event, newValue) => {
                  setSearchTerm(newValue || '');
                }}
                filterOptions={(options, { inputValue }) => {
                  return options.filter(option =>
                    option.toLowerCase().includes(inputValue.toLowerCase())
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Buscar usuarios por nombre, email o puesto..."
                    className="input"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#6B7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1E3A8A',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1E3A8A',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500 }}>
                        {option}
                      </Typography>
                      <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                        {usuarios.find(u => u.nombre === option)?.email} â€¢ {usuarios.find(u => u.nombre === option)?.rol}
                      </Typography>
                    </Box>
                  </Box>
                )}
                sx={{
                  '& .MuiAutocomplete-paper': {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              />
            </Box>
            
            <FormControl sx={{ minWidth: '160px' }}>
              <InputLabel>Puesto</InputLabel>
              <Select
                value={puestoFilter}
                onChange={(e) => setPuestoFilter(e.target.value)}
                label="Puesto"
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1E3A8A',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1E3A8A',
                  },
                }}
              >
                <MenuItem value="">Todos los puestos</MenuItem>
                {puestos.map((puesto) => (
                  <MenuItem key={puesto} value={puesto}>{puesto}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: '140px' }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                label="Estado"
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1E3A8A',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1E3A8A',
                  },
                }}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                {estados.map((estado) => (
                  <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Tooltip title="Limpiar todos los filtros">
              <Button
                className="btn btn-secondary"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setPuestoFilter('');
                  setEstadoFilter('');
                  setSearchTerm('');
                }}
                sx={{
                  borderRadius: '12px',
                  px: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Limpiar
              </Button>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card className="card">
        <CardHeader 
          title="Lista de Usuarios" 
          titleTypographyProps={{ 
            className: 'font-poppins', 
            fontWeight: 500, 
            color: '#1E3A8A',
            fontSize: '1.1rem'
          }}
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, p: 0 }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredUsuarios}
              columns={columns}
              loading={isLoading}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #F3F4F6',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#F9FAFB',
                  borderBottom: '2px solid #E5E7EB',
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    color: '#1E3A8A',
                    fontFamily: "'Poppins', sans-serif",
                  },
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#F9FAFB',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ 
            pb: 2,
            borderBottom: '1px solid #E5E7EB',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            borderRadius: '16px 16px 0 0',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {editingUsuario ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </Typography>
                <Typography variant="body2" className="font-roboto" sx={{ opacity: 0.9 }}>
                  {editingUsuario ? 'Modifica la informacion del usuario seleccionado' : 'Agrega un nuevo usuario al sistema'}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Nombre Completo"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="input"
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Email Institucional"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input"
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Puesto Organizacional"
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                  className="input"
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <FormControl sx={{ flex: '1 1 200px' }}>
                  <InputLabel>Estado del Usuario</InputLabel>
                  <Select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    label="Estado del Usuario"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="Activo">Activo</MenuItem>
                    <MenuItem value="Inactivo">Inactivo</MenuItem>
                    <MenuItem value="Bloqueado">Bloqueado</MenuItem>
                    <MenuItem value="Pendiente_Activacion">Pendiente Activacion</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E5E7EB' }}>
            <Button 
              onClick={handleCloseDialog}
              className="btn btn-secondary"
              sx={{
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              sx={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(30, 58, 138, 0.4)',
                },
                '&:disabled': {
                  background: '#9CA3AF',
                  transform: 'none',
                  boxShadow: 'none',
                },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {editingUsuario ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de Detalle del Usuario */}
      <Dialog
        open={openDetalleDialog}
        onClose={handleCloseDetalleDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
          color: '#FFFFFF',
          borderRadius: '16px 16px 0 0',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Detalle del Usuario
                </Typography>
                <Typography variant="body2" className="font-roboto" sx={{ opacity: 0.9 }}>
                  Informacion completa del usuario, procesos y oficina
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleCloseDetalleDialog}
              sx={{
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4, mt: 2 }}>
          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
                Cargando informacion del usuario...
              </Typography>
            </Box>
          ) : detalleUsuario ? (
            <Stack spacing={4}>
              {/* Informacion General */}
              <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <CardHeader
                  title="Informacion General"
                  titleTypographyProps={{
                    className: 'font-poppins',
                    fontWeight: 600,
                    color: '#1E3A8A',
                    fontSize: '1.1rem'
                  }}
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                        Nombre Completo
                      </Typography>
                      <Typography variant="body1" className="font-roboto" sx={{ color: '#1F2937', fontWeight: 500 }}>
                        {detalleUsuario.usuario?.nombre || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                        Email Institucional
                      </Typography>
                      <Typography variant="body1" className="font-roboto" sx={{ color: '#1F2937', fontWeight: 500 }}>
                        {detalleUsuario.usuario?.email || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                        Puesto Organizacional
                      </Typography>
                      <Typography variant="body1" className="font-roboto" sx={{ color: '#1F2937', fontWeight: 500 }}>
                        {detalleUsuario.usuario?.puesto || 'No especificado'}
                      </Typography>
                    </Grid>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                        Estado
                      </Typography>
                      <Chip
                        label={detalleUsuario.usuario?.estado || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: detalleUsuario.usuario?.estado === 'Activo' ? '#D1FAE5' :
                                         detalleUsuario.usuario?.estado === 'Inactivo' ? '#FEF3C7' :
                                         detalleUsuario.usuario?.estado === 'Bloqueado' ? '#FEE2E2' : '#F3F4F6',
                          color: detalleUsuario.usuario?.estado === 'Activo' ? '#065F46' :
                                 detalleUsuario.usuario?.estado === 'Inactivo' ? '#92400E' :
                                 detalleUsuario.usuario?.estado === 'Bloqueado' ? '#DC2626' : '#6B7280',
                          fontWeight: 500,
                        }}
                      />
                    </Grid>
                    {detalleUsuario.usuario?.fecha_creacion_registro && (
                      <Grid  size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mb: 0.5 }}>
                          Fecha de Creacion
                        </Typography>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                          {new Date(detalleUsuario.usuario.fecha_creacion_registro).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Proceso */}
              {detalleUsuario.proceso && (
                <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                  <CardHeader
                    avatar={<AssignmentIcon sx={{ color: '#3B82F6', fontSize: 28 }} />}
                    title="Proceso Asociado"
                    titleTypographyProps={{
                      className: 'font-poppins',
                      fontWeight: 600,
                      color: '#1E3A8A',
                      fontSize: '1.1rem'
                    }}
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                      {detalleUsuario.proceso.nombre || 'No definido'}
                    </Typography>
                    {detalleUsuario.proceso.descripcion && (
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 2 }}>
                        {detalleUsuario.proceso.descripcion}
                      </Typography>
                    )}
                    {detalleUsuario.proceso.nota && (
                      <Alert severity="info" sx={{ borderRadius: '8px', mt: 1 }}>
                        <Typography variant="caption" className="font-roboto">
                          {detalleUsuario.proceso.nota}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Oficina */}
              {detalleUsuario.oficina && (
                <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                  <CardHeader
                    avatar={<BusinessIcon sx={{ color: '#10B981', fontSize: 28 }} />}
                    title="Oficina"
                    titleTypographyProps={{
                      className: 'font-poppins',
                      fontWeight: 600,
                      color: '#1E3A8A',
                      fontSize: '1.1rem'
                    }}
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                      {detalleUsuario.oficina.nombre || 'No definido'}
                    </Typography>
                    {detalleUsuario.oficina.descripcion && (
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                        {detalleUsuario.oficina.descripcion}
                      </Typography>
                    )}
                    {detalleUsuario.oficina.direccion && (
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        <strong>Direccion:</strong> {detalleUsuario.oficina.direccion}
                      </Typography>
                    )}
                    {detalleUsuario.oficina.nota && (
                      <Alert severity="info" sx={{ borderRadius: '8px', mt: 1 }}>
                        <Typography variant="caption" className="font-roboto">
                          {detalleUsuario.oficina.nota}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Activos Asociados */}
              {detalleUsuario.activos && detalleUsuario.activos.total > 0 && (
                <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                  <CardHeader
                    title={`Activos Asociados (${detalleUsuario.activos.total})`}
                    titleTypographyProps={{
                      className: 'font-poppins',
                      fontWeight: 600,
                      color: '#1E3A8A',
                      fontSize: '1.1rem'
                    }}
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      {detalleUsuario.activos.como_propietario.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                            Como Propietario ({detalleUsuario.activos.total_propietario})
                          </Typography>
                          <ListItem dense>
                            {detalleUsuario.activos.como_propietario.slice(0, 5).map((activo: any) => (
                              <ListItem key={activo.ID_Activo} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" className="font-roboto" sx={{ color: '#1F2937', fontWeight: 500 }}>
                                      {activo.Nombre}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                      {activo.Tipo_Activo} â€¢ {activo.estado_activo}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </ListItem>
                        </Box>
                      )}
                      {detalleUsuario.activos.como_custodio.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 1 }}>
                            Como Custodio ({detalleUsuario.activos.total_custodio})
                          </Typography>
                          <ListItem dense>
                            {detalleUsuario.activos.como_custodio.slice(0, 5).map((activo: any) => (
                              <ListItem key={activo.ID_Activo} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" className="font-roboto" sx={{ color: '#1F2937', fontWeight: 500 }}>
                                      {activo.Nombre}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                      {activo.Tipo_Activo} â€¢ {activo.estado_activo}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </ListItem>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
                No se pudo cargar la informacion del usuario
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={exportarPDF}
              disabled={exportando || !detalleUsuario}
              startIcon={<PdfIcon />}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: '#DC2626',
                color: '#DC2626',
                '&:hover': {
                  borderColor: '#B91C1C',
                  backgroundColor: '#FEF2F2',
                },
                '&:disabled': {
                  borderColor: '#D1D5DB',
                  color: '#9CA3AF',
                }
              }}
            >
              {exportando ? 'Exportando...' : 'PDF'}
            </Button>
            <Button
              onClick={exportarExcel}
              disabled={exportando || !detalleUsuario}
              startIcon={<ExcelIcon />}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: '#10B981',
                color: '#10B981',
                '&:hover': {
                  borderColor: '#059669',
                  backgroundColor: '#D1FAE5',
                },
                '&:disabled': {
                  borderColor: '#D1D5DB',
                  color: '#9CA3AF',
                }
              }}
            >
              {exportando ? 'Exportando...' : 'Excel'}
            </Button>
          </Box>
          <Button 
            onClick={handleCloseDetalleDialog}
            className="btn btn-secondary"
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Usuarios;
