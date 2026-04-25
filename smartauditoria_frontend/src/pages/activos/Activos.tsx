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
  Grid,
  Chip,
  Alert,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Stack,
  Divider,
  Tooltip,
  Autocomplete,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { activosService as activosServiceCorrecto, type Activo, type CreateActivoData } from '../../services/activos';
import '../../styles/design-system.css';

const Activos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [criticidadFilter, setCriticidadFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);
  const [detalleActivo, setDetalleActivo] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null);
  const [formData, setFormData] = useState<CreateActivoData>({
    Nombre: '',
    Descripcion: '',
    Tipo_Activo: '',
    estado_activo: 'Planificado',
    nivel_criticidad_negocio: 'Medio',
  });

  const queryClient = useQueryClient();

  // Queries
  const { data: activos = [], isLoading, error } = useQuery({
    queryKey: ['activos', tipoFilter, estadoFilter, criticidadFilter],
    queryFn: async () => {
      try {
        return await activosServiceCorrecto.getActivos({
          tipo_activo: tipoFilter || undefined,
          estado: estadoFilter || undefined,
          nivel_criticidad: criticidadFilter || undefined,
        });
      } catch (error) {
        console.error('Error fetching activos:', error);
        toast.error('Error al cargar activos');
        return [];
      }
    },
  });

  // Calcular estadisticas de activos desde los datos
  const activosStats = React.useMemo(() => {
    const total = activos.length;
    const en_produccion = activos.filter(a => a.estado_activo === 'En Produccion' || a.estado_activo === 'Produccion').length;
    const alta_criticidad = activos.filter(a => 
      a.nivel_criticidad_negocio === 'Alto' || 
      a.nivel_criticidad_negocio === 'Critico' ||
      a.nivel_criticidad_negocio === 'Alta'
    ).length;
    const requieren_backup = activos.filter(a => a.requiere_backup === true).length;
    
    return {
      total,
      en_produccion,
      alta_criticidad,
      requieren_backup
    };
  }, [activos]);

  // Obtener tipos y estados unicos de los datos reales
  const tiposActivo = [...new Set(activos.map(activo => activo.Tipo_Activo).filter(Boolean))];
  const estadosActivo = [...new Set(activos.map(activo => activo.estado_activo).filter(Boolean))];
  const criticidadesActivo = [...new Set(activos.map(activo => activo.nivel_criticidad_negocio).filter(Boolean))];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateActivoData) => {
      return await activosServiceCorrecto.createActivo(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast.success('âœ… Activo creado exitosamente');
      handleCloseDialog();
      setFormData({
        Nombre: '',
        Descripcion: '',
        Tipo_Activo: '',
        estado_activo: 'Planificado',
        nivel_criticidad_negocio: 'Medio',
      });
    },
    onError: (error: any) => {
      console.error('Error creating activo:', error);
      let errorMessage = 'Error desconocido';
      
      if (error.response) {
        // El servidor respondio con un codigo de error
        errorMessage = error.response.data?.error || error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // La peticion se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend este corriendo.';
      } else {
        // Algo mas paso
        errorMessage = error.message || 'Error desconocido';
      }
      
      toast.error(`âŒ Error al crear activo: ${errorMessage}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateActivoData> }) => {
      return await activosServiceCorrecto.updateActivo(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast.success('âœ… Activo actualizado exitosamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`âŒ Error al actualizar activo: ${errorMessage}`);
      console.error('Error updating activo:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await activosServiceCorrecto.deleteActivo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast.success('âœ… Activo eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`âŒ Error al eliminar activo: ${errorMessage}`);
      console.error('Error deleting activo:', error);
    },
  });

  // Filtered activos based on search term and filters
  const filteredActivos = activos.filter(activo => {
    const matchesSearch = !searchTerm || 
      (activo.Nombre || false || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activo.Descripcion && activo.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTipo = !tipoFilter || activo.Tipo_Activo === tipoFilter;
    const matchesEstado = !estadoFilter || activo.estado_activo === estadoFilter;
    const matchesCriticidad = !criticidadFilter || activo.nivel_criticidad_negocio === criticidadFilter;
    
    return matchesSearch && matchesTipo && matchesEstado && matchesCriticidad;
  });

  const handleOpenDialog = (activo?: Activo) => {
    if (activo) {
      setEditingActivo(activo);
      setFormData({
        Nombre: activo.Nombre || '',
        Descripcion: activo.Descripcion || '',
        Tipo_Activo: activo.Tipo_Activo || '',
        estado_activo: activo.estado_activo || 'Planificado',
        nivel_criticidad_negocio: activo.nivel_criticidad_negocio || 'Medio',
        subtipo_activo: activo.subtipo_activo,
        ID_Propietario: activo.ID_Propietario,
        ID_Custodio: activo.ID_Custodio,
        version_general_activo: activo.version_general_activo,
        requiere_backup: activo.requiere_backup,
      });
    } else {
      setEditingActivo(null);
      setFormData({
        Nombre: '',
        Descripcion: '',
        Tipo_Activo: '',
        estado_activo: 'Planificado',
        nivel_criticidad_negocio: 'Medio',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingActivo(null);
  };

  const handleConsultarActivo = async (activo: Activo) => {
    try {
      setSelectedActivo(activo);
      setOpenDetalleDialog(true);
      setLoadingDetalle(true);
      const detalle = await activosServiceCorrecto.getDetalleActivo(activo.ID_Activo);
      setDetalleActivo(detalle);
    } catch (error: any) {
      console.error('Error fetching detalle activo:', error);
      toast.error('Error al cargar el detalle del activo');
      setDetalleActivo(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCloseDetalleDialog = () => {
    setOpenDetalleDialog(false);
    setSelectedActivo(null);
    setDetalleActivo(null);
  };

  const exportarPDF = async () => {
    if (!detalleActivo) return;
    
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
      doc.text('Reporte de Detalle de Activo', margin, yPos);
      yPos += 10;
      
      // Informacion General
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Informacion General', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.text(`Nombre: ${detalleActivo.activo?.Nombre || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Tipo: ${detalleActivo.activo?.Tipo_Activo || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Estado: ${detalleActivo.activo?.estado_activo || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Criticidad: ${detalleActivo.activo?.nivel_criticidad_negocio || 'N/A'}`, margin, yPos);
      yPos += 6;
      
      if (detalleActivo.activo?.Descripcion) {
        const descLines = doc.splitTextToSize(`Descripcion: ${detalleActivo.activo.Descripcion}`, maxWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 5;
      }
      
      yPos += 5;
      
      // Evaluaciones
      if (detalleActivo.evaluaciones && detalleActivo.evaluaciones.length > 0) {
        doc.setFontSize(14);
        doc.text(`Resumen de Evaluaciones (${detalleActivo.total_evaluaciones})`, margin, yPos);
        yPos += 8;
        
        detalleActivo.evaluaciones.forEach((evaluacion: any, index: number) => {
          // Verificar si necesitamos una nueva pagina
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(30, 58, 138);
          doc.text(`${index + 1}. ${evaluacion.riesgo?.Nombre || 'Riesgo sin nombre'}`, margin, yPos);
          yPos += 6;
          
          if (evaluacion.riesgo?.descripcion) {
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const descLines = doc.splitTextToSize(evaluacion.riesgo.descripcion, maxWidth);
            doc.text(descLines, margin, yPos);
            yPos += descLines.length * 5;
          }
          
          yPos += 3;
          
          // Evaluacion Inherente
          if (evaluacion.evaluacion_inherente) {
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text('Evaluacion Inherente:', margin, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.text(`  Probabilidad: ${evaluacion.evaluacion_inherente.probabilidad || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            doc.text(`  Impacto: ${evaluacion.evaluacion_inherente.impacto || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            doc.text(`  Nivel de Riesgo: ${evaluacion.evaluacion_inherente.nivel_riesgo || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            
            if (evaluacion.evaluacion_inherente.justificacion) {
              const justLines = doc.splitTextToSize(`  Justificacion: ${evaluacion.evaluacion_inherente.justificacion}`, maxWidth - 10);
              doc.text(justLines, margin + 5, yPos);
              yPos += justLines.length * 5;
            }
          }
          
          yPos += 3;
          
          // Evaluacion Residual
          if (evaluacion.evaluacion_residual) {
            doc.setFontSize(11);
            doc.text('Evaluacion Residual (Despues de Controles):', margin, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.text(`  Probabilidad: ${evaluacion.evaluacion_residual.probabilidad || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            doc.text(`  Impacto: ${evaluacion.evaluacion_residual.impacto || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            doc.text(`  Nivel de Riesgo: ${evaluacion.evaluacion_residual.nivel_riesgo || 'N/A'}`, margin + 5, yPos);
            yPos += 5;
            
            if (evaluacion.evaluacion_residual.justificacion) {
              const justLines = doc.splitTextToSize(`  Justificacion: ${evaluacion.evaluacion_residual.justificacion}`, maxWidth - 10);
              doc.text(justLines, margin + 5, yPos);
              yPos += justLines.length * 5;
            }
          }
          
          yPos += 3;
          
          // Controles Aplicados
          if (evaluacion.controles_aplicados && evaluacion.controles_aplicados.length > 0) {
            doc.setFontSize(11);
            doc.text(`Controles Aplicados (${evaluacion.controles_aplicados.length}):`, margin, yPos);
            yPos += 6;
            
            evaluacion.controles_aplicados.forEach((control: any) => {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }
              
              doc.setFontSize(10);
              doc.text(`  - ${control.Nombre}`, margin + 5, yPos);
              yPos += 5;
              if (control.codigo_iso) {
                doc.text(`    Codigo ISO: ${control.codigo_iso}`, margin + 10, yPos);
                yPos += 5;
              }
              if (control.descripcion) {
                const ctrlDescLines = doc.splitTextToSize(`    Descripcion: ${control.descripcion}`, maxWidth - 15);
                doc.text(ctrlDescLines, margin + 10, yPos);
                yPos += ctrlDescLines.length * 5;
              }
            });
          }
          
          yPos += 5;
        });
      } else {
        doc.setFontSize(10);
        doc.text('Este activo no tiene evaluaciones registradas.', margin, yPos);
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
      const fileName = `Reporte_Activo_${detalleActivo.activo?.Nombre?.replace(/[^a-z0-9]/gi, '_') || 'Activo'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
    if (!detalleActivo) return;
    
    try {
      setExportando(true);
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default || XLSXModule;
      
      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Informacion General
      const infoData = [
        ['REPORTE DE DETALLE DE ACTIVO'],
        [''],
        ['INFORMACIÃ“N GENERAL'],
        ['Nombre', detalleActivo.activo?.Nombre || 'N/A'],
        ['Tipo de Activo', detalleActivo.activo?.Tipo_Activo || 'N/A'],
        ['Estado', detalleActivo.activo?.estado_activo || 'N/A'],
        ['Nivel de Criticidad', detalleActivo.activo?.nivel_criticidad_negocio || 'N/A'],
        ['Descripcion', detalleActivo.activo?.Descripcion || 'N/A'],
        [''],
        ['RESUMEN DE EVALUACIONES'],
        ['Total de Evaluaciones', detalleActivo.total_evaluaciones || 0],
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Informacion General');
      
      // Hoja 2: Evaluaciones
      if (detalleActivo.evaluaciones && detalleActivo.evaluaciones.length > 0) {
        const evaluacionesData = [
          ['ID Evaluacion', 'Riesgo', 'Categoria', 'Probabilidad Inh.', 'Impacto Inh.', 'Nivel Riesgo Inh.', 
           'Probabilidad Res.', 'Impacto Res.', 'Nivel Riesgo Res.', 'Fecha Evaluacion', 'Justificacion Inh.', 'Justificacion Res.']
        ];
        
        detalleActivo.evaluaciones.forEach((evaluacion: any) => {
          evaluacionesData.push([
            evaluacion.ID_Activo_evaluacion || '',
            evaluacion.riesgo?.Nombre || '',
            evaluacion.riesgo?.categoria || '',
            evaluacion.evaluacion_inherente?.probabilidad || '',
            evaluacion.evaluacion_inherente?.impacto || '',
            evaluacion.evaluacion_inherente?.nivel_riesgo || '',
            evaluacion.evaluacion_residual?.probabilidad || '',
            evaluacion.evaluacion_residual?.impacto || '',
            evaluacion.evaluacion_residual?.nivel_riesgo || '',
            evaluacion.evaluacion_inherente?.fecha || '',
            evaluacion.evaluacion_inherente?.justificacion || '',
            evaluacion.evaluacion_residual?.justificacion || ''
          ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(evaluacionesData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Evaluaciones');
        
        // Hoja 3: Controles Aplicados
        const controlesData = [
          ['ID Evaluacion', 'Riesgo', 'ID Control', 'Nombre Control', 'Codigo ISO', 'Tipo', 'Categoria', 'Descripcion', 'Justificacion', 'Eficacia']
        ];
        
        detalleActivo.evaluaciones.forEach((evaluacion: any) => {
          if (evaluacion.controles_aplicados && evaluacion.controles_aplicados.length > 0) {
            evaluacion.controles_aplicados.forEach((control: any) => {
              controlesData.push([
                evaluacion.ID_Activo_evaluacion || '',
                evaluacion.riesgo?.Nombre || '',
                control.ID_Activo || '',
                control.Nombre || '',
                control.codigo_iso || '',
                control.tipo || '',
                control.categoria || '',
                control.descripcion || '',
                control.justificacion || '',
                control.eficacia || ''
              ]);
            });
          }
        });
        
        if (controlesData.length > 1) {
          const ws3 = XLSX.utils.aoa_to_sheet(controlesData);
          XLSX.utils.book_append_sheet(wb, ws3, 'Controles Aplicados');
        }
      }
      
      // Guardar archivo
      const fileName = `Reporte_Activo_${detalleActivo.activo?.Nombre?.replace(/[^a-z0-9]/gi, '_') || 'Activo'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('âœ… Reporte Excel generado exitosamente');
    } catch (error) {
      console.error('Error generando Excel:', error);
      toast.error('âŒ Error al generar el reporte Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSubmit called', { formData, editingActivo });
    
    // Validaciones
    if (!formData.Nombre || !formData.Nombre.trim()) {
      toast.error('âŒ El nombre del activo es obligatorio');
      return;
    }
    if (!formData.Tipo_Activo) {
      toast.error('âŒ El tipo de activo es obligatorio');
      return;
    }
    
    console.log('Validations passed, calling mutation');
    
    if (editingActivo) {
      console.log('Updating activo:', editingActivo.ID_Activo);
      updateMutation.mutate({ id: editingActivo.ID_Activo, data: formData });
    } else {
      console.log('Creating new activo');
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Â¿Esta seguro de que desea eliminar este activo?')) {
      deleteMutation.mutate(id);
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
      field: 'Nombre', 
      headerName: 'Nombre del Activo', 
      width: 300,
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => {
        const nombre = params.value || 'Sin nombre';
        const iniciales = nombre.split(' ').map((word: string) => word.charAt(0)).join('').substring(0, 3).toUpperCase();
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32,
              backgroundColor: '#1E3A8A',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {iniciales}
            </Avatar>
            <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
              {nombre}
            </Typography>
          </Box>
        );
      },
    },
    { 
      field: 'Tipo_Activo', 
      headerName: 'Tipo', 
      width: 140,
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: 'estado_activo', 
      headerName: 'Estado', 
      width: 140,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: params.value === 'En produccion' ? '#D1FAE5' : 
                             params.value === 'Planificado' ? '#FEF3C7' :
                             params.value === 'En desarrollo' ? '#DBEAFE' : '#F3F4F6',
              color: params.value === 'En produccion' ? '#065F46' : 
                     params.value === 'Planificado' ? '#92400E' :
                     params.value === 'En desarrollo' ? '#1E40AF' : '#374151',
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        </Box>
      ),
    },
    {
      field: 'nivel_criticidad_negocio',
      headerName: 'Criticidad',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: params.value === 'Critico' ? '#FEE2E2' :
                             params.value === 'Alto' ? '#FEF3C7' :
                             params.value === 'Medio' ? '#DBEAFE' : '#F3F4F6',
              color: params.value === 'Critico' ? '#DC2626' :
                     params.value === 'Alto' ? '#D97706' :
                     params.value === 'Medio' ? '#2563EB' : '#6B7280',
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
          <Tooltip title="Consultar detalle del activo">
            <IconButton
              size="small"
              onClick={() => handleConsultarActivo(params.row)}
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
          <Tooltip title="Editar activo">
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
          <Tooltip title="Eliminar activo">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.ID_Activo)}
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
          Error al cargar los activos: {error.message}
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
              Gestion de Activos
            </Typography>
            <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
              Administra y monitorea todos los activos de informacion de la organizacion
            </Typography>
          </Box>
          <Button
            className="btn btn-primary"
            startIcon={<AddIcon />}
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
            Nuevo Activo
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
                      {activosStats?.total ?? activos.length}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ opacity: 0.9 }}>
                      Total Activos
                    </Typography>
                  </Box>
                  <SecurityIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      {activosStats?.en_produccion ?? 0}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      En Produccion
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#10B981' }} />
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
                      {activosStats?.alta_criticidad ?? 0}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Alta Criticidad
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
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
                      {activosStats?.requieren_backup ?? 0}
                    </Typography>
                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Requieren Backup
                    </Typography>
                  </Box>
                  <SecurityIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
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
                options={activos.map(activo => ({
                  id: activo.ID_Activo,
                  label: activo.Nombre || activo.Nombre || `Activo ${activo.ID_Activo}`,
                  activo: activo
                }))}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                value={searchTerm}
                onInputChange={(event, newValue) => {
                  setSearchTerm(newValue || '');
                }}
                filterOptions={(options, { inputValue }) => {
                  return options.filter(option => {
                    const label = typeof option === 'string' ? option : option.label;
                    return label.toLowerCase().includes(inputValue.toLowerCase());
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Buscar activos por nombre o descripcion..."
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
                renderOption={(props, option) => {
                  const activo = typeof option === 'string' 
                    ? activos.find(a => (a.Nombre || a.Nombre) === option)
                    : option.activo;
                  const label = typeof option === 'string' ? option : option.label;
                  const key = typeof option === 'string' 
                    ? activo?.ID_Activo || label
                    : option.id;
                  
                  return (
                    <Box component="li" {...props} key={key}>
                      <Box>
                        <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500 }}>
                          {label}
                        </Typography>
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                          {activo?.Tipo_Activo} â€¢ {activo?.estado_activo}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                sx={{
                  '& .MuiAutocomplete-paper': {
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              />
            </Box>
            
            <FormControl sx={{ minWidth: '140px' }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                label="Tipo"
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
                <MenuItem value="">Todos los tipos</MenuItem>
                {tiposActivo.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
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
                {estadosActivo.map((estado) => (
                  <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: '140px' }}>
              <InputLabel>Criticidad</InputLabel>
              <Select
                value={criticidadFilter}
                onChange={(e) => setCriticidadFilter(e.target.value)}
                label="Criticidad"
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
                <MenuItem value="">Todas las criticidades</MenuItem>
                <MenuItem value="Muy Alto">Muy Alto</MenuItem>
                <MenuItem value="Alto">Alto</MenuItem>
                <MenuItem value="Medio">Medio</MenuItem>
                <MenuItem value="Bajo">Bajo</MenuItem>
                <MenuItem value="Muy Bajo">Muy Bajo</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Limpiar todos los filtros">
              <Button
                className="btn btn-secondary"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setTipoFilter('');
                  setEstadoFilter('');
                  setCriticidadFilter('');
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
          title="Lista de Activos" 
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
              getRowId={(row) => row.ID_Activo}
              rows={filteredActivos}
              columns={columns}
              loading={isLoading}
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
        maxWidth="lg" 
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
            pb: 3,
            pt: 3,
            px: 3,
            borderBottom: '1px solid #E5E7EB',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            borderRadius: '16px 16px 0 0',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" className="font-poppins" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {editingActivo ? 'Editar Activo' : 'Crear Nuevo Activo'}
                </Typography>
                <Typography variant="body2" className="font-roboto" sx={{ opacity: 0.9 }}>
                  {editingActivo ? 'Modifica la informacion del activo seleccionado' : 'Agrega un nuevo activo al inventario'}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 6, px: 4, pb: 3, mt: 3 }}>
            <Grid container spacing={4}>
              <Grid  size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre del Activo *"
                  value={formData.Nombre}
                  onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                  required
                  className="input"
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid  size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel id="tipo-activo-label" sx={{ mt: 0.5 }}>Tipo de Activo *</InputLabel>
                  <Select
                    labelId="tipo-activo-label"
                    value={formData.Tipo_Activo}
                    onChange={(e) => setFormData({ ...formData, Tipo_Activo: e.target.value })}
                    label="Tipo de Activo *"
                    sx={{ borderRadius: '12px', minWidth: '200px' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem value="Hardware">Hardware</MenuItem>
                    <MenuItem value="Sistema de Informacion">Sistema de Informacion</MenuItem>
                    <MenuItem value="Software">Software</MenuItem>
                    <MenuItem value="Datos">Datos</MenuItem>
                    <MenuItem value="Servicios">Servicios</MenuItem>
                    <MenuItem value="Documentos">Documentos</MenuItem>
                    <MenuItem value="Recurso Humano">Recurso Humano</MenuItem>
                    <MenuItem value="Intangible">Intangible</MenuItem>
                    <MenuItem value="Infraestructura Fisica">Infraestructura Fisica</MenuItem>
                    <MenuItem value="Plataforma">Plataforma</MenuItem>
                    <MenuItem value="Aplicacion/Sistema">Aplicacion/Sistema</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid  size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripcion del Activo"
                  value={formData.Descripcion}
                  onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                  className="input"
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              
              <Grid  size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="estado-activo-label" sx={{ mt: 0.5 }}>Estado del Activo</InputLabel>
                  <Select
                    labelId="estado-activo-label"
                    value={formData.estado_activo}
                    onChange={(e) => setFormData({ ...formData, estado_activo: e.target.value })}
                    label="Estado del Activo"
                    sx={{ borderRadius: '12px', minWidth: '200px' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem value="En produccion">En produccion</MenuItem>
                    <MenuItem value="En desarrollo">En desarrollo</MenuItem>
                    <MenuItem value="Obsoleto">Obsoleto</MenuItem>
                    <MenuItem value="Retirado">Retirado</MenuItem>
                    <MenuItem value="En mantenimiento">En mantenimiento</MenuItem>
                    <MenuItem value="Planificado">Planificado</MenuItem>
                    <MenuItem value="En stock">En stock</MenuItem>
                    <MenuItem value="Danado">Danado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid  size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="criticidad-label" sx={{ mt: 0.5 }}>Nivel de Criticidad</InputLabel>
                  <Select
                    labelId="criticidad-label"
                    value={formData.nivel_criticidad_negocio}
                    onChange={(e) => setFormData({ ...formData, nivel_criticidad_negocio: e.target.value })}
                    label="Nivel de Criticidad"
                    sx={{ borderRadius: '12px', minWidth: '200px' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem value="Muy Alto">Muy Alto</MenuItem>
                    <MenuItem value="Alto">Alto</MenuItem>
                    <MenuItem value="Medio">Medio</MenuItem>
                    <MenuItem value="Bajo">Bajo</MenuItem>
                    <MenuItem value="Muy Bajo">Muy Bajo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Campos dinamicos segun el tipo de activo */}
              {formData.Tipo_Activo === 'Hardware' && (
                <>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Subtipo de Hardware"
                      value={formData.subtipo_activo || ''}
                      onChange={(e) => setFormData({ ...formData, subtipo_activo: e.target.value })}
                      placeholder="Ej: Servidor, Computadora, Router, etc."
                      className="input"
                      InputProps={{
                        sx: { borderRadius: '12px' }
                      }}
                    />
                  </Grid>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Version/Modelo"
                      value={formData.version_general_activo || ''}
                      onChange={(e) => setFormData({ ...formData, version_general_activo: e.target.value })}
                      placeholder="Ej: Dell PowerEdge R740, Cisco ASR 1000"
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
                      label="Fecha de Adquisicion"
                      value={formData.fecha_adquisicion || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      className="input"
                      InputProps={{
                        sx: { borderRadius: '12px' }
                      }}
                    />
                  </Grid>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="requiere-backup-label" sx={{ mt: 0.5 }}>Requiere Backup</InputLabel>
                      <Select
                        labelId="requiere-backup-label"
                        value={formData.requiere_backup !== undefined ? formData.requiere_backup.toString() : 'true'}
                        onChange={(e) => setFormData({ ...formData, requiere_backup: e.target.value === 'true' })}
                        label="Requiere Backup"
                        sx={{ borderRadius: '12px' }}
                      >
                        <MenuItem value="true">Si</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
              {formData.Tipo_Activo === 'Sistema de Informacion' && (
                <>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Subtipo de Sistema"
                      value={formData.subtipo_activo || ''}
                      onChange={(e) => setFormData({ ...formData, subtipo_activo: e.target.value })}
                      placeholder="Ej: ERP, CRM, Sistema de Gestion, etc."
                      className="input"
                      InputProps={{
                        sx: { borderRadius: '12px' }
                      }}
                    />
                  </Grid>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Version del Sistema"
                      value={formData.version_general_activo || ''}
                      onChange={(e) => setFormData({ ...formData, version_general_activo: e.target.value })}
                      placeholder="Ej: v2.1.0, 2024.1"
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
                      label="Fecha de Implementacion"
                      value={formData.fecha_adquisicion || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      className="input"
                      InputProps={{
                        sx: { borderRadius: '12px' }
                      }}
                    />
                  </Grid>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="requiere-backup-si-label" sx={{ mt: 0.5 }}>Requiere Backup</InputLabel>
                      <Select
                        labelId="requiere-backup-si-label"
                        value={formData.requiere_backup !== undefined ? formData.requiere_backup.toString() : 'true'}
                        onChange={(e) => setFormData({ ...formData, requiere_backup: e.target.value === 'true' })}
                        label="Requiere Backup"
                        sx={{ borderRadius: '12px' }}
                      >
                        <MenuItem value="true">Si</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Frecuencia de Backup"
                      value={formData.frecuencia_backup_general || ''}
                      onChange={(e) => setFormData({ ...formData, frecuencia_backup_general: e.target.value })}
                      placeholder="Ej: Diario, Semanal, Mensual"
                      className="input"
                      InputProps={{
                        sx: { borderRadius: '12px' }
                      }}
                    />
                  </Grid>
                  <Grid  size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Tiempo de Retencion"
                      value={formData.tiempo_retencion_general || ''}
                      onChange={(e) => setFormData({ ...formData, tiempo_retencion_general: e.target.value })}
                      placeholder="Ej: 30 dias, 1 ano"
                      className="input"
                      InputProps={{
                        sx: { borderRadius: '12px' }
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
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
              {editingActivo ? 'Actualizar Activo' : 'Crear Activo'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de Detalle del Activo */}
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
          pt: 3,
          px: 3,
          borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
          color: '#FFFFFF'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 600 }}>
              Detalle del Activo
            </Typography>
            <IconButton
              onClick={handleCloseDetalleDialog}
              sx={{ color: '#FFFFFF' }}
            >
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, px: 3, pb: 3 }}>
          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
                Cargando detalle del activo...
              </Typography>
            </Box>
          ) : detalleActivo ? (
            <Box>
              {/* Informacion del Activo */}
              <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 2 }}>
                    Informacion General
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 0.5 }}>
                        Nombre
                      </Typography>
                      <Typography variant="body1" className="font-poppins" sx={{ color: '#374151', fontWeight: 500 }}>
                        {detalleActivo.activo?.Nombre || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 0.5 }}>
                        Tipo de Activo
                      </Typography>
                      <Typography variant="body1" className="font-poppins" sx={{ color: '#374151', fontWeight: 500 }}>
                        {detalleActivo.activo?.Tipo_Activo || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 0.5 }}>
                        Estado
                      </Typography>
                      <Chip
                        label={detalleActivo.activo?.estado_activo || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: detalleActivo.activo?.estado_activo === 'En Produccion' ? '#D1FAE5' : '#FEF3C7',
                          color: detalleActivo.activo?.estado_activo === 'En Produccion' ? '#065F46' : '#92400E',
                          fontWeight: 500,
                        }}
                      />
                    </Grid>
                    <Grid  size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 0.5 }}>
                        Nivel de Criticidad
                      </Typography>
                      <Chip
                        label={detalleActivo.activo?.nivel_criticidad_negocio || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: detalleActivo.activo?.nivel_criticidad_negocio === 'Critico' ? '#FEE2E2' : 
                                         detalleActivo.activo?.nivel_criticidad_negocio === 'Alto' ? '#FEF3C7' : '#DBEAFE',
                          color: detalleActivo.activo?.nivel_criticidad_negocio === 'Critico' ? '#DC2626' :
                                detalleActivo.activo?.nivel_criticidad_negocio === 'Alto' ? '#D97706' : '#2563EB',
                          fontWeight: 500,
                        }}
                      />
                    </Grid>
                    {detalleActivo.activo?.Descripcion && (
                      <Grid  size={{ xs: 12 }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 0.5 }}>
                          Descripcion
                        </Typography>
                        <Typography variant="body1" className="font-roboto" sx={{ color: '#374151' }}>
                          {detalleActivo.activo.Descripcion}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Evaluaciones */}
              {detalleActivo.evaluaciones && detalleActivo.evaluaciones.length > 0 ? (
                <Box>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 2 }}>
                    Resumen de Evaluaciones ({detalleActivo.total_evaluaciones})
                  </Typography>
                  {detalleActivo.evaluaciones.map((evaluacion: any, index: number) => (
                    <Card key={evaluacion.ID_Activo_evaluacion || index} sx={{ mb: 2, border: '1px solid #E5E7EB' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
                            {evaluacion.riesgo?.Nombre || 'Riesgo sin nombre'}
                          </Typography>
                          {evaluacion.riesgo?.categoria && (
                            <Chip
                              label={evaluacion.riesgo.categoria}
                              size="small"
                              sx={{ backgroundColor: '#EFF6FF', color: '#1E3A8A' }}
                            />
                          )}
                        </Box>
                        
                        {evaluacion.riesgo?.descripcion && (
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 2 }}>
                            {evaluacion.riesgo.descripcion}
                          </Typography>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Evaluacion Inherente */}
                        {evaluacion.evaluacion_inherente && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>
                              Evaluacion Inherente
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid  size={{ xs: 12, md: 4 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  Probabilidad: <strong>{evaluacion.evaluacion_inherente.probabilidad || 'N/A'}</strong>
                                </Typography>
                              </Grid>
                              <Grid  size={{ xs: 12, md: 4 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  Impacto: <strong>{evaluacion.evaluacion_inherente.impacto || 'N/A'}</strong>
                                </Typography>
                              </Grid>
                              <Grid  size={{ xs: 12, md: 4 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  Nivel de Riesgo: 
                                  <Chip
                                    label={evaluacion.evaluacion_inherente.nivel_riesgo || 'N/A'}
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: evaluacion.evaluacion_inherente.nivel_riesgo === 'ALTO' ? '#FEE2E2' :
                                                     evaluacion.evaluacion_inherente.nivel_riesgo === 'MEDIO' ? '#FEF3C7' : '#D1FAE5',
                                      color: evaluacion.evaluacion_inherente.nivel_riesgo === 'ALTO' ? '#DC2626' :
                                            evaluacion.evaluacion_inherente.nivel_riesgo === 'MEDIO' ? '#D97706' : '#065F46',
                                      fontWeight: 600,
                                    }}
                                  />
                                </Typography>
                              </Grid>
                              {evaluacion.evaluacion_inherente.justificacion && (
                                <Grid  size={{ xs: 12 }}>
                                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                                    Justificacion: {evaluacion.evaluacion_inherente.justificacion}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )}

                        {/* Evaluacion Residual */}
                        {evaluacion.evaluacion_residual && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>
                              Evaluacion Residual (Despues de Controles)
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid  size={{ xs: 12, md: 4 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  Probabilidad: <strong>{evaluacion.evaluacion_residual.probabilidad || 'N/A'}</strong>
                                </Typography>
                              </Grid>
                              <Grid  size={{ xs: 12, md: 4 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  Impacto: <strong>{evaluacion.evaluacion_residual.impacto || 'N/A'}</strong>
                                </Typography>
                              </Grid>
                              <Grid  size={{ xs: 12, md: 4 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  Nivel de Riesgo: 
                                  <Chip
                                    label={evaluacion.evaluacion_residual.nivel_riesgo || 'N/A'}
                                    size="small"
                                    sx={{
                                      ml: 1,
                                      backgroundColor: evaluacion.evaluacion_residual.nivel_riesgo === 'ALTO' ? '#FEE2E2' :
                                                     evaluacion.evaluacion_residual.nivel_riesgo === 'MEDIO' ? '#FEF3C7' : '#D1FAE5',
                                      color: evaluacion.evaluacion_residual.nivel_riesgo === 'ALTO' ? '#DC2626' :
                                            evaluacion.evaluacion_residual.nivel_riesgo === 'MEDIO' ? '#D97706' : '#065F46',
                                      fontWeight: 600,
                                    }}
                                  />
                                </Typography>
                              </Grid>
                              {evaluacion.evaluacion_residual.justificacion && (
                                <Grid  size={{ xs: 12 }}>
                                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                                    Justificacion: {evaluacion.evaluacion_residual.justificacion}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )}

                        {/* Controles Aplicados */}
                        {evaluacion.controles_aplicados && evaluacion.controles_aplicados.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>
                              Controles Aplicados ({evaluacion.controles_aplicados.length})
                            </Typography>
                            <Stack spacing={1}>
                              {evaluacion.controles_aplicados.map((control: any, ctrlIndex: number) => (
                                <Card key={control.ID_Activo || ctrlIndex} variant="outlined" sx={{ p: 2 }}>
                                  <Typography variant="body2" className="font-poppins" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 0.5 }}>
                                    {control.Nombre}
                                  </Typography>
                                  {control.codigo_iso && (
                                    <Chip
                                      label={control.codigo_iso}
                                      size="small"
                                      sx={{ mb: 1, backgroundColor: '#EFF6FF', color: '#1E3A8A' }}
                                    />
                                  )}
                                  {control.descripcion && (
                                    <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 0.5 }}>
                                      {control.descripcion}
                                    </Typography>
                                  )}
                                  {control.justificacion && (
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                                      Justificacion: {control.justificacion}
                                    </Typography>
                                  )}
                                </Card>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ borderRadius: '12px' }}>
                  <Typography variant="body2" className="font-roboto">
                    Este activo no tiene evaluaciones registradas aun.
                  </Typography>
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
                No se pudo cargar el detalle del activo
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={exportarPDF}
              disabled={exportando || !detalleActivo}
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
              disabled={exportando || !detalleActivo}
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

export default Activos;
