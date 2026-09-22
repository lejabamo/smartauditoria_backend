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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  CircularProgress,
  Badge,
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
  AutoAwesome as SparklesIcon,
  Bolt as LightningIcon,
  Folder as FolderIcon,
  Settings as TechIcon,
  Shield as ShieldIcon,
  Gavel as LegalIcon,
  Description as DocIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { activosService as activosServiceCorrecto, type Activo, type CreateActivoData } from '../../services/activos';
import copilotService, { type AssetAssessmentResponse } from '../../services/copilotService';
import '../../styles/design-system.css';

const initialFormData: CreateActivoData = {
  Nombre: '',
  Descripcion: '',
  Tipo_Activo: 'Información y datos',
  subtipo_activo: '',
  estado_activo: 'En produccion',
  nivel_criticidad_negocio: 'Medio',
  Nivel_Clasificacion_Confidencialidad: 'Medio',
  Nivel_Clasificacion_Integridad: 'Alto',
  Nivel_Clasificacion_Disponibilidad: 'Medio',
  justificacion_clasificacion_cia: '',
  macroproceso: 'Misional',
  proceso: '',
  identificador_trd: '',
  oficina_responsable: '',
  serie_documental: '',
  subserie_documental: '',
  fecha_generacion: '',
  fecha_ingreso_archivo: '',
  soporte_registro: 'Digital',
  medio_conservacion: '',
  formato: '',
  idioma: 'Español',
  es_iccn: false,
  estado_publicacion: 'No Publicada',
  ubicacion_consulta: '',
  es_clasificada_reservada: false,
  objeto_legitimo_excepcion: '',
  fundamento_legal: '',
  excepcion_alcance: 'Total',
  requiere_backup: true,
  frecuencia_backup_general: '',
  tiempo_retencion_general: '',
};

