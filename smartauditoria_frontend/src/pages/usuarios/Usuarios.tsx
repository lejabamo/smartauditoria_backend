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
  VpnKey as KeyIcon,
  LockReset as LockResetIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  LockOpen as LockOpenIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
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
  rol: string;
  id_rol?: number;
  username?: string;
  password?: string;
  activo?: boolean;
  desbloquear?: boolean;
}

interface UpdateUsuarioData extends Partial<CreateUsuarioData> {}

const Usuarios: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [puestoFilter, setPuestoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [detalleUsuario, setDetalleUsuario] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any | null>(null);

  // Estados para Restablecimiento de Contraseña (Admin)
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccessResult, setResetSuccessResult] = useState<any | null>(null);

  const [formData, setFormData] = useState<CreateUsuarioData>({
    nombre: '',
    email: '',
    puesto: '',
    estado: 'Activo',
    rol: 'CONSULTOR',
    id_rol: 4,
    username: '',
    password: '',
    activo: true,
    desbloquear: false,
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['usuarios', puestoFilter, estadoFilter, rolFilter],
    queryFn: async () => {
      try {
        return await usuariosService.getAll({
          puesto: puestoFilter || undefined,
          estado: estadoFilter || undefined,
          rol: rolFilter || undefined,
        });
      } catch (err) {
        console.error('Error fetching usuarios:', err);
        return [];
      }
    },
  });

  // Query de Roles RBAC
  const { data: roles = [] } = useQuery({
    queryKey: ['roles-auth'],
    queryFn: async () => {
      try {
        return await usuariosService.getRoles();
      } catch (err) {
        return [
          { id_rol: 1, nombre_rol: 'ADMIN', descripcion: 'Administrador con acceso completo y gestión de usuarios' },
          { id_rol: 2, nombre_rol: 'OPERADOR', descripcion: 'Operador SGSI (Gestión de Activos, Riesgos y Auditorías)' },
          { id_rol: 3, nombre_rol: 'CONSULTOR', descripcion: 'Consultor (Modo Consulta y Reportes)' },
        ];
      }
    },
  });

  const { data: puestos = [] } = useQuery({
    queryKey: ['puestos-usuario'],
    queryFn: async () => {
      try {
        return ['TI', 'Seguridad de la Información', 'Auditoría Interna', 'Gestión de Riesgos', 'Operaciones TI', 'Consultor Externo'];
      } catch {
        return ['TI', 'Auditoría'];
      }
    },
  });

  const { data: estados = [] } = useQuery({
    queryKey: ['estados-usuario'],
    queryFn: async () => ['Activo', 'Inactivo', 'Bloqueado'],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await usuariosService.create(data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      const passMsg = data?.password_generado ? ` (Clave inicial: ${data.password_generado})` : '';
      toast.success(`Usuario creado exitosamente${passMsg}`);
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Error al crear usuario: ${error.response?.data?.error || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await usuariosService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario y permisos actualizados exitosamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar usuario: ${error.response?.data?.error || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
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

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await usuariosService.toggleStatus(id);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(data?.message || 'Estado actualizado');
    },
    onError: (error: any) => {
      toast.error(`Error actualizando estado: ${error.response?.data?.error || error.message}`);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword?: string }) => {
      return await usuariosService.adminResetPassword(id, newPassword);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setResetSuccessResult(data);
      toast.success('Contraseña restablecida exitosamente');
    },
    onError: (error: any) => {
      toast.error(`Error restableciendo contraseña: ${error.response?.data?.error || error.message}`);
    },
  });

  // Filtered usuarios based on search term and filters
  const filteredUsuarios = usuarios.filter((usuario: any) => {
    const rolPuesto = usuario.rol || usuario.rol_nombre || usuario.puesto || '';
    const nombre = usuario.nombre || usuario.nombre_completo || '';
    const email = usuario.email || usuario.email_institucional || '';
    const username = usuario.username || '';
    const estado = usuario.estado || usuario.estado_usuario || 'Activo';

    const matchesSearch = !searchTerm || 
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rolPuesto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPuesto = !puestoFilter || (usuario.puesto || usuario.puesto_organizacion) === puestoFilter;
    const matchesEstado = !estadoFilter || estado === estadoFilter;
    const matchesRol = !rolFilter || rolPuesto.toUpperCase() === rolFilter.toUpperCase();
    
    return matchesSearch && matchesPuesto && matchesEstado && matchesRol;
  });

  const handleOpenDialog = (usuario?: any, defaultRol?: string) => {
    if (usuario) {
      setEditingUsuario(usuario);
      const userRol = (usuario.rol || usuario.rol_nombre || 'CONSULTOR').toUpperCase();
      const matchedRol = roles.find((r: any) => r.nombre_rol?.toUpperCase() === userRol);
      setFormData({
        nombre: usuario.nombre || usuario.nombre_completo || '',
        email: usuario.email || usuario.email_institucional || '',
        puesto: usuario.puesto || usuario.puesto_organizacion || '',
        estado: usuario.estado || usuario.estado_usuario || 'Activo',
        rol: userRol,
        id_rol: usuario.id_rol || matchedRol?.id_rol || (userRol === 'ADMIN' ? 1 : (userRol === 'OPERADOR' ? 2 : 3)),
        username: usuario.username || '',
        password: '',
        activo: usuario.activo ?? true,
        desbloquear: usuario.bloqueado ?? false,
      });
    } else {
      setEditingUsuario(null);
      const initialRol = (defaultRol || 'OPERADOR').toUpperCase();
      const matchedRol = roles.find((r: any) => r.nombre_rol?.toUpperCase() === initialRol);
      setFormData({
        nombre: '',
        email: '',
        puesto: '',
        estado: 'Activo',
        rol: initialRol,
        id_rol: matchedRol?.id_rol || (initialRol === 'ADMIN' ? 1 : (initialRol === 'OPERADOR' ? 2 : 3)),
        username: '',
        password: '',
        activo: true,
        desbloquear: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUsuario(null);
  };

  const handleOpenResetDialog = (usuario: any) => {
    setSelectedUserForReset(usuario);
    setResetNewPassword('');
    setResetSuccessResult(null);
    setOpenResetDialog(true);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
    setSelectedUserForReset(null);
    setResetNewPassword('');
    setResetSuccessResult(null);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetNewPassword(res);
  };

  const handleSubmitResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    resetPasswordMutation.mutate({
      id: selectedUserForReset.id || selectedUserForReset.id_usuario,
      newPassword: resetNewPassword || undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUsuario) {
      updateMutation.mutate({ id: editingUsuario.id || editingUsuario.id_usuario, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
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
      width: 70,
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: 'nombre', 
      headerName: 'Nombre Completo', 
      width: 220,
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
            {params.value?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" className="font-roboto" sx={{ color: '#1F2937', fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'email', 
      headerName: 'Email Institucional', 
      width: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 15, color: '#6B7280' }} />
          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'rol',
      headerName: 'Rol del Sistema (RBAC)',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const rol = (params.value || params.row.rol_nombre || 'CONSULTOR').toUpperCase();
        let config = { label: 'CONSULTOR', bg: '#FEF3C7', color: '#92400E', icon: <VisibilityIcon sx={{ fontSize: 13 }} /> };
        if (rol === 'ADMIN' || rol.includes('ADMIN')) {
          config = { label: 'ADMINISTRADOR', bg: '#EDE9FE', color: '#6D28D9', icon: <ShieldIcon sx={{ fontSize: 13 }} /> };
        } else if (rol === 'OPERADOR' || rol.includes('OPERADOR')) {
          config = { label: 'OPERADOR', bg: '#E0F2FE', color: '#0369A1', icon: <SecurityIcon sx={{ fontSize: 13 }} /> };
        }

        return (
          <Chip
            icon={config.icon}
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.bg,
              color: config.color,
              fontWeight: 700,
              fontSize: '0.72rem',
              borderRadius: '8px',
              border: `1px solid ${config.color}20`,
              '& .MuiChip-icon': { color: config.color },
            }}
          />
        );
      },
    },
    {
      field: 'username',
      headerName: 'Cuenta Auth',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <KeyIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>
            {params.value || `user_${params.row.id}`}
          </Typography>
        </Box>
      ),
    },
    { 
      field: 'puesto', 
      headerName: 'Puesto', 
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <WorkIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
          <Typography variant="body2" sx={{ color: '#4B5563', fontSize: '0.85rem' }}>
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
      renderCell: (params: GridRenderCellParams) => {
        const isBlocked = params.row.bloqueado || params.value === 'Bloqueado';
        const isActive = params.row.activo !== false && params.value === 'Activo';
        const label = isBlocked ? 'Bloqueado' : (isActive ? 'Activo' : 'Inactivo');
        
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              backgroundColor: isBlocked ? '#FEE2E2' : (isActive ? '#D1FAE5' : '#FEF3C7'),
              color: isBlocked ? '#DC2626' : (isActive ? '#065F46' : '#92400E'),
              fontWeight: 600,
              fontSize: '0.72rem',
              borderRadius: '8px',
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Acciones de Gestión',
      width: 190,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Consultar detalle y activos">
            <IconButton
              size="small"
              onClick={() => handleConsultarUsuario(params.row)}
              sx={{
                color: '#3B82F6',
                '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB' },
                transition: 'all 0.2s ease',
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Editar perfil y rol">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              sx={{
                color: '#1E3A8A',
                '&:hover': { backgroundColor: '#EFF6FF', color: '#1E40AF' },
                transition: 'all 0.2s ease',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Restablecer Contraseña (Admin)">
            <IconButton
              size="small"
              onClick={() => handleOpenResetDialog(params.row)}
              sx={{
                color: '#D97706',
                '&:hover': { backgroundColor: '#FEF3C7', color: '#B45309' },
                transition: 'all 0.2s ease',
              }}
            >
              <KeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={params.row.estado === 'Activo' && !params.row.bloqueado ? 'Desactivar acceso' : 'Activar / Desbloquear'}>
            <IconButton
              size="small"
              onClick={() => handleToggleStatus(params.row.id)}
              sx={{
                color: params.row.estado === 'Activo' && !params.row.bloqueado ? '#10B981' : '#EF4444',
                '&:hover': {
                  backgroundColor: params.row.estado === 'Activo' && !params.row.bloqueado ? '#D1FAE5' : '#FEE2E2',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {params.row.estado === 'Activo' && !params.row.bloqueado ? (
                <LockOpenIcon fontSize="small" />
              ) : (
                <LockResetIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar usuario">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{
                color: '#9CA3AF',
                '&:hover': { backgroundColor: '#FEF2F2', color: '#DC2626' },
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" className="font-poppins" sx={{ color: '#1D3867', fontWeight: 700, mb: 0.5 }}>
              Gestión de Usuarios y Roles (RBAC)
            </Typography>
            <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
              Panel de control de usuarios institucionales, perfiles de seguridad y asignación de roles SGSI
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<SecurityIcon />}
              onClick={() => handleOpenDialog(undefined, 'OPERADOR')}
              sx={{
                borderRadius: '10px',
                borderColor: '#eb6408',
                color: '#eb6408',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 1,
                '&:hover': {
                  borderColor: '#c85305',
                  backgroundColor: 'rgba(235, 100, 8, 0.08)'
                }
              }}
            >
              + Agregar Operador
            </Button>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => handleOpenDialog(undefined, 'CONSULTOR')}
              sx={{
                borderRadius: '10px',
                borderColor: '#3366CC',
                color: '#3366CC',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 1,
                '&:hover': {
                  borderColor: '#1D3867',
                  backgroundColor: 'rgba(51, 102, 204, 0.08)'
                }
              }}
            >
              + Agregar Consultor
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(135deg, #1D3867 0%, #2A4F8A 100%)',
                color: '#FFFFFF',
                px: 2.5,
                py: 1,
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(29, 56, 103, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #122443 0%, #1D3867 100%)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              + Nuevo Usuario
            </Button>
          </Box>
        </Box>

        {/* Stats Cards by Role */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              onClick={() => setRolFilter('')}
              sx={{ 
                cursor: 'pointer',
                borderRadius: '14px',
                border: rolFilter === '' ? '2px solid #1D3867' : '1px solid #E2E8F0',
                background: rolFilter === '' ? 'linear-gradient(135deg, #1D3867 0%, #2A4F8A 100%)' : '#FFFFFF',
                color: rolFilter === '' ? '#FFFFFF' : '#1D3867',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {usuarios.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: rolFilter === '' ? 0.9 : 0.7, fontWeight: 500 }}>
                      Total Usuarios
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 38, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              onClick={() => setRolFilter(rolFilter === 'ADMIN' ? '' : 'ADMIN')}
              sx={{ 
                cursor: 'pointer',
                borderRadius: '14px',
                border: rolFilter === 'ADMIN' ? '2px solid #6D28D9' : '1px solid #E2E8F0',
                background: rolFilter === 'ADMIN' ? '#EDE9FE' : '#FFFFFF',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(109, 40, 217, 0.12)' }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 700, mb: 0.5, color: '#6D28D9' }}>
                      {usuarios.filter((u: any) => (u.rol || u.rol_nombre || '').toUpperCase() === 'ADMIN').length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 600 }}>
                      Administradores
                    </Typography>
                  </Box>
                  <ShieldIcon sx={{ fontSize: 38, color: '#6D28D9' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              onClick={() => setRolFilter(rolFilter === 'OPERADOR' ? '' : 'OPERADOR')}
              sx={{ 
                cursor: 'pointer',
                borderRadius: '14px',
                border: rolFilter === 'OPERADOR' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                background: rolFilter === 'OPERADOR' ? '#E0F2FE' : '#FFFFFF',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(2, 132, 199, 0.12)' }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 700, mb: 0.5, color: '#0284C7' }}>
                      {usuarios.filter((u: any) => (u.rol || u.rol_nombre || '').toUpperCase() === 'OPERADOR').length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 600 }}>
                      Operadores SGSI
                    </Typography>
                  </Box>
                  <SecurityIcon sx={{ fontSize: 38, color: '#0284C7' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              onClick={() => setRolFilter(rolFilter === 'CONSULTOR' ? '' : 'CONSULTOR')}
              sx={{ 
                cursor: 'pointer',
                borderRadius: '14px',
                border: rolFilter === 'CONSULTOR' ? '2px solid #D97706' : '1px solid #E2E8F0',
                background: rolFilter === 'CONSULTOR' ? '#FEF3C7' : '#FFFFFF',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(217, 119, 6, 0.12)' }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 700, mb: 0.5, color: '#D97706' }}>
                      {usuarios.filter((u: any) => (u.rol || u.rol_nombre || '').toUpperCase() === 'CONSULTOR').length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 600 }}>
                      Consultores
                    </Typography>
                  </Box>
                  <VisibilityIcon sx={{ fontSize: 38, color: '#D97706' }} />
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

            <FormControl sx={{ minWidth: '160px' }}>
              <InputLabel>Rol (RBAC)</InputLabel>
              <Select
                value={rolFilter}
                onChange={(e) => setRolFilter(e.target.value)}
                label="Rol (RBAC)"
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
                <MenuItem value="">Todos los roles</MenuItem>
                <MenuItem value="ADMIN">ADMINISTRADOR</MenuItem>
                <MenuItem value="OPERADOR">OPERADOR</MenuItem>
                <MenuItem value="CONSULTOR">CONSULTOR</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Limpiar todos los filtros">
              <Button
                className="btn btn-secondary"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setPuestoFilter('');
                  setEstadoFilter('');
                  setRolFilter('');
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
              
              {/* ── Segmented Role Selection Cards ── */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1D3867', mb: 1.5 }}>
                  Seleccione el Rol de Seguridad y Acceso (RBAC) *
                </Typography>
                <Grid container spacing={2}>
                  {[
                    {
                      rol: 'ADMIN',
                      id: 1,
                      title: 'ADMINISTRADOR',
                      desc: 'Control total del sistema, configuración global y gestión de usuarios.',
                      color: '#6D28D9',
                      bg: '#EDE9FE',
                      icon: <ShieldIcon fontSize="small" />
                    },
                    {
                      rol: 'OPERADOR',
                      id: 2,
                      title: 'OPERADOR SGSI',
                      desc: 'Crea activos, asigna responsables, evalúa riesgos en Wizard y auditorías.',
                      color: '#0284C7',
                      bg: '#E0F2FE',
                      icon: <SecurityIcon fontSize="small" />
                    },
                    {
                      rol: 'CONSULTOR',
                      id: 3,
                      title: 'CONSULTOR',
                      desc: 'Modo lectura. Consulta activos, mapa de riesgos DAFP y reportes.',
                      color: '#D97706',
                      bg: '#FEF3C7',
                      icon: <VisibilityIcon fontSize="small" />
                    }
                  ].map((r) => {
                    const isSelected = (formData.rol || '').toUpperCase() === r.rol;
                    return (
                      <Grid size={{ xs: 12, md: 4 }} key={r.rol}>
                        <Paper
                          elevation={0}
                          onClick={() => {
                            const matchedRol = roles.find((item: any) => item.nombre_rol?.toUpperCase() === r.rol);
                            setFormData({
                              ...formData,
                              rol: r.rol,
                              id_rol: matchedRol?.id_rol || r.id
                            });
                          }}
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: isSelected ? `2px solid ${r.color}` : '1px solid #E2E8F0',
                            backgroundColor: isSelected ? r.bg : '#F8FAFC',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: r.color,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: r.color }}>
                            {r.icon}
                            <Typography variant="body2" sx={{ fontWeight: 700, color: r.color }}>
                              {r.title}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.35 }}>
                            {r.desc}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: '1 1 200px' }}>
                  <InputLabel>Estado de la Cuenta</InputLabel>
                  <Select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    label="Estado de la Cuenta"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="Activo">Activo (Habilitado)</MenuItem>
                    <MenuItem value="Inactivo">Inactivo (Deshabilitado)</MenuItem>
                    <MenuItem value="Bloqueado">Bloqueado (Acceso Suspendido)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Puesto Organizacional"
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                  placeholder="ej. Auditor TI, Oficial de Seguridad"
                  className="input"
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />

                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Nombre de Usuario (Login)"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ej. jperez, aud_auxiliar"
                  helperText="Identificador único para iniciar sesión"
                  className="input"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon sx={{ color: '#6B7280', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Box>

              {!editingUsuario && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    sx={{ flex: 1 }}
                    label="Contraseña Inicial"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres (opcional)"
                    helperText="Si se deja vacío, el sistema generará una contraseña temporal segura"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#6B7280', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '12px' }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
                      let res = '';
                      for (let i = 0; i < 12; i++) {
                        res += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setFormData({ ...formData, password: res });
                      toast.success(`Clave temporal generada: ${res}`);
                    }}
                    sx={{ mt: 1, borderRadius: '10px', textTransform: 'none', py: 1.2 }}
                  >
                    Generar Clave
                  </Button>
                </Box>
              )}

              {editingUsuario && (
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 1 }}>
                    Seguridad de la Cuenta
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      {formData.estado === 'Bloqueado'
                        ? 'La cuenta se encuentra bloqueada por intentos fallidos de inicio de sesión.'
                        : 'La cuenta se encuentra operativa.'}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<LockResetIcon />}
                      onClick={() => {
                        setFormData({ ...formData, estado: 'Activo', desbloquear: true });
                        toast.success('Cuenta marcada para desbloqueo al guardar');
                      }}
                      sx={{ borderRadius: '8px', textTransform: 'none' }}
                    >
                      Desbloquear Cuenta
                    </Button>
                  </Box>
                </Box>
              )}
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

      {/* Modal de Restablecimiento Directo de Contraseña por Admin (HU-010 / SCRUM-37) */}
      <Dialog
        open={openResetDialog}
        onClose={handleCloseResetDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B45309',
              }}
            >
              <KeyIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Restablecer Contraseña de Usuario
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Gestión Administrativa de Credenciales (SCRUM-37)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmitResetPassword}>
          <DialogContent sx={{ pt: 2 }}>
            {selectedUserForReset && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                  {selectedUserForReset.nombre || selectedUserForReset.nombre_completo}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Usuario: <strong>{selectedUserForReset.username || `user_${selectedUserForReset.id}`}</strong> • Email: {selectedUserForReset.email || selectedUserForReset.email_institucional}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  Rol actual: <strong>{selectedUserForReset.rol || selectedUserForReset.rol_nombre || 'CONSULTOR'}</strong>
                </Typography>
              </Box>
            )}

            {resetSuccessResult ? (
              <Alert
                severity="success"
                sx={{ mb: 2, borderRadius: '12px' }}
                action={
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(resetSuccessResult.password_temporal || resetNewPassword);
                      toast.success('Contraseña copiada al portapapeles');
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ¡Contraseña restablecida con éxito!
                </Typography>
                <Typography variant="body2">
                  Nueva clave temporal: <code>{resetSuccessResult.password_temporal || resetNewPassword}</code>
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
                  Comparte esta credencial temporal con el usuario de manera segura.
                </Typography>
              </Alert>
            ) : (
              <Stack spacing={2.5}>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  Introduce una nueva contraseña para el usuario o presiona "Generar Clave Aleatoria".
                  Al guardar, se desbloqueará la cuenta automáticamente.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Nueva Contraseña"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#64748B', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '10px' },
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleGenerateRandomPassword}
                    sx={{ borderRadius: '10px', textTransform: 'none', px: 2, whiteSpace: 'nowrap' }}
                  >
                    Generar Clave
                  </Button>
                </Box>
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleCloseResetDialog} sx={{ color: '#64748B' }}>
              {resetSuccessResult ? 'Finalizar' : 'Cancelar'}
            </Button>
            {!resetSuccessResult && (
              <Button
                type="submit"
                variant="contained"
                disabled={resetPasswordMutation.isPending}
                startIcon={!resetPasswordMutation.isPending && <CheckCircleIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {resetPasswordMutation.isPending ? 'Guardando...' : 'Confirmar Restablecimiento'}
              </Button>
            )}
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
