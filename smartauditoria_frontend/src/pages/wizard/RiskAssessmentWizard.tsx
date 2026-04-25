import React, { useState, useEffect } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import ConversationalAuditor from '../../components/common/ConversationalAuditor';
import ISOSuggestions from '../../components/common/ISOSuggestions';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Stack,
  Avatar,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Paper,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  Task as TaskIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { activosService } from '../../services/activos';
import { evaluacionRiesgosService } from '../../services/evaluacionRiesgos';
import RiskMatrix from '../../components/common/RiskMatrix';
import InherentEvaluationStep from '../../components/wizard/InherentEvaluationStep';
import ActivoDetailCard from '../../components/activos/ActivoDetailCard';
import DocumentManager from '../../components/common/DocumentManager';
import type { DocumentoAdjunto, AccionPlan } from '../../services/documentos';
import { documentosService } from '../../services/documentos';
import InteractiveSuggestions from '../../components/predictive/InteractiveSuggestions';
import ControlSuggestions from '../../components/predictive/ControlSuggestions';
import JustificationSuggestions from '../../components/predictive/JustificationSuggestions';
import ResidualRiskSuggestions from '../../components/predictive/ResidualRiskSuggestions';
import ResidualJustificationSuggestions from '../../components/predictive/ResidualJustificationSuggestions';
import CurrencyInput from '../../components/common/CurrencyInput';
import DateRangeInput from '../../components/common/DateRangeInput';
import CriticityCalculator from '../../components/common/CriticityCalculator';
import ThreatVulnerabilityLink from '../../components/common/ThreatVulnerabilityLink';
import EditableActionPlan from '../../components/common/EditableActionPlan';
import TwinAssetSuggestion from '../../components/common/TwinAssetSuggestion';
import '../../styles/design-system.css';

interface WizardData {
  selectedActivo: any;
  newRiesgo: {
    amenaza: string;
    vulnerabilidad: string;
    descripcion: string;
    tipoRiesgo: string;
  };
  evaluacionInherente: {
    probabilidad: string;
    impacto: string;
    nivelRiesgo: string;
    justificacion: string;
    confidencialidad?: number;
    disponibilidad?: number;
    integridad?: number;
    criticidad?: string;
  };
  controles: {
    seleccionados: string[];
    eficacia: string;
    justificacion: string;
  };
  evaluacionResidual: {
    probabilidad: string;
    impacto: string;
    nivelRiesgo: string;
    justificacion: string;
  };
  tratamiento: {
    opcion: string;
    responsable: string;
    fechaInicio: string;
    fechaFin: string;
    presupuesto: string;
  };
  planAccion: {
    acciones: AccionPlan[];
  };
  isCreatingNew?: boolean;
}