const Activos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [criticidadFilter, setCriticidadFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);
  const [detalleActivo, setDetalleActivo] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null);
  const [formData, setFormData] = useState<CreateActivoData>(initialFormData);

  // Estados para AuditorCopilot
  const [assessingAsset, setAssessingAsset] = useState(false);
  const [copilotAssessment, setCopilotAssessment] = useState<AssetAssessmentResponse | null>(null);

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
    },    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast.success('Activo creado exitosamente');
      handleCloseDialog();
      setFormData(initialFormData);
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
      
      toast.error(`Error al crear activo: ${errorMessage}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateActivoData> }) => {
      return await activosServiceCorrecto.updateActivo(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast.success('Activo actualizado exitosamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al actualizar activo: ${errorMessage}`);
      console.error('Error updating activo:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await activosServiceCorrecto.deleteActivo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast.success('Activo eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al eliminar activo: ${errorMessage}`);
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
        Tipo_Activo: activo.Tipo_Activo || 'Información y datos',
        subtipo_activo: activo.subtipo_activo || '',
        estado_activo: activo.estado_activo || 'En produccion',
        nivel_criticidad_negocio: activo.nivel_criticidad_negocio || 'Medio',
        Nivel_Clasificacion_Confidencialidad: activo.Nivel_Clasificacion_Confidencialidad || 'Medio',
        Nivel_Clasificacion_Integridad: activo.Nivel_Clasificacion_Integridad || 'Alto',
        Nivel_Clasificacion_Disponibilidad: activo.Nivel_Clasificacion_Disponibilidad || 'Medio',
        justificacion_clasificacion_cia: activo.justificacion_clasificacion_cia || '',
        macroproceso: activo.macroproceso || 'Misional',
        proceso: activo.proceso || '',
        identificador_trd: activo.identificador_trd || '',
        oficina_responsable: activo.oficina_responsable || '',
        serie_documental: activo.serie_documental || '',
        subserie_documental: activo.subserie_documental || '',
        fecha_generacion: activo.fecha_generacion ? activo.fecha_generacion.substring(0, 10) : '',
        fecha_ingreso_archivo: activo.fecha_ingreso_archivo ? activo.fecha_ingreso_archivo.substring(0, 10) : '',
        soporte_registro: activo.soporte_registro || 'Digital',
        medio_conservacion: activo.medio_conservacion || '',
        formato: activo.formato || '',
        idioma: activo.idioma || 'Español',
        es_iccn: Boolean(activo.es_iccn),
        estado_publicacion: activo.estado_publicacion || 'No Publicada',
        ubicacion_consulta: activo.ubicacion_consulta || '',
        es_clasificada_reservada: Boolean(activo.es_clasificada_reservada),
        objeto_legitimo_excepcion: activo.objeto_legitimo_excepcion || '',
        fundamento_legal: activo.fundamento_legal || '',
        excepcion_alcance: activo.excepcion_alcance || 'Total',
        requiere_backup: activo.requiere_backup ?? true,
        frecuencia_backup_general: activo.frecuencia_backup_general || '',
        tiempo_retencion_general: activo.tiempo_retencion_general || '',
      });
    } else {
      setEditingActivo(null);
      setFormData(initialFormData);
    }
    setCopilotAssessment(null);
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingActivo(null);
    setCopilotAssessment(null);
  };

  // Acciones de Asistente IA Copilot
  const handleAssessWithCopilot = async () => {
    if (!formData.Nombre || formData.Nombre.trim().length < 3) {
      toast.error('Ingrese al menos el nombre del activo para consultar al Asistente IA');
      return;
    }
    try {
      setAssessingAsset(true);
      const res = await copilotService.assessAsset(
        formData.Nombre,
        formData.Tipo_Activo,
        formData.Descripcion
      );
      setCopilotAssessment(res);
      toast.success('✨ Asistente IA completó el análisis DAFP V7 e ISO 27002:2022');
    } catch (err: any) {
      console.error('Error al evaluar con Copilot:', err);
      toast.error('No se pudo completar la evaluación con IA en este momento');
    } finally {
      setAssessingAsset(false);
    }
  };

  const handleApplyActionChip = (chip: any) => {
    if (chip.action === 'APPLY_ASSET_METADATA' && chip.metadata) {
      setFormData(prev => ({
        ...prev,
        ...chip.metadata
      }));
      toast.success('Clasificación TRD y características técnicas aplicadas');
    } else if (chip.action === 'SET_CID_VALUES') {
      setFormData(prev => ({
        ...prev,
        Nivel_Clasificacion_Confidencialidad: chip.confidencialidad,
        Nivel_Clasificacion_Integridad: chip.integridad,
        Nivel_Clasificacion_Disponibilidad: chip.disponibilidad,
        nivel_criticidad_negocio: chip.criticidad_general,
        justificacion_clasificacion_cia: chip.justificacion || prev.justificacion_clasificacion_cia
      }));
      toast.success(`Valores CID aplicados: C(${chip.confidencialidad}) I(${chip.integridad}) D(${chip.disponibilidad})`);
    } else if (chip.action === 'APPLY_LEY_1712') {
      setFormData(prev => ({
        ...prev,
        es_clasificada_reservada: true,
        objeto_legitimo_excepcion: chip.objeto_legitimo_excepcion || prev.objeto_legitimo_excepcion,
        fundamento_legal: chip.fundamento_legal || prev.fundamento_legal,
        excepcion_alcance: chip.excepcion_alcance || 'Total'
      }));
      toast.success('Reserva legal Ley 1712 de 2014 configurada');
    } else if (chip.action === 'APPLY_CONTROL') {
      toast.success(`Control sugerido adoptado: ${chip.control_id} - ${chip.control_nombre}`);
    }
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
              backgroundColor: params.value === 'Critico' || params.value === 'Muy Alto' ? '#FEE2E2' :
                             params.value === 'Alto' ? '#FEF3C7' :
                             params.value === 'Medio' ? '#DBEAFE' : '#F3F4F6',
              color: params.value === 'Critico' || params.value === 'Muy Alto' ? '#DC2626' :
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
      field: 'identificador_trd',
      headerName: 'TRD / Proceso',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#4B5563' }}>
          {params.row.identificador_trd || params.row.proceso || '-'}
        </Typography>
      ),
    },
    {
      field: 'es_clasificada_reservada',
      headerName: 'Ley 1712',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Reservado' : 'Público'}
          size="small"
          sx={{
            backgroundColor: params.value ? '#FEE2E2' : '#D1FAE5',
            color: params.value ? '#DC2626' : '#065F46',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
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
          
          <DialogContent sx={{ pt: 3, px: 4, pb: 4 }}>
            {/* ── Auditor Copilot AI Assistant Card ── */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                mb: 3, 
                borderRadius: '16px', 
                border: '1px solid #BFDBFE', 
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#2563EB', width: 40, height: 40, boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
                    <SparklesIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 1 }}>
                      Auditor Copilot (Función Pública V7 & ISO 27002:2022)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 500 }}>
                      Inferencia automática de TRD, criticidad CID, excepciones Ley 1712 y controles mitigantes
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={assessingAsset ? <CircularProgress size={18} color="inherit" /> : <SparklesIcon />}
                  disabled={assessingAsset || !formData.Nombre || formData.Nombre.trim().length < 3}
                  onClick={handleAssessWithCopilot}
                  sx={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '10px',
                    px: 2.5,
                    boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                    }
                  }}
                >
                  {assessingAsset ? 'Analizando activo con IA...' : 'Evaluar con Copilot'}
                </Button>
              </Box>

              {copilotAssessment && (
                <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #93C5FD' }}>
                  <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.85)', color: '#1E3A8A' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Dictamen Copilot:</strong> {copilotAssessment.analisis_copilot}
                    </Typography>
                  </Alert>

                  {/* Resumen de inferencias */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                          TRD SUGERIDA
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                          {copilotAssessment.trd_sugerida?.proceso || 'Misional'} ({copilotAssessment.trd_sugerida?.identificador_sugerido || 'TRD-AUTO'})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                          Serie: {copilotAssessment.trd_sugerida?.serie_documental || 'Gestión'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                          VALORACIÓN CID
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                          C({copilotAssessment.valoracion_cid?.confidencialidad}) I({copilotAssessment.valoracion_cid?.integridad}) D({copilotAssessment.valoracion_cid?.disponibilidad})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>
                          Criticidad: {copilotAssessment.valoracion_cid?.criticidad_general}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                          LEY 1712 DE 2014
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: copilotAssessment.analisis_ley_1712?.es_clasificada_reservada ? '#DC2626' : '#16A34A' }}>
                          {copilotAssessment.analisis_ley_1712?.es_clasificada_reservada ? `Reservada (${copilotAssessment.analisis_ley_1712?.excepcion_alcance || 'Total'})` : 'Información Pública'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {copilotAssessment.analisis_ley_1712?.fundamento_legal || 'Ley 1712 de 2014'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Action Chips de 1 Clic */}
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#1E3A8A', mb: 1 }}>
                    ⚡ ACCIONES RÁPIDAS DE 1-CLIC (AUDITOR COPILOT):
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {copilotAssessment.action_chips?.map((chip, idx) => (
                      <Chip
                        key={idx}
                        icon={<LightningIcon sx={{ fontSize: '1rem !important', color: '#FBBF24 !important' }} />}
                        label={chip.label}
                        onClick={() => handleApplyActionChip(chip)}
                        clickable
                        variant="filled"
                        size="medium"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          backgroundColor: '#1E40AF',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          boxShadow: '0 2px 6px rgba(30, 64, 175, 0.3)',
                          '&:hover': { backgroundColor: '#1D4ED8', transform: 'translateY(-1px)' },
                          transition: 'all 0.15s ease'
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* ── Tabs de Navegación Función Pública V7 ── */}
            <Tabs 
              value={tabValue} 
              onChange={(_, val) => setTabValue(val)} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                borderBottom: '1px solid #E2E8F0', 
                mb: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  minHeight: 48,
                }
              }}
            >
              <Tab icon={<FolderIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="1. Identificación y TRD" />
              <Tab icon={<TechIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="2. Naturaleza y Técnica" />
              <Tab icon={<ShieldIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="3. Valoración CID e ICCN" />
              <Tab icon={<LegalIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="4. Ley 1712 de 2014" />
            </Tabs>

            {/* ── PANEL 0: Identificación y TRD ── */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    label="Nombre del Activo *"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    required
                    placeholder="Ej: Historias Laborales de Servidores Públicos"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel id="macroproceso-label">Macroproceso</InputLabel>
                    <Select
                      labelId="macroproceso-label"
                      value={formData.macroproceso || 'Misional'}
                      onChange={(e) => setFormData({ ...formData, macroproceso: e.target.value })}
                      label="Macroproceso"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Estratégico">Estratégico</MenuItem>
                      <MenuItem value="Misional">Misional</MenuItem>
                      <MenuItem value="Apoyo">Apoyo</MenuItem>
                      <MenuItem value="Evaluación y Control">Evaluación y Control</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Descripción del Activo"
                    value={formData.Descripcion || ''}
                    onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                    placeholder="Propósito, contenido y alcance del activo de información..."
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Proceso"
                    value={formData.proceso || ''}
                    onChange={(e) => setFormData({ ...formData, proceso: e.target.value })}
                    placeholder="Ej: Gestión de Talento Humano / Gestión Documental"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Identificador TRD (Tabla de Retención Documental)"
                    value={formData.identificador_trd || ''}
                    onChange={(e) => setFormData({ ...formData, identificador_trd: e.target.value })}
                    placeholder="Ej: TRD-110-001"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Oficina Responsable"
                    value={formData.oficina_responsable || ''}
                    onChange={(e) => setFormData({ ...formData, oficina_responsable: e.target.value })}
                    placeholder="Ej: Dirección de Talento Humano"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Serie Documental"
                    value={formData.serie_documental || ''}
                    onChange={(e) => setFormData({ ...formData, serie_documental: e.target.value })}
                    placeholder="Ej: Historias Laborales"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Subserie Documental"
                    value={formData.subserie_documental || ''}
                    onChange={(e) => setFormData({ ...formData, subserie_documental: e.target.value })}
                    placeholder="Ej: Expedientes de Carrera Administrativa"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
              </Grid>
            )}

            {/* ── PANEL 1: Naturaleza y Características Técnicas ── */}
            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="tipo-activo-v7-label">Naturaleza / Tipo de Activo *</InputLabel>
                    <Select
                      labelId="tipo-activo-v7-label"
                      value={formData.Tipo_Activo}
                      onChange={(e) => setFormData({ ...formData, Tipo_Activo: e.target.value })}
                      label="Naturaleza / Tipo de Activo *"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Información y datos">Información y datos (Documental / Registros)</MenuItem>
                      <MenuItem value="Software">Software (Aplicaciones / Bases de Datos)</MenuItem>
                      <MenuItem value="Hardware">Hardware (Servidores / Dispositivos)</MenuItem>
                      <MenuItem value="Soporte de almacenamiento">Soporte de almacenamiento (Medios / Discos / Cintas)</MenuItem>
                      <MenuItem value="Servicios">Servicios (Cloud / Comunicaciones)</MenuItem>
                      <MenuItem value="Otros">Otros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Subtipo de Activo"
                    value={formData.subtipo_activo || ''}
                    onChange={(e) => setFormData({ ...formData, subtipo_activo: e.target.value })}
                    placeholder="Ej: Expediente médico, Base de datos, API REST"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel id="soporte-label">Soporte de Registro</InputLabel>
                    <Select
                      labelId="soporte-label"
                      value={formData.soporte_registro || 'Digital'}
                      onChange={(e) => setFormData({ ...formData, soporte_registro: e.target.value })}
                      label="Soporte de Registro"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Digital">Digital (Electrónico)</MenuItem>
                      <MenuItem value="Físico">Físico (Papel)</MenuItem>
                      <MenuItem value="Híbrido">Híbrido (Mixto)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Medio de Conservación"
                    value={formData.medio_conservacion || ''}
                    onChange={(e) => setFormData({ ...formData, medio_conservacion: e.target.value })}
                    placeholder="Ej: Servidor Institucional, Repositorio SGDEA, Archivo Rodante"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Formato"
                    value={formData.formato || ''}
                    onChange={(e) => setFormData({ ...formData, formato: e.target.value })}
                    placeholder="Ej: PDF/A, SQL, DOCX, XLSX, Físico A4"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Idioma"
                    value={formData.idioma || 'Español'}
                    onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Generación / Adquisición"
                    value={formData.fecha_generacion || formData.fecha_adquisicion || ''}
                    onChange={(e) => setFormData({ ...formData, fecha_generacion: e.target.value, fecha_adquisicion: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Ingreso al Archivo"
                    value={formData.fecha_ingreso_archivo || ''}
                    onChange={(e) => setFormData({ ...formData, fecha_ingreso_archivo: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel id="estado-label">Estado del Activo</InputLabel>
                    <Select
                      labelId="estado-label"
                      value={formData.estado_activo || 'En produccion'}
                      onChange={(e) => setFormData({ ...formData, estado_activo: e.target.value })}
                      label="Estado del Activo"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="En produccion">En producción</MenuItem>
                      <MenuItem value="Planificado">Planificado</MenuItem>
                      <MenuItem value="En desarrollo">En desarrollo</MenuItem>
                      <MenuItem value="Obsoleto">Obsoleto</MenuItem>
                      <MenuItem value="Retirado">Retirado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Frecuencia de Backup"
                    value={formData.frecuencia_backup_general || ''}
                    onChange={(e) => setFormData({ ...formData, frecuencia_backup_general: e.target.value })}
                    placeholder="Ej: Diario incremental, Semanal completo"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.requiere_backup ?? true}
                        onChange={(e) => setFormData({ ...formData, requiere_backup: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Requiere Copia de Seguridad"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            )}

            {/* ── PANEL 2: Valoración CID e Infraestructura (ICCN) ── */}
            {tabValue === 2 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="conf-label">Confidencialidad (C) *</InputLabel>
                    <Select
                      labelId="conf-label"
                      value={formData.Nivel_Clasificacion_Confidencialidad || 'Medio'}
                      onChange={(e) => setFormData({ ...formData, Nivel_Clasificacion_Confidencialidad: e.target.value })}
                      label="Confidencialidad (C) *"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Alto">Alto (Reservada / Secreto)</MenuItem>
                      <MenuItem value="Medio">Medio (Uso Interno / Restringido)</MenuItem>
                      <MenuItem value="Bajo">Bajo (Pública / Abierta)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="int-label">Integridad (I) *</InputLabel>
                    <Select
                      labelId="int-label"
                      value={formData.Nivel_Clasificacion_Integridad || 'Alto'}
                      onChange={(e) => setFormData({ ...formData, Nivel_Clasificacion_Integridad: e.target.value })}
                      label="Integridad (I) *"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Alto">Alto (Crítico para toma de decisiones)</MenuItem>
                      <MenuItem value="Medio">Medio (Tolerancia a corrección)</MenuItem>
                      <MenuItem value="Bajo">Bajo (Informativo general)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="disp-label">Disponibilidad (D) *</InputLabel>
                    <Select
                      labelId="disp-label"
                      value={formData.Nivel_Clasificacion_Disponibilidad || 'Medio'}
                      onChange={(e) => setFormData({ ...formData, Nivel_Clasificacion_Disponibilidad: e.target.value })}
                      label="Disponibilidad (D) *"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Alto">Alto (Servicio 24/7 o impacto inmediato)</MenuItem>
                      <MenuItem value="Medio">Medio (Horario laboral / RTO menor a 24h)</MenuItem>
                      <MenuItem value="Bajo">Bajo (Baja rotación / RTO flexible)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="criticidad-gen-label">Criticidad General del Negocio</InputLabel>
                    <Select
                      labelId="criticidad-gen-label"
                      value={formData.nivel_criticidad_negocio || 'Medio'}
                      onChange={(e) => setFormData({ ...formData, nivel_criticidad_negocio: e.target.value })}
                      label="Criticidad General del Negocio"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Crítico">Crítico (Impacto severo institucional)</MenuItem>
                      <MenuItem value="Alto">Alto (Impacto significativo)</MenuItem>
                      <MenuItem value="Medio">Medio (Impacto operativo moderado)</MenuItem>
                      <MenuItem value="Bajo">Bajo (Impacto mínimo)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="pub-label">Estado de Publicación</InputLabel>
                    <Select
                      labelId="pub-label"
                      value={formData.estado_publicacion || 'No Publicada'}
                      onChange={(e) => setFormData({ ...formData, estado_publicacion: e.target.value })}
                      label="Estado de Publicación"
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="No Publicada">No Publicada (Acceso Restringido / Reservado)</MenuItem>
                      <MenuItem value="Intranet">Intranet (Consulta de Funcionarios)</MenuItem>
                      <MenuItem value="Internet">Internet (Portal Web Abierto / Transparencia)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Justificación de la Calificación CID"
                    value={formData.justificacion_clasificacion_cia || ''}
                    onChange={(e) => setFormData({ ...formData, justificacion_clasificacion_cia: e.target.value })}
                    placeholder="Motivo por el cual se asignaron los niveles de confidencialidad, integridad y disponibilidad..."
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Ubicación de Consulta Física o Digital"
                    value={formData.ubicacion_consulta || ''}
                    onChange={(e) => setFormData({ ...formData, ubicacion_consulta: e.target.value })}
                    placeholder="URL del sistema, repositorio documental o sala de archivo"
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(formData.es_iccn)}
                          onChange={(e) => setFormData({ ...formData, es_iccn: e.target.checked })}
                          color="error"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: formData.es_iccn ? '#DC2626' : '#1E293B' }}>
                            ¿Es Infraestructura Crítica Cibernética Nacional (ICCN)?
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Conforme al Decreto 1078 y directrices del ColCERT / Función Pública
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* ── PANEL 3: Ley 1712 de 2014 (Información Clasificada y Reservada) ── */}
            {tabValue === 3 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Alert severity={formData.es_clasificada_reservada ? "warning" : "success"} sx={{ borderRadius: '12px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Régimen de Excepciones al Acceso a la Información Pública (Ley 1712 de 2014)
                    </Typography>
                    <Typography variant="caption">
                      Todo activo clasificado o reservado debe registrar el objeto legítimo constitucional de la excepción, el fundamento legal expreso y el alcance de la restricción.
                    </Typography>
                  </Alert>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(formData.es_clasificada_reservada)}
                          onChange={(e) => setFormData({ ...formData, es_clasificada_reservada: e.target.checked })}
                          color="warning"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            ¿Activo clasificado o reservado por Ley?
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            Active esta opción si el activo contiene datos personales sensibles (Art. 18) o información de seguridad/defensa (Art. 19).
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>

                {formData.es_clasificada_reservada && (
                  <>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        fullWidth
                        label="Objeto Legítimo de la Excepción *"
                        value={formData.objeto_legitimo_excepcion || ''}
                        onChange={(e) => setFormData({ ...formData, objeto_legitimo_excepcion: e.target.value })}
                        placeholder="Ej: Protección del derecho a la intimidad y datos personales sensibles (Art. 18 lit. a)"
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel id="alcance-label">Alcance de la Excepción</InputLabel>
                        <Select
                          labelId="alcance-label"
                          value={formData.excepcion_alcance || 'Total'}
                          onChange={(e) => setFormData({ ...formData, excepcion_alcance: e.target.value })}
                          label="Alcance de la Excepción"
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="Total">Total (Todo el documento / activo está reservado)</MenuItem>
                          <MenuItem value="Parcial">Parcial (Permite versión pública tachando datos sensibles)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Fundamento Legal Constitucional / Estatutario *"
                        value={formData.fundamento_legal || ''}
                        onChange={(e) => setFormData({ ...formData, fundamento_legal: e.target.value })}
                        placeholder="Ej: Ley 1712 de 2014 Arts. 18 y 19, Ley 1581 de 2012 Art. 5, Decreto 1081 de 2015"
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Procedimiento de Eliminación Segura / Disposición Final"
                        value={formData.procedimiento_eliminacion_segura_ref || ''}
                        onChange={(e) => setFormData({ ...formData, procedimiento_eliminacion_segura_ref: e.target.value })}
                        placeholder="Ej: Tabla de Retención Documental TRD-110, borrado seguro NIST SP 800-88"
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            )}
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

              {/* Atributos Guía Integral de Riesgos Función Pública V7 */}
              <Card sx={{ mb: 3, border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon sx={{ color: '#2563EB', fontSize: 22 }} />
                    Clasificación Función Pública V7 & Ley 1712 de 2014
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>MACROPROCESO / PROCESO</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>
                        {detalleActivo.activo?.macroproceso || 'Misional'} / {detalleActivo.activo?.proceso || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>TRD / OFICINA</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>
                        {detalleActivo.activo?.identificador_trd || 'N/A'} - {detalleActivo.activo?.oficina_responsable || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>SERIE / SUBSERIE</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>
                        {detalleActivo.activo?.serie_documental || 'N/A'} {detalleActivo.activo?.subserie_documental ? `(${detalleActivo.activo.subserie_documental})` : ''}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>SOPORTE / MEDIO CONSERVACIÓN</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>
                        {detalleActivo.activo?.soporte_registro || 'Digital'} ({detalleActivo.activo?.medio_conservacion || 'Servidor Institucional'})
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>VALORACIÓN CID</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        C({detalleActivo.activo?.Nivel_Clasificacion_Confidencialidad || 'Medio'}) I({detalleActivo.activo?.Nivel_Clasificacion_Integridad || 'Alto'}) D({detalleActivo.activo?.Nivel_Clasificacion_Disponibilidad || 'Medio'})
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>INFRAESTRUCTURA CRÍTICA (ICCN)</Typography>
                      <Chip 
                        label={detalleActivo.activo?.es_iccn ? "ICCN Crítica" : "No ICCN"} 
                        size="small" 
                        color={detalleActivo.activo?.es_iccn ? "error" : "default"} 
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: detalleActivo.activo?.es_clasificada_reservada ? '#FEF2F2' : '#F0FDF4', border: '1px solid', borderColor: detalleActivo.activo?.es_clasificada_reservada ? '#FECACA' : '#BBF7D0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: detalleActivo.activo?.es_clasificada_reservada ? '#991B1B' : '#166534', mb: 0.5 }}>
                          {detalleActivo.activo?.es_clasificada_reservada ? `Información Clasificada / Reservada (Ley 1712 de 2014 - Alcance ${detalleActivo.activo?.excepcion_alcance || 'Total'})` : "Información Pública (Sin Reserva Legal)"}
                        </Typography>
                        {detalleActivo.activo?.es_clasificada_reservada && (
                          <>
                            <Typography variant="body2" sx={{ color: '#7F1D1D', mb: 0.5 }}>
                              <strong>Objeto Legítimo:</strong> {detalleActivo.activo?.objeto_legitimo_excepcion || 'Protección de datos o seguridad'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#991B1B', display: 'block' }}>
                              <strong>Fundamento Legal:</strong> {detalleActivo.activo?.fundamento_legal || 'Ley 1712 de 2014 Arts. 18 y 19'}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
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