const RiskAssessmentWizard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);


  // Implementacion de Exportacion PDF
  const exportarResumenPDF = async (evaluacion: any, activo: any, incluirAnexos: boolean) => {
    setIsExportando(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Resumen de Evaluacion de Riesgos", 20, 20);
      doc.setFontSize(12);
      doc.text(`Activo: ${activo.nombre || activo.nombre}`, 20, 30);
      doc.save(`Evaluacion_${activo.nombre || activo.nombre}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    } finally {
      setIsExportando(false);
    }
  };
  const [wizardData, setWizardData] = useState<WizardData>({
    selectedActivo: null,
    newRiesgo: { amenaza: '', vulnerabilidad: '', descripcion: '', tipoRiesgo: '' },
    evaluacionInherente: { probabilidad: '', impacto: '', nivelRiesgo: '', justificacion: '' },
    controles: { seleccionados: [], eficacia: '', justificacion: '' },
    evaluacionResidual: { probabilidad: '', impacto: '', nivelRiesgo: '', justificacion: '' },
    tratamiento: { opcion: '', responsable: '', fechaInicio: '', fechaFin: '', presupuesto: '' },
    planAccion: { acciones: [] },
    isCreatingNew: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openRiesgoDialog, setOpenRiesgoDialog] = useState(false);
  const [selectedActivoDetail, setSelectedActivoDetail] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    estado: 'Planificado',
    criticidad: 'Medio',
  });
  
  const mapFormDataToCreateActivoData = (data: typeof formData) => {
    return {
      Nombre: data.nombre,
      Descripcion: data.descripcion || undefined,
      Tipo_Activo: data.tipo,
      estado_activo: data.estado,
      nivel_criticidad_negocio: data.criticidad,
    };
  };
  const [riesgoFormData, setRiesgoFormData] = useState({
    nombre: '',
    amenaza: '',
    vulnerabilidad: '',
    descripcion: '',
    tipoRiesgo: '',
  });
  const [tiposRiesgo, setTiposRiesgo] = useState<string[]>([]);
  const [amenazasDisponibles, setAmenazasDisponibles] = useState<string[]>([]);
  const [vulnerabilidadesDisponibles, setVulnerabilidadesDisponibles] = useState<any[]>([]);
  const [riesgosExistentes, setRiesgosExistentes] = useState<any[]>([]);
  const [isCreatingRiesgo, setIsCreatingRiesgo] = useState(false);

  const [actionPlanItems, setActionPlanItems] = useState<any[]>([]);
  const [criticityData, setCriticityData] = useState({
    confidencialidad: 3,
    disponibilidad: 3,
    integridad: 3,
    promedio: 3,
    clasificacion: 'Media'
  });
  const [openAccionDialog, setOpenAccionDialog] = useState(false);
  const [newAccion, setNewAccion] = useState<AccionPlan>({
    id: '',
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    responsable: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'pendiente',
    comentarios: '',
    documentos: []
  });
  const [isEvaluacionCompletada, setIsEvaluacionCompletada] = useState(false);
  const [isExportando, setIsExportando] = useState(false);
  const [openNotificacionDialog, setOpenNotificacionDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showExportMessage, setShowExportMessage] = useState(false);
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [incluirAnexos, setIncluirAnexos] = useState(true);
  const [evaluacionesCompletadas, setEvaluacionesCompletadas] = useState<{[key: string]: any}>({});
  const [exportMessage, setExportMessage] = useState('');  const { user } = useAuth();
  const isReadOnly = user?.rol_nombre === 'CONSULTOR';
  
  const [aiMessage, setAiMessage] = useState('Bienvenido. Por favor, seleccione un activo del inventario para iniciar la Evaluación de riesgos.');
  const [aiSentiment, setAiSentiment] = useState<'neutral' | 'success' | 'warning' | 'critical'>('neutral');
  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    setIsAiTyping(true);
    const timer = setTimeout(() => {
      let msg = '';
      let sent: 'neutral' | 'success' | 'warning' | 'critical' = 'neutral';
      const activo = wizardData.selectedActivo;
      const nombreActivo = activo?.Nombre || activo?.nombre || activo?.nombre_Activo || 'Activo';

      if (isReadOnly) {
        msg = "Bienvenido, Consultor. El sistema se encuentra en Modo Observacin. Puede auditar la Evaluación tcnica de este activo; la edicin requiere privilegios de Operador.";
        sent = 'neutral';
      } else {
        const amenaza = wizardData.newRiesgo.amenaza;
        const vuln = wizardData.newRiesgo.vulnerabilidad;
        const tipoActivo = activo?.Tipo_Activo || activo?.tipo || activo?.Tipo || 'Activo';

        switch (activeStep) {
          case 0:
            msg = activo 
              ? `He identificado el activo: ${nombreActivo} (${tipoActivo}). Mi motor RAG sugiere iniciar la superficie de riesgo forense.`
              : "Bienvenido a la Evaluación de activos. Seleccione un objetivo del inventario para iniciar el anlisis de riesgos y vulnerabilidades.";
            sent = 'neutral';
            break;
          case 1:
            msg = amenaza && vuln
              ? `Atencin: se ha identificado el vector [${amenaza} + ${vuln}]. Se recomienda evaluar el posible impacto en la confidencialidad, integridad y disponibilidad del activo.`
              : "Por favor, identifique y seleccione el vector de amenaza aplicable. El motor sugiere revisar las vulnerabilidades tpicas para esta clase de activo.";
            sent = 'warning';
            break;
          case 2:
            msg = `Evaluando impacto inherente para ${nombreActivo}. Basado en mi base de conocimientos ISO, un fallo aqu comprometera la ${tipoActivo === 'Datos' ? 'Confidencialidad' : 'Continuidad'} del negocio.`;
            sent = 'critical';
            break;
          case 3:
            msg = "Sincronizando controles del Anexo A de ISO 27001. Seleccione los escudos tcticos para mitigar el riesgo residual.";
            sent = 'success';
            break;
          default:
            msg = "Peritaje avanzado en curso. La integridad de la Información es mi prioridad absoluta.";
            sent = 'success';
        }
      }

      setAiMessage(msg);
      setAiSentiment(sent);
      setIsAiTyping(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeStep, isReadOnly, wizardData.selectedActivo]);

  useEffect(() => {
    const cargarTiposRiesgo = async () => {
      try {
        const { apiRequest } = await import('../../services/api');
        const tipos = await apiRequest<string[]>('/riesgos/tipos');
        setTiposRiesgo(tipos || []);
      } catch (error) {
        console.error('Error cargando tipos de riesgo:', error);
        setTiposRiesgo(['Operacional', 'Tecnológico', 'Legal', 'Estratgico', 'Financiero', 'Reputacional']);
      }
    };
    
    cargarTiposRiesgo();
  }, []);

  useEffect(() => {
    const cargarAmenazas = async () => {
      try {
        const { apiRequest } = await import('../../services/api');
        const amenazas = await apiRequest<Array<{nombre: string}>>('/amenazas/');
        const nombresAmenazas = amenazas.map((a: any) => a.nombre || a);
        setAmenazasDisponibles(nombresAmenazas);
      } catch (error) {
        console.error('Error cargando amenazas:', error);
        setAmenazasDisponibles([]);
      }
    };
    
    cargarAmenazas();
  }, []);

  useEffect(() => {
    const cargarVulnerabilidades = async () => {
      try {
        const { apiRequest } = await import('../../services/api');
        const vulnerabilidades = await apiRequest<any[]>('/vulnerabilidades/?limit=1000');
        setVulnerabilidadesDisponibles(vulnerabilidades || []);
      } catch (error) {
        console.error('Error cargando vulnerabilidades:', error);
        setVulnerabilidadesDisponibles([]);
      }
    };
    
    cargarVulnerabilidades();
  }, []);

  useEffect(() => {
    const cargarRiesgosExistentes = async () => {
      try {
        const { apiRequest } = await import('../../services/api');
        const riesgos = await apiRequest<any[]>('/riesgos/');
        setRiesgosExistentes(riesgos || []);
      } catch (error) {
        console.error('Error cargando riesgos existentes:', error);
        setRiesgosExistentes([]);
      }
    };
    
    cargarRiesgosExistentes();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const cargarEvaluacionesCompletadas = async () => {
      try {
        const { evaluacionRiesgosService } = await import('../../services/evaluacionRiesgos');
        const evaluaciones = await evaluacionRiesgosService.getEvaluacionesCompletadas();
        
        if (isMounted) {
          setEvaluacionesCompletadas(evaluaciones);
        }
      } catch (error) {
        console.error('Error cargando evaluaciones completadas:', error);
        if (isMounted) {
          setEvaluacionesCompletadas({});
        }
      }
    };
    
    cargarEvaluacionesCompletadas();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const guardarEvaluacionParcial = async (activoId: number, progreso: number) => {
    try {
      const datosParciales = {
        activo_id: activoId,
        wizard_data: wizardData,
        progreso: progreso,
        fecha_guardado: new Date().toISOString()
      };
      
      localStorage.setItem(`evaluacion_parcial_${activoId}`, JSON.stringify(datosParciales));
      
      try {
        const { evaluacionRiesgosService } = await import('../../services/evaluacionRiesgos');
        await evaluacionRiesgosService.guardarEvaluacionParcial(activoId, wizardData, progreso);
      } catch (backendError) {
        console.warn('No se pudo guardar en backend, usando localStorage:', backendError);
      }
    } catch (error) {
      console.error('Error guardando Evaluación parcial:', error);
    }
  };

  const cargarEvaluacionParcial = async (activoId: number) => {
    try {
      const evaluacionParcialGuardada = localStorage.getItem(`evaluacion_parcial_${activoId}`);
      if (evaluacionParcialGuardada) {
        const datosParciales = JSON.parse(evaluacionParcialGuardada);
        setWizardData(datosParciales.wizard_data);
        const pasoActual = Math.floor(datosParciales.progreso / 20);
        setActiveStep(pasoActual);
        return;
      }
      
      const { evaluacionRiesgosService } = await import('../../services/evaluacionRiesgos');
      const evaluacionParcial = await evaluacionRiesgosService.obtenerEvaluacionParcial(activoId);
      
      if (evaluacionParcial.existe) {
        setWizardData(evaluacionParcial.wizard_data);
        const pasoActual = Math.floor(evaluacionParcial.progreso / 20);
        setActiveStep(pasoActual);
      }
    } catch (error) {
      console.error('Error cargando Evaluación parcial:', error);
    }
  };

  const { data: activos = [] } = useQuery({
    queryKey: ['activos'],
    queryFn: async () => {
      try {
        const { activosService } = await import('../../services/backend');
        return await activosService.getAll();
      } catch (error) {
        console.error('Error fetching activos:', error);
        return [];
      }
    }
  });

  const { data: controlesBD = [] } = useQuery({
    queryKey: ['controles'],
    queryFn: async () => {
      try {
        return await evaluacionRiesgosService.getControles();
      } catch (error) {
        console.error('Error fetching controles:', error);
        return [];
      }
    }
  });

  const [nuevoControlManual, setNuevoControlManual] = useState('');
  const [mostrarInputManual, setMostrarInputManual] = useState(false);

  const steps = [
    'Selección de Activo',
    'Identificación de Riesgo',
    'Evaluación Inherente',
    'Controles Existentes',
    'Evaluación Residual',
    'Opciones de Tratamiento',
    'Plan de Acción',
    'Resultados Finales'
  ];

  const filteredActivos = activos.filter(activo => {
    if (!activo || !searchTerm) return true;
    const nombre = (activo as any).nombre || (activo as any).nombre || (activo as any).nombre_Activo || '';
    return nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleNext = () => {
    if (activeStep === 1) {
      if (!wizardData.newRiesgo.amenaza || !wizardData.newRiesgo.vulnerabilidad) {
        toast.error('Por favor, completa la amenaza y vulnerabilidad antes de continuar');
        return;
      }
      if (!wizardData.newRiesgo.tipoRiesgo) {
        toast.error('El tipo de riesgo es obligatorio. Por favor, selecciona un tipo de riesgo.');
        return;
      }
    }
    
    if (activeStep === 3) {
      if (!wizardData.controles.seleccionados || wizardData.controles.seleccionados.length === 0) {
        toast.error(' Es obligatorio seleccionar al menos un control.');
        return;
      }
      if (!wizardData.controles.eficacia) {
        toast.error('Por favor, selecciona el nivel de eficacia de los controles.');
        return;
      }
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleActivoSelect = (activo: any) => {
    const evaluacionEstado = getEvaluacionEstado(activo);
    
    if (evaluacionEstado.estado === 'completa' && evaluacionEstado.evaluacion) {
      setSelectedActivoDetail(activo);
      setOpenSummaryDialog(true);
      return;
    }
    
    if (evaluacionEstado.estado === 'parcial' && evaluacionEstado.puedeContinuar) {
      const continuar = window.confirm(
        `Este activo tiene una Evaluación parcial (${evaluacionEstado.porcentaje}% completado). Desea continuar desde donde se qued?`
      );
      
      if (continuar) {
        cargarEvaluacionParcial((activo as any).id || (activo as any).id);
        return;
      }
    }
    
    setWizardData({ ...wizardData, selectedActivo: activo });
    setSelectedActivoDetail(activo);
    setOpenDetailDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: '',
      estado: 'Planificado',
      criticidad: 'Medio',
    });
  };

  const handleCreateActivo = async () => {
    try {
      if (!formData.nombre || !formData.nombre.trim()) {
        toast.error(' El nombre del activo es obligatorio');
        return;
      }
      if (!formData.tipo) {
        toast.error(' El tipo de activo es obligatorio');
        return;
      }
      
      const activoData = mapFormDataToCreateActivoData(formData);
      const nuevoActivo = await activosService.createActivo(activoData);
      
      toast.success(' Activo creado exitosamente');
      handleCloseDialog();
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: '',
        estado: 'Planificado',
        criticidad: 'Medio',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Error al crear activo:', error);
      toast.error(` Error al crear activo`);
    }
  };

  const handleCloseRiesgoDialog = () => {
    setOpenRiesgoDialog(false);
    setRiesgoFormData({
      nombre: '',
      amenaza: '',
      vulnerabilidad: '',
      descripcion: '',
      tipoRiesgo: '',
    });
  };

  const handleCreateRiesgo = async () => {
    setIsCreatingRiesgo(true);
    try {
      const { apiRequest } = await import('../../services/api');
      
      let amenazaNombre = riesgoFormData.amenaza;
      if (amenazaNombre && !amenazasDisponibles.includes(amenazaNombre)) {
        try {
          (await apiRequest('/amenazas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: amenazaNombre,
              descripcion: `Amenaza: ${amenazaNombre}`,
              tipo_riesgo: riesgoFormData.tipoRiesgo || 'Tecnológico'
            })
          })) as any;
          setAmenazasDisponibles(prev => [...prev, amenazaNombre]);
        } catch (error) {
          console.warn('Error creando amenaza:', error);
        }
      }
      
      let vulnerabilidadNombre = riesgoFormData.vulnerabilidad;
      if (vulnerabilidadNombre && !vulnerabilidadesDisponibles.find(v => v.nombre === vulnerabilidadNombre)) {
        try {
          (await apiRequest('/vulnerabilidades/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: vulnerabilidadNombre,
              descripcion: `Vulnerabilidad: ${vulnerabilidadNombre}`,
              categoria: 'Tecnolgica',
              severidad: 'Media'
            })
          })) as any;
          setVulnerabilidadesDisponibles(prev => [...prev, { nombre: vulnerabilidadNombre }]);
        } catch (error) {
          console.warn('Error creando vulnerabilidad:', error);
        }
      }
      
      const nombreRiesgo = riesgoFormData.nombre || `${amenazaNombre} - ${vulnerabilidadNombre}`;
      
      const nuevoRiesgo = (await apiRequest('/riesgos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Nombre: nombreRiesgo,
          Descripcion: riesgoFormData.descripcion || `Riesgo asociado a la amenaza "${amenazaNombre}" y la vulnerabilidad "${vulnerabilidadNombre}"`,
          tipo_riesgo: riesgoFormData.tipoRiesgo || 'Tecnológico',
          Estado_Riesgo_General: 'Identificado'
        })
      })) as any;
      
      setWizardData({
        ...wizardData,
        newRiesgo: {
          amenaza: amenazaNombre,
          vulnerabilidad: vulnerabilidadNombre,
          descripcion: riesgoFormData.descripcion || nombreRiesgo,
          tipoRiesgo: riesgoFormData.tipoRiesgo || 'Tecnológico'
        }
      });
      
      setRiesgosExistentes(prev => [...prev, nuevoRiesgo]);
      toast.success(`Riesgo "${nombreRiesgo}" creado exitosamente`);
      
      setRiesgoFormData({
        nombre: '',
        amenaza: '',
        vulnerabilidad: '',
        descripcion: '',
        tipoRiesgo: '',
      });
      
      handleCloseRiesgoDialog();
    } catch (error: any) {
      console.error('Error creando riesgo:', error);
      toast.error(error?.message || 'Error al crear el riesgo');
    } finally {
      setIsCreatingRiesgo(false);
    }
  };

  const calculateRiskLevel = (probabilidad: string, impacto: string) => {
    const matrix: { [key: string]: { [key: string]: string } } = {
      'Frecuente': { 
        'Insignificante': 'MEDIUM', 'Menor': 'MEDIUM', 'Moderado': 'HIGH', 
        'Mayor': 'HIGH', 'Catastrfico': 'HIGH' 
      },
      'Probable': { 
        'Insignificante': 'LOW', 'Menor': 'MEDIUM', 'Moderado': 'MEDIUM', 
        'Mayor': 'HIGH', 'Catastrfico': 'HIGH' 
      },
      'Ocasional': { 
        'Insignificante': 'LOW', 'Menor': 'MEDIUM', 'Moderado': 'MEDIUM', 
        'Mayor': 'HIGH', 'Catastrfico': 'HIGH' 
      },
      'Posible': { 
        'Insignificante': 'LOW', 'Menor': 'LOW', 'Moderado': 'MEDIUM', 
        'Mayor': 'HIGH', 'Catastrfico': 'HIGH' 
      },
      'Improbable': { 
        'Insignificante': 'LOW', 'Menor': 'LOW', 'Moderado': 'LOW', 
        'Mayor': 'LOW', 'Catastrfico': 'MEDIUM' 
      }
    };
    return matrix[probabilidad]?.[impacto] || 'LOW';
  };

  const getRiskColor = (nivel: string) => {
    const colors: { [key: string]: string } = {
      'LOW': '#10B981',
      'MEDIUM': '#F59E0B',
      'HIGH': '#EF4444'
    };
    return colors[nivel] || '#6B7280';
  };

  const addAccion = () => {
    const accion = {
      ...newAccion,
      id: Date.now().toString()
    };
    setWizardData({
      ...wizardData,
      planAccion: {
        acciones: [...wizardData.planAccion.acciones, accion]
      }
    });
    setNewAccion({
      id: '',
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      responsable: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'pendiente',
      comentarios: '',
      documentos: []
    });
    setOpenAccionDialog(false);
  };

  const deleteAccion = (id: string) => {
    setWizardData({
      ...wizardData,
      planAccion: {
        acciones: wizardData.planAccion.acciones.filter(accion => accion.id !== id)
      }
    });
  };

  const exportToPDF = async () => {
    setIsExportando(true);
    try {
      const element = document.getElementById('wizard-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('evaluacion-riesgo.pdf');
      setExportMessage('Evaluación exportada a PDF exitosamente');
      setShowExportMessage(true);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      setExportMessage('Error al exportar PDF');
      setShowExportMessage(true);
    } finally {
      setIsExportando(false);
    }
  };

  const exportToExcel = () => {
    setIsExportando(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      const resumenData = [
        ['Evaluación de Riesgo de Activos de Información'],
        [''],
        ['Activo Seleccionado:', (wizardData.selectedActivo as any)?.nombre || (wizardData.selectedActivo as any)?.nombre || 'No seleccionado'],
        ['Tipo de Activo:', (wizardData.selectedActivo as any)?.Tipo_Activo || (wizardData.selectedActivo as any)?.tipo || 'No especificado'],
        [''],
        ['Riesgo Identificado:', wizardData.newRiesgo.descripcion || 'No especificado'],
        ['Amenaza:', wizardData.newRiesgo.amenaza || 'No especificada'],
        ['Vulnerabilidad:', wizardData.newRiesgo.vulnerabilidad || 'No especificada'],
        [''],
        ['Evaluación Inherente:'],
        ['Probabilidad:', wizardData.evaluacionInherente.probabilidad],
        ['Impacto:', wizardData.evaluacionInherente.impacto],
        ['Nivel de Riesgo:', wizardData.evaluacionInherente.nivelRiesgo],
        ['Justificacin:', wizardData.evaluacionInherente.justificacion],
        [''],
        ['Evaluación Residual:'],
        ['Probabilidad:', wizardData.evaluacionResidual.probabilidad],
        ['Impacto:', wizardData.evaluacionResidual.impacto],
        ['Nivel de Riesgo:', wizardData.evaluacionResidual.nivelRiesgo],
        ['Justificacin:', wizardData.evaluacionResidual.justificacion],
        [''],
        ['Opciones de Tratamiento:'],
        ['Opcin:', wizardData.tratamiento.opcion],
        ['Responsable:', wizardData.tratamiento.responsable],
        ['Fecha Inicio:', wizardData.tratamiento.fechaInicio],
        ['Fecha Fin:', wizardData.tratamiento.fechaFin],
        ['Presupuesto:', wizardData.tratamiento.presupuesto],
      ];

      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

      if (wizardData.controles.seleccionados.length > 0) {
        const controlesData = [
          ['Controles Seleccionados', 'Eficacia', 'Justificacin'],
          ...wizardData.controles.seleccionados.map(control => [
            control,
            wizardData.controles.eficacia,
            wizardData.controles.justificacion
          ])
        ];
        const controlesSheet = XLSX.utils.aoa_to_sheet(controlesData);
        XLSX.utils.book_append_sheet(workbook, controlesSheet, 'Controles');
      }

      if (wizardData.planAccion.acciones.length > 0) {
        const accionesData = [
          ['Descripción', 'Responsable', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Comentarios'],
          ...wizardData.planAccion.acciones.map(accion => [
            accion.descripcion,
            accion.responsable,
            accion.fechaInicio,
            accion.fechaFin,
            accion.estado,
            accion.comentarios
          ])
        ];
        const accionesSheet = XLSX.utils.aoa_to_sheet(accionesData);
        XLSX.utils.book_append_sheet(workbook, accionesSheet, 'Plan de Acción');
      }

      XLSX.writeFile(workbook, 'evaluacion-riesgo.xlsx');
      setExportMessage('Evaluación exportada a Excel exitosamente');
      setShowExportMessage(true);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      setExportMessage('Error al exportar Excel');
      setShowExportMessage(true);
    } finally {
      setIsExportando(false);
    }
  };

  const guardarEvaluacion = async () => {
    setIsExportando(true);
    try {
      const activoId = (wizardData.selectedActivo as any)?.id || (wizardData.selectedActivo as any)?.ID_Activo || (wizardData.selectedActivo as any)?.ID;
      if (!activoId) {
        toast.error("Error: No se ha detectado el ID del activo. Por favor, selecciónalo de nuevo.");
        throw new Error('No hay activo seleccionado');
      }

      let riesgoId = null;
      
      if (wizardData.newRiesgo.amenaza && wizardData.newRiesgo.vulnerabilidad) {
        try {
          const api = (await import('../../services/api')).default;
          const nombreRiesgo = wizardData.newRiesgo.descripcion 
            ? wizardData.newRiesgo.descripcion 
            : `${wizardData.newRiesgo.amenaza} - ${wizardData.newRiesgo.vulnerabilidad}`;
          const descripcionRiesgo = wizardData.newRiesgo.descripcion 
            ? wizardData.newRiesgo.descripcion 
            : `Riesgo asociado a la amenaza "${wizardData.newRiesgo.amenaza}" y la vulnerabilidad "${wizardData.newRiesgo.vulnerabilidad}"`;
          
          try {
            const response = await api.post('/riesgos/', {
              Nombre: nombreRiesgo,
              Descripcion: descripcionRiesgo,
              tipo_riesgo: wizardData.newRiesgo.tipoRiesgo || null,
              Estado_Riesgo_General: 'Identificado',
            });
            riesgoId = response.data.ID_Riesgo || response.data.id;
          } catch (createError: any) {
            if (createError?.response?.status === 409) {
              const errorData = createError?.response?.data || {};
              if (errorData.existing_id) {
                riesgoId = errorData.existing_id;
              } else {
                try {
                  const response = await api.get('/riesgos/');
                  const riesgos = response.data || [];
                  const riesgoExistente = riesgos.find((r: any) => 
                    (r.nombre || r.nombre || '').trim() === nombreRiesgo.trim()
                  );
                  if (riesgoExistente) {
                    riesgoId = riesgoExistente.ID_Riesgo || riesgoExistente.id;
                  } else {
                    throw new Error(`No se pudo encontrar el riesgo existente con nombre "${nombreRiesgo}"`);
                  }
                } catch (searchError) {
                  console.error('Error buscando riesgo existente:', searchError);
                  throw new Error(`Ya existe un riesgo con el nombre "${nombreRiesgo}", pero no se pudo obtener su ID.`);
                }
              }
            } else {
              console.error('Error creando riesgo:', createError);
              throw new Error('No se pudo crear el riesgo');
            }
          }
        } catch (error: any) {
          console.error('Error procesando riesgo:', error);
          throw new Error(error?.message || 'No se pudo crear o encontrar el riesgo');
        }
      }

      if (!riesgoId) {
        throw new Error('No hay riesgo seleccionado o creado');
      }

      const { evaluacionRiesgosService } = await import('../../services/evaluacionRiesgos');
      const nivelesProb = await evaluacionRiesgosService.getNivelesProbabilidad();
      const nivelesImp = await evaluacionRiesgosService.getNivelesImpacto();
      
      const probabilidadMapping: { [key: string]: string[] } = {
        'Frecuente': ['Muy Alta', 'Alta'],
        'Probable': ['Alta', 'Media'],
        'Ocasional': ['Media'],
        'Posible': ['Baja', 'Media'],
        'Improbable': ['Muy Baja', 'Baja']
      };
      
      const impactoMapping: { [key: string]: string[] } = {
        'Insignificante': ['Muy Bajo', 'Bajo'],
        'Menor': ['Bajo', 'Medio'],
        'Moderado': ['Medio'],
        'Mayor': ['Alto', 'Muy Alto'],
        'Catastrfico': ['Muy Alto', 'Alto']
      };
      
      const normalizeName = (name: string) => {
        return name?.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
      };
      
      const probWizardValue = wizardData.evaluacionInherente.probabilidad;
      const probDbNames = probabilidadMapping[probWizardValue] || [probWizardValue];
      const probInherente = nivelesProb.find(p => 
        probDbNames.some(dbName => normalizeName(p.nombre) === normalizeName(dbName))
      );
      
      const impWizardValue = wizardData.evaluacionInherente.impacto;
      const impDbNames = impactoMapping[impWizardValue] || [impWizardValue];
      const impInherente = nivelesImp.find(i => 
        impDbNames.some(dbName => normalizeName(i.nombre) === normalizeName(dbName))
      );

      if (!probInherente || !impInherente) {
        throw new Error(`Niveles de probabilidad o impacto no vlidos.`);
      }

      const evaluacionData: any = {
        id_riesgo: riesgoId,
        id_activo: activoId,
        probabilidad_inherente: probInherente.id,
        impacto_inherente: impInherente.id,
        justificacion_inherente: wizardData.evaluacionInherente.justificacion || '',
      };

      if (wizardData.evaluacionResidual.probabilidad && wizardData.evaluacionResidual.impacto) {
        const probResidualWizardValue = wizardData.evaluacionResidual.probabilidad;
        const probResidualDbNames = probabilidadMapping[probResidualWizardValue] || [probResidualWizardValue];
        const probResidual = nivelesProb.find(p => 
          probResidualDbNames.some(dbName => normalizeName(p.nombre) === normalizeName(dbName))
        );
        const impResidualWizardValue = wizardData.evaluacionResidual.impacto;
        const impResidualDbNames = impactoMapping[impResidualWizardValue] || [impResidualWizardValue];
        const impResidual = nivelesImp.find(i => 
          impResidualDbNames.some(dbName => normalizeName(i.nombre) === normalizeName(dbName))
        );

        if (probResidual && impResidual) {
          evaluacionData.probabilidad_residual = probResidual.id;
          evaluacionData.impacto_residual = impResidual.id;
          evaluacionData.justificacion_residual = wizardData.evaluacionResidual.justificacion || '';
        }
      }

      const evaluacionResult = await evaluacionRiesgosService.crearEvaluacion(evaluacionData);
      const idEvaluacion = evaluacionResult.id;

      if (wizardData.controles.seleccionados && wizardData.controles.seleccionados.length > 0) {
        try {
          const { apiRequest } = await import('../../services/api');
          (await apiRequest('/controles-evaluacion/guardar-controles-evaluacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_evaluacion_riesgo_activo: idEvaluacion,
              controles: wizardData.controles.seleccionados.map((ctrl: any) => ({
                ID_Control: ctrl.ID_Control || ctrl.id,
                justificacion: ctrl.justificacion || wizardData.controles.justificacion || '',
                eficacia: ctrl.eficacia || wizardData.controles.eficacia || 'Media',
              })),
            }),
          })) as any;
        } catch (ctrlError) {
          console.warn('Error guardando controles:', ctrlError);
        }
      }

      if (wizardData.tratamiento.opcion) {
        try {
          const { apiRequest } = await import('../../services/api');
          (await apiRequest('/evaluacion-riesgos/guardar-tratamiento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_evaluacion: idEvaluacion,
              tratamiento: wizardData.tratamiento
            })
          })) as any;
        } catch (tratamientoError) {
          console.warn('Error guardando tratamiento:', tratamientoError);
        }
      }

      if (wizardData.planAccion.acciones && wizardData.planAccion.acciones.length > 0) {
        try {
          const { apiRequest } = await import('../../services/api');
          const { documentosService } = await import('../../services/documentos');
          
          const accionesProcesadas = await Promise.all(
            wizardData.planAccion.acciones.map(async (accion: any) => {
              const documentosSubidos: any[] = [];
              
              if (accion.documentos && accion.documentos.length > 0) {
                for (const doc of accion.documentos) {
                  if (doc instanceof File) {
                    try {
                      const accionIdTemp = `eval_${idEvaluacion}_activo_${activoId}_${accion.id || Date.now()}`;
                      const documentoSubido = await documentosService.subirDocumento(
                        doc,
                        accionIdTemp,
                        accion.descripcion || ''
                      );
                      documentosSubidos.push({
                        id: documentoSubido.id,
                        nombre: documentoSubido.nombre,
                        url: documentoSubido.url,
                        tipo: documentoSubido.tipo,
                        tamano: documentoSubido.tamano
                      });
                    } catch (uploadError) {
                      console.error('Error subiendo documento:', uploadError);
                    }
                  } else if (doc.id || doc.url) {
                    documentosSubidos.push(doc);
                  }
                }
              }
              
              return {
                id: accion.id,
                titulo: accion.titulo || accion.descripcion,
                descripcion: accion.descripcion,
                responsable: accion.responsable || wizardData.tratamiento.responsable,
                fechaInicio: accion.fechaInicio || wizardData.tratamiento.fechaInicio,
                fechaFin: accion.fechaFin || wizardData.tratamiento.fechaFin,
                estado: accion.estado || 'pendiente',
                comentarios: accion.comentarios || '',
                documentos: documentosSubidos
              };
            })
          );
          
          (await apiRequest('/evaluacion-riesgos/guardar-plan-accion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_evaluacion: idEvaluacion,
              id_activo: activoId,
              tratamiento: wizardData.tratamiento,
              acciones: accionesProcesadas
            })
          })) as any;
        } catch (planError) {
          console.warn('Error guardando plan de Acción:', planError);
        }
      }

      setEvaluacionesCompletadas(prev => ({
        ...prev,
        [activoId]: {
          activo: wizardData.selectedActivo,
          evaluacion: wizardData,
          fechaCompletada: new Date().toISOString(),
          completada: true,
          idEvaluacion: idEvaluacion,
        }
      }));

      localStorage.removeItem(`evaluacion_parcial_${activoId}`);

      setIsEvaluacionCompletada(true);
      setShowSuccessMessage(true);
      setExportMessage('Evaluación guardada exitosamente en la base de datos');
      setShowExportMessage(true);
      
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      queryClient.invalidateQueries({ queryKey: ['evaluaciones'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setExportMessage(`Error al guardar la Evaluación: ${error.message || 'Error desconocido'}`);
      setShowExportMessage(true);
      toast.error(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsExportando(false);
    }
  };

  const finalizarEvaluacion = () => {
    if (isEvaluacionCompletada) {
      setShowSuccessMessage(true);
      setExportMessage('Evaluación completada exitosamente!');
      setShowExportMessage(true);
    } else {
      guardarEvaluacion();
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors: { [key: string]: string } = {
      'Pendiente': '#F59E0B',
      'En Progreso': '#3B82F6',
      'Completado': '#10B981',
      'Cancelado': '#EF4444'
    };
    return colors[estado] || '#6B7280';
  };

  const getEvaluacionEstado = (activo: any) => {
    const activoId = activo.id || activo.ID_Activo;
    const evaluacionGuardada = evaluacionesCompletadas[activoId];
    
    if (evaluacionGuardada) {
      const primeraEvaluacion = evaluacionGuardada.evaluaciones && evaluacionGuardada.evaluaciones.length > 0 
        ? evaluacionGuardada.evaluaciones[0] 
        : null;
      
      return { 
        estado: 'completa', 
        porcentaje: 100, 
        color: '#10B981',
        evaluacion: primeraEvaluacion
      };
    }
    
    if (wizardData.selectedActivo?.id === activoId) {
      let porcentajeParcial = 0;
      
      if (wizardData.newRiesgo.amenaza && wizardData.newRiesgo.vulnerabilidad && wizardData.newRiesgo.tipoRiesgo && wizardData.newRiesgo.descripcion) {
        porcentajeParcial += 20;
      } else if (wizardData.newRiesgo.amenaza && wizardData.newRiesgo.vulnerabilidad && wizardData.newRiesgo.tipoRiesgo) {
        porcentajeParcial += 18;
      } else if (wizardData.newRiesgo.amenaza && wizardData.newRiesgo.vulnerabilidad) {
        porcentajeParcial += 15;
      }
      if (wizardData.evaluacionInherente.probabilidad && wizardData.evaluacionInherente.impacto) {
        porcentajeParcial += 20;
      }
      if (wizardData.controles.seleccionados.length > 0) {
        porcentajeParcial += 20;
      }
      if (wizardData.evaluacionResidual.probabilidad && wizardData.evaluacionResidual.impacto) {
        porcentajeParcial += 20;
      }
      if (wizardData.tratamiento.opcion) {
        porcentajeParcial += 20;
      }
      
      if (porcentajeParcial > 0 && porcentajeParcial < 100) {
        guardarEvaluacionParcial(activoId, porcentajeParcial);
        
        return { 
          estado: 'parcial', 
          porcentaje: porcentajeParcial, 
          color: '#F59E0B',
          puedeContinuar: true
        };
      }
      
      if (porcentajeParcial === 100) {
        return { 
          estado: 'completa', 
          porcentaje: 100, 
          color: '#10B981',
          evaluacion: wizardData
        };
      }
    }
    
    const evaluacionParcialGuardada = localStorage.getItem(`evaluacion_parcial_${activoId}`);
    if (evaluacionParcialGuardada) {
      try {
        const datosParciales = JSON.parse(evaluacionParcialGuardada);
        const porcentaje = datosParciales.progreso || 0;
        
        if (porcentaje === 100) {
          return {
            estado: 'completa',
            porcentaje: 100,
            color: '#10B981',
            evaluacion: datosParciales.wizard_data || datosParciales.wizardData
          };
        }
        
        return {
          estado: 'parcial',
          porcentaje: porcentaje,
          color: '#F59E0B',
          puedeContinuar: true,
          datosParciales: datosParciales
        };
      } catch (error) {
        console.error('Error parseando Evaluación parcial:', error);
      }
    }
    
    const evaluacionCompleta = activo.evaluacion_completa || false;
    const porcentajeEvaluacion = activo.porcentaje_evaluacion || 0;
    
    if (evaluacionCompleta) {
      return { estado: 'completa', porcentaje: 100, color: '#10B981' };
    } else if (porcentajeEvaluacion > 0) {
      return { estado: 'parcial', porcentaje: porcentajeEvaluacion, color: '#F59E0B' };
    } else {
      return { estado: 'no_evaluado', porcentaje: 0, color: '#3B82F6' };
    }
  };

  const getStepColor = (stepIndex: number) => {
    if (!wizardData.selectedActivo) return '#D1D5DB';
    if (stepIndex < activeStep) return '#1E3A8A';
    if (stepIndex === activeStep) return '#1E3A8A';
    return '#D1D5DB';
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A' }}>
                Selecciona el activo de Información a evaluar
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>Evaluado</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>Parcial</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>Pendiente</Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Autocomplete
                fullWidth
                freeSolo
                options={activos}
                isOptionEqualToValue={(option, value) => {
                  if (!option || !value) return false;
                  const optionId = option.ID_Activo || option.id || option.ID;
                  const valueId = value.ID_Activo || value.id || value.ID;
                  return optionId === valueId;
                }}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') return option;
                  return option.Nombre || option.nombre || option.nombre_Activo || '';
                }}
                value={wizardData.selectedActivo}
                onInputChange={(event, newValue) => {
                  setSearchTerm(newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Buscar activo por nombre..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#6B7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: '12px' }}
                  />
                )}
                renderOption={(props, option) => {
                  if (!option) return null;
                  const optionId = option.id || option.id;
                  return (
                    <Box component="li" {...props} key={optionId} sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', color: '#FFFFFF', fontSize: '0.875rem' }}>
                          <SecurityIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 500 }}>
                            {option.nombre || option.nombre || option.nombre_Activo || 'Sin nombre'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setWizardData(prev => ({ ...prev, selectedActivo: newValue }));
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{ borderRadius: '12px', px: 3, backgroundColor: '#1E3A8A' }}
              >
                Crear Activo
              </Button>
            </Box>

            <Grid container spacing={2}>
              {filteredActivos.map((activo, activoIndex) => {
                const evaluacionEstado = getEvaluacionEstado(activo);
                const activoKey = (activo as any).ID_Activo || (activo as any).id || (activo as any).ID || `activo-${activoIndex}`;
                return (
                  <Grid key={`activo-card-${activoKey}`} size={{ xs: 12, md: 6 }}>
                    <Card
                      className="card"
                      sx={{
                        cursor: 'pointer',
                        border: wizardData.selectedActivo?.id === activo.id ? `2px solid ${evaluacionEstado.color}` : `1px solid ${evaluacionEstado.color}40`,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 25px ${evaluacionEstado.color}20` },
                        transition: 'all 0.25s ease',
                        position: 'relative',
                        overflow: 'visible'
                      }}
                      onClick={() => handleActivoSelect(activo)}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: evaluacionEstado.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          zIndex: 1
                        }}
                      >
                        {evaluacionEstado.estado === 'completa' && <CheckCircleIcon sx={{ fontSize: 12, color: '#FFFFFF' }} />}
                        {evaluacionEstado.estado === 'parcial' && <Typography sx={{ fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' }}>{evaluacionEstado.porcentaje}%</Typography>}
                      </Box>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ background: `linear-gradient(135deg, ${evaluacionEstado.color} 0%, ${evaluacionEstado.color}CC 100%)`, color: '#FFFFFF' }}>
                            <SecurityIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" className="font-poppins" sx={{ color: evaluacionEstado.color, fontWeight: 600 }}>
                              {(activo as any).Nombre || (activo as any).nombre || 'Sin nombre'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', mb: 4, fontWeight: 700 }}>
              Evaluación de Riesgos
            </Typography>

            {/* SECCIÓN 1: INTELIGENCIA COLECTIVA / RAG */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                🤖 Propuestas Inteligentes para {wizardData.selectedActivo?.Nombre || wizardData.selectedActivo?.nombre || 'este activo'}
              </Typography>
              <InteractiveSuggestions
                assetType={wizardData.selectedActivo}
                showCategories={['amenazas', 'vulnerabilidades']}
                context={`Activo: ${wizardData.selectedActivo?.Nombre || wizardData.selectedActivo?.nombre || 'Sin nombre'}`}
                selectedThreat={wizardData.newRiesgo.amenaza}
                selectedVulnerability={wizardData.newRiesgo.vulnerabilidad}
                onSuggestionSelect={(suggestion) => {
                  if (suggestion.type === 'amenazas') {
                    setWizardData(prev => ({
                      ...prev,
                      isCreatingNew: true,
                      newRiesgo: {
                        ...prev.newRiesgo,
                        amenaza: suggestion.data.nombre,
                        descripcion: suggestion.data.descripcion || prev.newRiesgo.descripcion,
                        tipoRiesgo: suggestion.data.categoria || prev.newRiesgo.tipoRiesgo
                      }
                    }));
                    toast.success(`Amenaza detectada: ${suggestion.data.nombre}`);
                  } else if (suggestion.type === 'vulnerabilidades') {
                    setWizardData(prev => ({
                      ...prev,
                      isCreatingNew: true,
                      newRiesgo: {
                        ...prev.newRiesgo,
                        vulnerabilidad: suggestion.data.nombre
                      }
                    }));
                    toast.success(`Vulnerabilidad asociada: ${suggestion.data.nombre}`);
                  }
                }}
              />
            </Box>

            {/* SECCIÓN 2: OPCIONES DE CARGA (HISTORIAL O MANUAL) */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="card" sx={{ p: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" className="font-poppins" sx={{ color: '#1E3A8A', mb: 1, fontWeight: 'bold' }}>
                      O buscar Riesgo Existente
                    </Typography>
                    <Autocomplete
                      fullWidth
                      options={riesgosExistentes}
                      getOptionLabel={(option) => (option as any).nombre || (option as any).nombre || ''}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          const riesgo = newValue as any;
                          setWizardData({
                            ...wizardData,
                            isCreatingNew: true,
                            newRiesgo: {
                              amenaza: riesgo.amenaza || '',
                              vulnerabilidad: riesgo.vulnerabilidad || '',
                              descripcion: riesgo.Descripcion || riesgo.descripcion || '',
                              tipoRiesgo: riesgo.tipo_riesgo || riesgo.tipoRiesgo || ''
                            }
                          });
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="Buscar historial..." variant="standard" />}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="card" sx={{ 
                  height: '100%', 
                  border: wizardData.isCreatingNew ? '1px solid #1E3A8A' : 'none',
                  backgroundColor: wizardData.isCreatingNew ? '#F0F9FF' : '#FFF'
                }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Button 
                      variant={wizardData.isCreatingNew ? "outlined" : "contained"} 
                      color="primary"
                      startIcon={wizardData.isCreatingNew ? <ArrowBackIcon /> : <AddIcon />} 
                      onClick={() => setWizardData({...wizardData, isCreatingNew: !wizardData.isCreatingNew})} 
                      sx={{ borderRadius: '12px' }}
                    >
                      {wizardData.isCreatingNew ? 'Limpiar y Volver' : 'Identificación Manual'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECCIÓN 3: FORMULARIO DE REFINAMIENTO */}
            {wizardData.isCreatingNew && (
              <Card className="card" sx={{ 
                animation: 'fadeIn 0.5s ease-in-out',
                borderLeft: '4px solid #1E3A8A',
                mt: 2
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 3 }}>
                    📍 Detalle del Riesgo Identificado
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="Amenaza *" 
                        placeholder="Ej: Acceso no autorizado"
                        value={wizardData.newRiesgo.amenaza} 
                        onChange={(e) => setWizardData({...wizardData, newRiesgo: {...wizardData.newRiesgo, amenaza: e.target.value}})} 
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="Vulnerabilidad *" 
                        placeholder="Ej: Falta de cifrado"
                        value={wizardData.newRiesgo.vulnerabilidad} 
                        onChange={(e) => setWizardData({...wizardData, newRiesgo: {...wizardData.newRiesgo, vulnerabilidad: e.target.value}})} 
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth required>
                        <InputLabel>Tipo de Riesgo *</InputLabel>
                        <Select 
                          value={wizardData.newRiesgo.tipoRiesgo} 
                          label="Tipo de Riesgo *"
                          onChange={(e) => setWizardData({...wizardData, newRiesgo: {...wizardData.newRiesgo, tipoRiesgo: e.target.value}})}
                        >
                          {tiposRiesgo.map(tipo => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField 
                        fullWidth 
                        multiline 
                        rows={3} 
                        label="Descripción Sugerida" 
                        placeholder="La IA ha generado esta descripción base..."
                        value={wizardData.newRiesgo.descripcion} 
                        onChange={(e) => setWizardData({...wizardData, newRiesgo: {...wizardData.newRiesgo, descripcion: e.target.value}})} 
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <CriticityCalculator
              onCriticityChange={(criticidad) => {
                setCriticityData(criticidad);
                setWizardData({
                  ...wizardData,
                  evaluacionInherente: {
                    ...wizardData.evaluacionInherente,
                    criticidad: criticidad.clasificacion,
                    confidencialidad: criticidad.confidencialidad,
                    disponibilidad: criticidad.disponibilidad,
                    integridad: criticidad.integridad
                  }
                });
              }}
              initialValues={{
                confidencialidad: wizardData.evaluacionInherente.confidencialidad || 3,
                disponibilidad: wizardData.evaluacionInherente.disponibilidad || 3,
                integridad: wizardData.evaluacionInherente.integridad || 3
              }}
            />
            <InherentEvaluationStep
              data={wizardData.evaluacionInherente}
              onUpdate={(data) => setWizardData((prev) => ({ ...prev, evaluacionInherente: data }))}
              amenaza={wizardData.newRiesgo.amenaza}
              controles={wizardData.controles.seleccionados || []}
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>Selecciona los controles</Typography>
            <Grid container spacing={3}>
              <Grid  size={{ xs: 12 }}>
                <Card className="card">
                  <CardHeader 
                    title="Nivel de Eficacia de Controles" 
                    subheader="Evalúa el impacto de los controles seleccionados"
                    sx={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Eficacia General de los Controles</InputLabel>
                      <Select 
                        value={wizardData.controles.eficacia} 
                        label="Eficacia General de los Controles"
                        onChange={(e) => setWizardData({...wizardData, controles: {...wizardData.controles, eficacia: e.target.value}})}
                      >
                        <MenuItem value="Muy Alta">Muy Alta (90-100%)</MenuItem>
                        <MenuItem value="Alta">Alta (70-89%)</MenuItem>
                        <MenuItem value="Media">Media (50-69%)</MenuItem>
                        <MenuItem value="Baja">Baja (20-49%)</MenuItem>
                        <MenuItem value="Muy Baja">Muy Baja (0-19%)</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Justificación de la Eficacia"
                      value={wizardData.controles.justificacion}
                      onChange={(e) => setWizardData({...wizardData, controles: {...wizardData.controles, justificacion: e.target.value}})}
                      placeholder="Explica por qué has seleccionado este nivel de eficacia..."
                    />
                  </CardContent>
                </Card>
              </Grid>
            <Grid  size={{ xs: 12 }}>
                <InteractiveSuggestions
                  assetType={wizardData.selectedActivo}
                  selectedThreat={wizardData.newRiesgo.amenaza}
                  selectedVulnerability={wizardData.newRiesgo.vulnerabilidad}
                  showCategories={['controles']}
                  onSuggestionSelect={(suggestion) => {
                    const controlNombre = suggestion.data.nombre;
                    if (!wizardData.controles.seleccionados.includes(controlNombre)) {
                      setWizardData(prev => ({
                        ...prev,
                        controles: {
                          ...prev.controles,
                          seleccionados: [...prev.controles.seleccionados, controlNombre]
                        }
                      }));
                      toast.success(`Control añadido: ${controlNombre}`);
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>Evaluación Residual</Typography>
            <Grid container spacing={3}>
              <Grid  size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Probabilidad Residual</InputLabel>
                  <Select value={wizardData.evaluacionResidual.probabilidad} onChange={(e) => setWizardData({...wizardData, evaluacionResidual: {...wizardData.evaluacionResidual, probabilidad: e.target.value}})}>
                    <MenuItem value="Improbable">Improbable</MenuItem>
                    <MenuItem value="Posible">Posible</MenuItem>
                    <MenuItem value="Ocasional">Ocasional</MenuItem>
                    <MenuItem value="Probable">Probable</MenuItem>
                    <MenuItem value="Frecuente">Frecuente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid  size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Impacto Residual</InputLabel>
                  <Select 
                    value={wizardData.evaluacionResidual.impacto} 
                    label="Impacto Residual"
                    onChange={(e) => setWizardData({...wizardData, evaluacionResidual: {...wizardData.evaluacionResidual, impacto: e.target.value}})}
                  >
                    <MenuItem value="Insignificante">Insignificante</MenuItem>
                    <MenuItem value="Menor">Menor</MenuItem>
                    <MenuItem value="Moderado">Moderado</MenuItem>
                    <MenuItem value="Mayor">Mayor</MenuItem>
                    <MenuItem value="Catastrfico">Catastrfico</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 500 }}>
                  Justificación del Riesgo Residual (Asistencia IA)
                </Typography>
                <JustificationSuggestions
                  riskType={wizardData.newRiesgo.amenaza}
                  controls={wizardData.controles.seleccionados}
                  onJustificationSelect={(text) => {
                    setWizardData({
                      ...wizardData,
                      evaluacionResidual: {
                        ...wizardData.evaluacionResidual,
                        justificacion: wizardData.evaluacionResidual.justificacion 
                          ? `${wizardData.evaluacionResidual.justificacion}\n\n${text}`
                          : text
                      }
                    });
                  }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mt: 2 }}
                  label="Justificación Detallada"
                  value={wizardData.evaluacionResidual.justificacion}
                  onChange={(e) => setWizardData({...wizardData, evaluacionResidual: {...wizardData.evaluacionResidual, justificacion: e.target.value}})}
                  placeholder="Detalle por qué el riesgo ha cambiado tras la aplicación de controles..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 5:
        return (
          <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 3 }}>
              🛡️ Plan de Tratamiento del Riesgo
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Tratamiento *</InputLabel>
                  <Select
                    value={wizardData.tratamiento.opcion}
                    label="Tipo de Tratamiento *"
                    onChange={(e) => setWizardData({...wizardData, tratamiento: {...wizardData.tratamiento, opcion: e.target.value}})}
                  >
                    <MenuItem value="Mitigar">Mitigar (Reducir)</MenuItem>
                    <MenuItem value="Transferir">Transferir (Compartir)</MenuItem>
                    <MenuItem value="Evitar">Evitar (Eliminar)</MenuItem>
                    <MenuItem value="Aceptar">Aceptar (Asumir)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  label="Responsable del Tratamiento *" 
                  placeholder="Nombre o Cargo"
                  value={wizardData.tratamiento.responsable} 
                  onChange={(e) => setWizardData({...wizardData, tratamiento: {...wizardData.tratamiento, responsable: e.target.value}})} 
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  type="date"
                  label="Fecha de Inicio" 
                  InputLabelProps={{ shrink: true }}
                  value={wizardData.tratamiento.fechaInicio} 
                  onChange={(e) => setWizardData({...wizardData, tratamiento: {...wizardData.tratamiento, fechaInicio: e.target.value}})} 
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  type="date"
                  label="Fecha de Finalización" 
                  InputLabelProps={{ shrink: true }}
                  value={wizardData.tratamiento.fechaFin} 
                  onChange={(e) => setWizardData({...wizardData, tratamiento: {...wizardData.tratamiento, fechaFin: e.target.value}})} 
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  type="number"
                  label="Presupuesto Estimado (USD)" 
                  placeholder="0.00"
                  value={wizardData.tratamiento.presupuesto} 
                  onChange={(e) => setWizardData({...wizardData, tratamiento: {...wizardData.tratamiento, presupuesto: e.target.value}})} 
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 6:
        return (
          <Box>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>Plan de Acción</Typography>
            <EditableActionPlan
              actionItems={wizardData.planAccion.acciones}
              onActionItemsChange={(s) => setWizardData({ ...wizardData, planAccion: { ...wizardData.planAccion, acciones: s } })}
            />
          </Box>
        );

      case 7:
        return (
          <Box>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>Resultados Finales</Typography>
            <Button variant="contained" onClick={guardarEvaluacion}>Guardar Evaluación</Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>Evaluación de Riesgos</Typography>
      </Box>
      <Card className="card" sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box id="wizard-content">
            <ConversationalAuditor message={aiMessage} isTyping={isAiTyping} sentiment={aiSentiment} />
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </CardContent>
      </Card>
      <Card className="card">
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}>Anterior</Button>
        <Button variant="contained" onClick={activeStep === steps.length - 1 ? finalizarEvaluacion : handleNext}>
          {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
        </Button>
      </Box>
      <Dialog open={openAccionDialog} onClose={() => setOpenAccionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Acción al Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <ConversationalAuditor
                message={aiMessage}
                sentiment={aiSentiment}
                isTyping={isAiTyping}
              />
            </Box>
            
            {/* Gestión de documentos */}
            <Box sx={{ mt: 3 }}>
              <DocumentManager
                accionId={newAccion.id || 'temp'}
                documentos={newAccion.documentos}
                onDocumentosChange={(documentos) => setNewAccion({ ...newAccion, documentos })}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAccionDialog(false)}>Cancelar</Button>
          <Button onClick={addAccion} variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars para mensajes */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Evaluación completada exitosamente!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showExportMessage}
        autoHideDuration={4000}
        onClose={() => setShowExportMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowExportMessage(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          {exportMessage}
        </Alert>
      </Snackbar>

      {/* Dilogo para crear activo */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: '#1E3A8A', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 3,
          pt: 3,
          px: 3
        }}>
          <SecurityIcon />
          <Box>
            <Typography variant="h6" className="font-poppins">
              Crear Nuevo Activo
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Agrega un nuevo activo al inventario
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 6, px: 4, pb: 4, mt: 3 }}>
          <Grid container spacing={4}>
            <Grid  size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre del Activo *"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="input"
              />
            </Grid>
            <Grid  size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel id="wizard-tipo-activo-label" sx={{ mt: 0.5 }}>Tipo de Activo *</InputLabel>
                <Select
                  labelId="wizard-tipo-activo-label"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
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
                  <MenuItem value="Sistema de Información">Sistema de Información</MenuItem>
                  <MenuItem value="Software">Software</MenuItem>
                  <MenuItem value="Infraestructura">Infraestructura</MenuItem>
                  <MenuItem value="Datos">Datos</MenuItem>
                  <MenuItem value="Personal">Personal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid  size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción del Activo"
                multiline
                rows={3}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="input"
              />
            </Grid>
            <Grid  size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="wizard-estado-activo-label" sx={{ mt: 0.5 }}>Estado del Activo</InputLabel>
                <Select
                  labelId="wizard-estado-activo-label"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
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
                  <MenuItem value="Planificado">Planificado</MenuItem>
                  <MenuItem value="En desarrollo">En desarrollo</MenuItem>
                  <MenuItem value="En produccion">En produccin</MenuItem>
                  <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid  size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="wizard-criticidad-label" sx={{ mt: 0.5 }}>Nivel de Criticidad</InputLabel>
                <Select
                  labelId="wizard-criticidad-label"
                  value={formData.criticidad}
                  onChange={(e) => setFormData({ ...formData, criticidad: e.target.value })}
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
                  <MenuItem value="Bajo">Bajo</MenuItem>
                  <MenuItem value="Medio">Medio</MenuItem>
                  <MenuItem value="Alto">Alto</MenuItem>
                  <MenuItem value="Crtico">Crtico</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateActivo}
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              backgroundColor: '#1E3A8A',
              '&:hover': {
                backgroundColor: '#1E40AF',
              }
            }}
          >
            Crear Activo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dilogo para crear nuevo riesgo */}
      <Dialog 
        open={openRiesgoDialog} 
        onClose={handleCloseRiesgoDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* Encabezado separado */}
        <Box sx={{ 
          backgroundColor: '#1E3A8A', 
          color: 'white',
          p: 3,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <WarningIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" className="font-poppins" sx={{ fontWeight: 600 }}>
              Crear Nuevo Riesgo
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, ml: 5 }}>
            Define un nuevo riesgo especfico para este activo
          </Typography>
        </Box>

        {/* Contenido del formulario */}
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4, pt: 3 }}>
            <Stack spacing={3}>
              {/* Nombre del Riesgo */}
              <TextField
                fullWidth
                label="Nombre del Riesgo *"
                value={riesgoFormData.nombre}
                onChange={(e) => setRiesgoFormData({ ...riesgoFormData, nombre: e.target.value })}
                helperText="Ingresa un nombre descriptivo para el riesgo"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                      borderWidth: '2px'
                    },
                    '&:hover fieldset': {
                      borderColor: '#1E3A8A',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1E3A8A',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1E3A8A'
                  }
                }}
                placeholder="Ej: Prdida de datos por acceso no autorizado"
              />
              
              {/* Amenaza con Autocomplete mejorado */}
              <Autocomplete
                freeSolo
                options={amenazasDisponibles}
                value={riesgoFormData.amenaza}
                onInputChange={(event, newValue) => {
                  setRiesgoFormData({ ...riesgoFormData, amenaza: newValue || '' });
                }}
                onChange={(event, newValue) => {
                  setRiesgoFormData({ ...riesgoFormData, amenaza: newValue || '' });
                }}
                ListboxProps={{
                  style: {
                    maxHeight: '300px',
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Amenaza *"
                    required
                    helperText={
                      amenazasDisponibles.length > 0 
                        ? `${amenazasDisponibles.length} amenaza${amenazasDisponibles.length !== 1 ? 's' : ''} disponible${amenazasDisponibles.length !== 1 ? 's' : ''} en la base de datos. Escribe para buscar o crear una nueva.`
                        : "Cargando amenazas desde la base de datos..."
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        '& fieldset': {
                          borderColor: '#E5E7EB',
                          borderWidth: '2px'
                        },
                        '&:hover fieldset': {
                          borderColor: '#1E3A8A'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1E3A8A',
                          borderWidth: '2px'
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#1E3A8A'
                      }
                    }}
                    placeholder="Escribe o selecciona una amenaza de la lista"
                  />
                )}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: '#F3F4F6'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {option}
                    </Typography>
                  </Box>
                )}
                noOptionsText={
                  <Box sx={{ py: 2, px: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron amenazas. Presiona Enter para crear "{riesgoFormData.amenaza}"
                    </Typography>
                  </Box>
                }
                PaperComponent={({ children, ...other }) => (
                  <Paper {...other} sx={{ 
                    mt: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}>
                    {children}
                  </Paper>
                )}
              />
              
              {/* Vulnerabilidad con Autocomplete mejorado */}
              <Autocomplete
                freeSolo
                options={vulnerabilidadesDisponibles.map(v => v.nombre || v)}
                value={riesgoFormData.vulnerabilidad}
                onInputChange={(event, newValue) => {
                  setRiesgoFormData({ ...riesgoFormData, vulnerabilidad: newValue || '' });
                }}
                onChange={(event, newValue) => {
                  setRiesgoFormData({ ...riesgoFormData, vulnerabilidad: newValue || '' });
                }}
                ListboxProps={{
                  style: {
                    maxHeight: '300px',
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vulnerabilidad *"
                    required
                    helperText={
                      vulnerabilidadesDisponibles.length > 0 
                        ? `${vulnerabilidadesDisponibles.length} vulnerabilidad${vulnerabilidadesDisponibles.length !== 1 ? 'es' : ''} disponible${vulnerabilidadesDisponibles.length !== 1 ? 's' : ''} en la base de datos. Escribe para buscar o crear una nueva.`
                        : "Cargando vulnerabilidades desde la base de datos..."
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        '& fieldset': {
                          borderColor: '#E5E7EB',
                          borderWidth: '2px'
                        },
                        '&:hover fieldset': {
                          borderColor: '#1E3A8A'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1E3A8A',
                          borderWidth: '2px'
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#1E3A8A'
                      }
                    }}
                    placeholder="Escribe o selecciona una vulnerabilidad de la lista"
                  />
                )}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: '#F3F4F6'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {option}
                    </Typography>
                  </Box>
                )}
                noOptionsText={
                  <Box sx={{ py: 2, px: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron vulnerabilidades. Presiona Enter para crear "{riesgoFormData.vulnerabilidad}"
                    </Typography>
                  </Box>
                }
                PaperComponent={({ children, ...other }) => (
                  <Paper {...other} sx={{ 
                    mt: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}>
                    {children}
                  </Paper>
                )}
              />
              
              {/* Tipo de Riesgo */}
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  '&.Mui-focused': { color: '#1E3A8A' }
                }}>Tipo de Riesgo *</InputLabel>
                <Select
                  value={riesgoFormData.tipoRiesgo}
                  onChange={(e) => setRiesgoFormData({ ...riesgoFormData, tipoRiesgo: e.target.value })}
                  label="Tipo de Riesgo *"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: '300px',
                        borderRadius: '12px',
                        mt: 1
                      }
                    }
                  }}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                      borderWidth: '2px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1E3A8A'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1E3A8A',
                      borderWidth: '2px'
                    }
                  }}
                >
                  {tiposRiesgo.map((tipo) => (
                    <MenuItem key={tipo} value={tipo} sx={{ py: 1.5 }}>
                      <Typography variant="body1">{tipo}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Descripción del Riesgo */}
              <TextField
                fullWidth
                label="Descripción del Riesgo"
                multiline
                rows={5}
                helperText="Describe detalladamente el riesgo identificado, sus causas, consecuencias y contexto"
                placeholder="Describe detalladamente el riesgo identificado, sus causas, consecuencias y contexto..."
                value={riesgoFormData.descripcion}
                onChange={(e) => setRiesgoFormData({ ...riesgoFormData, descripcion: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                      borderWidth: '2px'
                    },
                    '&:hover fieldset': {
                      borderColor: '#1E3A8A',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1E3A8A',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1E3A8A'
                  }
                }}
              />
            </Stack>
          </Box>
        </DialogContent>

        {/* Acciones separadas */}
        <Divider />
        <DialogActions sx={{ p: 3, gap: 2, backgroundColor: '#F9FAFB' }}>
          <Button 
            onClick={handleCloseRiesgoDialog}
            variant="outlined"
            sx={{ 
              borderRadius: '10px',
              px: 3,
              py: 1.5,
              borderColor: '#D1D5DB',
              color: '#374151',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#9CA3AF',
                backgroundColor: '#F3F4F6'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateRiesgo}
            variant="contained"
            disabled={isCreatingRiesgo || !riesgoFormData.amenaza || !riesgoFormData.vulnerabilidad || !riesgoFormData.tipoRiesgo}
            sx={{ 
              borderRadius: '10px',
              px: 4,
              py: 1.5,
              backgroundColor: '#1E3A8A',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
              '&:hover': {
                backgroundColor: '#1E40AF',
                boxShadow: '0 6px 16px rgba(30, 58, 138, 0.4)'
              },
              '&:disabled': {
                backgroundColor: '#9CA3AF',
                color: '#FFFFFF'
              }
            }}
          >
            {isCreatingRiesgo ? 'Creando...' : 'Crear Riesgo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ficha de detalles del activo */}
      <ActivoDetailCard
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        activo={selectedActivoDetail}
        onEdit={() => {
          setOpenDetailDialog(false);
          setOpenDialog(true);
        }}
        onEvaluate={() => {
          setOpenDetailDialog(false);
          // El activo ya est seleccionado, solo necesitamos continuar con la Evaluación
          if (wizardData.selectedActivo) {
            setActiveStep(1); // Ir al siguiente paso (Identificación de Riesgo)
          }
        }}
      />

      {/* Modal de resumen de Evaluación */}
      <Dialog 
        open={openSummaryDialog} 
        onClose={() => setOpenSummaryDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle className="font-poppins" sx={{ color: '#1E3A8A', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon sx={{ color: '#10B981', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" className="font-poppins">
                Resumen de Evaluación Completada
              </Typography>
              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                {selectedActivoDetail?.nombre || selectedActivoDetail?.nombre || 'Activo'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {selectedActivoDetail && (() => {
            const evaluacionEstado = getEvaluacionEstado(selectedActivoDetail);
            const evaluacion = evaluacionEstado.evaluacion;
            
            if (!evaluacion) return null;
            
            return (
              <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {/* Información del activo */}
                <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                  <CardContent>
                    <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                      Información del Activo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid  size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                          <strong>Nombre:</strong> {selectedActivoDetail?.nombre || selectedActivoDetail?.nombre || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid  size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                          <strong>Tipo:</strong> {selectedActivoDetail?.Tipo_Activo || selectedActivoDetail?.tipo || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid  size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                          <strong>Criticidad:</strong> {selectedActivoDetail?.nivel_criticidad_negocio || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid  size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                          <strong>Fecha de Evaluación:</strong> {
                            evaluacion?.fechaCompletada 
                              ? new Date(evaluacion.fechaCompletada).toLocaleDateString()
                              : new Date().toLocaleDateString()
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Información del riesgo */}
                {evaluacion.evaluacion?.newRiesgo?.amenaza && (
                  <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                        Información del Riesgo
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                        <strong>Amenaza:</strong> {evaluacion.evaluacion?.newRiesgo.amenaza}
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                        <strong>Vulnerabilidad:</strong> {evaluacion.evaluacion?.newRiesgo.vulnerabilidad}
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        <strong>Descripción:</strong> {evaluacion.evaluacion?.newRiesgo.descripcion}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Evaluación Inherente */}
                {evaluacion.evaluacion?.evaluacionInherente.probabilidad && (
                  <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                        Evaluación Inherente
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Probabilidad:</strong> {evaluacion.evaluacion?.evaluacionInherente.probabilidad}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Impacto:</strong> {evaluacion.evaluacion?.evaluacionInherente.impacto}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                            <strong>Nivel de Riesgo:</strong> 
                            <Chip 
                              label={evaluacion.evaluacion?.evaluacionInherente.nivelRiesgo} 
                              size="small" 
                              sx={{ ml: 1, backgroundColor: '#FEF3C7', color: '#D97706' }}
                            />
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Justificacin:</strong> {evaluacion.evaluacion?.evaluacionInherente.justificacion}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Evaluación Residual */}
                {evaluacion.evaluacion?.evaluacionResidual.probabilidad && (
                  <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                        Evaluación Residual
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Probabilidad:</strong> {evaluacion.evaluacion?.evaluacionResidual.probabilidad}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Impacto:</strong> {evaluacion.evaluacion?.evaluacionResidual.impacto}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                            <strong>Nivel de Riesgo:</strong> 
                            <Chip 
                              label={evaluacion.evaluacion?.evaluacionResidual.nivelRiesgo} 
                              size="small" 
                              sx={{ ml: 1, backgroundColor: '#DBEAFE', color: '#2563EB' }}
                            />
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Justificacin:</strong> {evaluacion.evaluacion?.evaluacionResidual.justificacion}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Opciones de Tratamiento */}
                {evaluacion.evaluacion?.tratamiento.opcion && (
                  <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                        Opciones de Tratamiento
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid  size={{ xs: 12 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                            <strong>Opcin:</strong> {evaluacion.evaluacion?.tratamiento.opcion}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Responsable:</strong> {evaluacion.evaluacion?.tratamiento.responsable}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Presupuesto:</strong> {evaluacion.evaluacion?.tratamiento.presupuesto}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Fecha Inicio:</strong> {evaluacion.evaluacion?.tratamiento.fechaInicio}
                          </Typography>
                        </Grid>
                        <Grid  size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                            <strong>Fecha Fin:</strong> {evaluacion.evaluacion?.tratamiento.fechaFin}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Documentos Adjuntos de la Evaluación */}
                {(() => {
                  // Recopilar todos los documentos de todas las acciones
                  const todosDocumentos: any[] = [];
                  evaluacion.evaluacion?.planAccion?.acciones?.forEach((accion: any) => {
                    if (accion.documentos && accion.documentos.length > 0) {
                      accion.documentos.forEach((doc: any) => {
                        todosDocumentos.push({
                          ...doc,
                          accion: accion.descripcion || accion.titulo || `Acción ${accion.id || ''}`
                        });
                      });
                    }
                  });
                  
                  return todosDocumentos.length > 0 ? (
                    <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                      <CardContent>
                        <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                          Documentos Adjuntos ({todosDocumentos.length})
                        </Typography>
                        <ListItem dense sx={{ bgcolor: '#F9FAFB', borderRadius: '4px', p: 1 }}>
                          {todosDocumentos.map((documento, docIndex) => (
                            <ListItem key={documento.id || `doc-${docIndex}-${documento.nombre}`} 
                              sx={{ 
                                py: 1,
                                borderBottom: docIndex < todosDocumentos.length - 1 ? '1px solid #E5E7EB' : 'none',
                                '&:hover': { backgroundColor: '#F3F4F6' }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                {documento.tipo.includes('pdf') ? <PdfIcon sx={{ color: '#DC2626', fontSize: 24 }} /> :
                                 documento.tipo.includes('word') ? <WordIcon sx={{ color: '#2563EB', fontSize: 24 }} /> :
                                 documento.tipo.includes('excel') ? <ExcelIcon sx={{ color: '#059669', fontSize: 24 }} /> :
                                 documento.tipo.includes('image') ? <ImageIcon sx={{ color: '#7C3AED', fontSize: 24 }} /> :
                                 <FileIcon sx={{ color: '#6B7280', fontSize: 24 }} />}
                              </Box>
                              <ListItemText
                                primary={
                                  <Box>
                                    <Typography 
                                      variant="body2" 
                                      className="font-roboto" 
                                      sx={{ fontWeight: 500, color: '#1E3A8A', cursor: 'pointer' }}
                                      onClick={() => {
                                        // Construir URL completa si es relativa
                                        const url = documento.url?.startsWith('http') 
                                          ? documento.url 
                                          : `${window.location.origin}${documento.url || `/api/documentos/descargar/${documento.id}`}`;
                                        window.open(url, '_blank');
                                      }}
                                    >
                                      {documento.nombre}
                                    </Typography>
                                    <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', mt: 0.5 }}>
                                      {documento.accion}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                    {documentosService.formatearTamano(documento.tamano || documento.tamano_bytes || 0)}  
                                    {documento.fechaSubida ? new Date(documento.fechaSubida).toLocaleDateString() : 'Fecha no disponible'}
                                    {documento.descripcion && `  ${documento.descripcion}`}
                                  </Typography>
                                }
                              />
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    // Construir URL completa si es relativa
                                    const url = documento.url?.startsWith('http') 
                                      ? documento.url 
                                      : `${window.location.origin}${documento.url || `/api/documentos/descargar/${documento.id}`}`;
                                    window.open(url, '_blank');
                                  }}
                                  sx={{ color: '#1E3A8A', mr: 0.5 }}
                                  title="Ver documento"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      // Construir URL completa si es relativa
                                      const url = documento.url?.startsWith('http') 
                                        ? documento.url 
                                        : `${window.location.origin}${documento.url || `/api/documentos/descargar/${documento.id}`}`;
                                      
                                      // Descargar usando fetch para manejar autenticacin
                                      const response = await fetch(url, {
                                        method: 'GET',
                                        headers: {
                                          'Authorization': `Bearer ${localStorage.get('token') || ''}`
                                        }
                                      });
                                      
                                      if (response.ok) {
                                        const blob = await response.blob();
                                        const downloadUrl = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = downloadUrl;
                                        link.download = documento.nombre;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(downloadUrl);
                                      } else {
                                        // Fallback: abrir en nueva ventana
                                        window.open(url, '_blank');
                                      }
                                    } catch (error) {
                                      console.error('Error descargando documento:', error);
                                      // Fallback: abrir en nueva ventana
                                      const url = documento.url?.startsWith('http') 
                                        ? documento.url 
                                        : `${window.location.origin}${documento.url || `/api/documentos/descargar/${documento.id}`}`;
                                      window.open(url, '_blank');
                                    }
                                  }}
                                  sx={{ color: '#1E3A8A' }}
                                  title="Descargar documento"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </ListItem>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* Plan de Acción con Documentos */}
                {evaluacion.evaluacion?.planAccion.acciones.length > 0 && (
                  <Card sx={{ mb: 3, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                        Plan de Acción
                      </Typography>
                      {evaluacion.evaluacion?.planAccion.acciones.map((accion, index) => (
                        <Box key={accion.id || `accion-${index}-${accion.descripcion}`} sx={{ mb: 3, p: 2, border: '1px solid #F3F4F6', borderRadius: '8px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="subtitle1" className="font-poppins" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
                              Acción {index + 1}: {accion.descripcion}
                            </Typography>
                            <Chip
                              label={accion.estado}
                              size="small"
                              sx={{
                                backgroundColor: accion.estado === 'Completado' ? '#D1FAE5' :
                                               accion.estado === 'En Progreso' ? '#DBEAFE' :
                                               accion.estado === 'Pendiente' ? '#FEF3C7' : '#FEE2E2',
                                color: accion.estado === 'Completado' ? '#059669' :
                                       accion.estado === 'En Progreso' ? '#2563EB' :
                                       accion.estado === 'Pendiente' ? '#D97706' : '#DC2626',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid  size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                <strong>Responsable:</strong> {accion.responsable}
                              </Typography>
                            </Grid>
                            <Grid  size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                <strong>Perodo:</strong> {accion.fechaInicio} - {accion.fechaFin}
                              </Typography>
                            </Grid>
                            {accion.comentarios && (
                              <Grid  size={{ xs: 12 }}>
                                <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                                  <strong>Comentarios:</strong> {accion.comentarios}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>

                          {/* Documentos de la Acción */}
                          {accion.documentos && accion.documentos.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#1E3A8A', mb: 1 }}>
                                Documentos de Evidencia ({accion.documentos.length})
                              </Typography>
                              <ListItem dense sx={{ bgcolor: '#F9FAFB', borderRadius: '4px', p: 1 }}>
                                {accion.documentos.map((documento, docIndex) => (
                                  <ListItem key={documento.id || `doc-${docIndex}-${documento.nombre}`} sx={{ py: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                      {documento.tipo.includes('pdf') ? <PdfIcon sx={{ color: '#DC2626', fontSize: 20 }} /> :
                                       documento.tipo.includes('word') ? <WordIcon sx={{ color: '#2563EB', fontSize: 20 }} /> :
                                       documento.tipo.includes('excel') ? <ExcelIcon sx={{ color: '#059669', fontSize: 20 }} /> :
                                       documento.tipo.includes('image') ? <ImageIcon sx={{ color: '#7C3AED', fontSize: 20 }} /> :
                                       <FileIcon sx={{ color: '#6B7280', fontSize: 20 }} />}
                                    </Box>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500 }}>
                                          {documento.nombre}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                                          {documentosService.formatearTamano(documento.tamano)}  
                                          {new Date(documento.fechaSubida).toLocaleDateString()}
                                          {documento.descripcion && `  ${documento.descripcion}`}
                                        </Typography>
                                      }
                                    />
                                    <Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          // Abrir en nueva ventana para visualizar
                                          window.open(documento.url, '_blank');
                                        }}
                                        sx={{ color: '#1E3A8A', mr: 0.5 }}
                                        title="Ver documento"
                                      >
                                        <VisibilityIcon />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = documento.url;
                                          link.download = documento.nombre;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        sx={{ color: '#1E3A8A' }}
                                        title="Descargar documento"
                                      >
                                        <DownloadIcon />
                                      </IconButton>
                                    </Box>
                                  </ListItem>
                                ))}
                              </ListItem>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setOpenSummaryDialog(false)}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cerrar
          </Button>
          <Button 
            onClick={() => {
              if (selectedActivoDetail) {
                const evaluacionEstado = getEvaluacionEstado(selectedActivoDetail);
                if (evaluacionEstado.evaluacion) {
                  // Mostrar dilogo para seleccionar si incluir anexos
                  setOpenExportDialog(true);
                }
              }
            }}
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={isExportando}
            sx={{ 
              borderRadius: '8px',
              backgroundColor: '#10B981',
              '&:hover': {
                backgroundColor: '#059669',
              }
            }}
          >
            {isExportando ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </DialogActions>
      </Dialog>

            {/* Dialogo de opciones de exportacion PDF */}
      <Dialog 
        open={openExportDialog} 
        onClose={() => setOpenExportDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle className="font-poppins" sx={{ color: '#1E3A8A', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DownloadIcon sx={{ color: '#10B981', fontSize: 28 }} />
            <Typography variant="h6" className="font-poppins">
              Opciones de Exportacion PDF
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
            <Typography variant="body2">
              Selecciona si deseas incluir los documentos adjuntos (anexos) en el PDF exportado.
            </Typography>
          </Alert>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={incluirAnexos}
                  onChange={(e) => setIncluirAnexos(e.target.checked)}
                  sx={{ color: '#1E3A8A', '&.Mui-checked': { color: '#1E3A8A' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" className="font-roboto" sx={{ fontWeight: 500 }}>
                    Incluir documentos adjuntos (anexos)
                  </Typography>
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                    Si esta marcado, se incluira una lista de todos los documentos adjuntos con sus detalles en el PDF.
                  </Typography>
                </Box>
              }
            />
          </FormGroup>

          {selectedActivoDetail && (() => {
            const evaluacionEstado = getEvaluacionEstado(selectedActivoDetail);
            const evaluacion = evaluacionEstado.evaluacion;
            if (!evaluacion) return null;
            
            const todosDocumentos: any[] = [];
            evaluacion.evaluacion?.planAccion?.acciones?.forEach((accion: any) => {
              if (accion.documentos && accion.documentos.length > 0) {
                accion.documentos.forEach((doc: any) => {
                  todosDocumentos.push(doc);
                });
              }
            });

            if (todosDocumentos.length > 0) {
              return (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#F9FAFB', borderRadius: '8px' }}>
                  <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                    <strong>Documentos disponibles:</strong> {todosDocumentos.length}
                  </Typography>
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                    {todosDocumentos.slice(0, 3).map((doc, idx) => doc.nombre).join(', ')}
                    {todosDocumentos.length > 3 && ` y ${todosDocumentos.length - 3} mas...`}
                  </Typography>
                </Box>
              );
            }
            return null;
          })()}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setOpenExportDialog(false)}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (selectedActivoDetail) {
                const evaluacionEstado = getEvaluacionEstado(selectedActivoDetail);
                if (evaluacionEstado.evaluacion) {
                  exportarResumenPDF(evaluacionEstado.evaluacion, selectedActivoDetail, incluirAnexos);
                  setOpenExportDialog(false);
                }
              }
            }}
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={isExportando}
            sx={{ 
              borderRadius: '8px',
              backgroundColor: '#10B981',
              '&:hover': {
                backgroundColor: '#059669',
              }
            }}
          >
            {isExportando ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskAssessmentWizard;
