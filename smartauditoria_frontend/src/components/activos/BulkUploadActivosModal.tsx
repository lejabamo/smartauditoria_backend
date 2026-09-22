import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  AutoAwesome as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  TableChart as ExcelIcon,
  ArrowForward as ArrowForwardIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { activosService } from '../../services/activos';

interface BulkUploadActivosModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkUploadActivosModal: React.FC<BulkUploadActivosModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enriquecerConIa, setEnriquecerConIa] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [enrichmentSummary, setEnrichmentSummary] = useState<{ total: number; enriquecidos: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setEnrichmentSummary(null);
    setIsProcessing(false);
    setIsSaving(false);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    try {
      // 1. Enviar al backend en modo DRY_RUN (preview) con enriquecimiento IA
      const res = await activosService.bulkUploadActivos({
        file,
        enriquecerConIa,
        dryRun: true,
      });

      if (res.activos_procesados && res.activos_procesados.length > 0) {
        setPreviewData(res.activos_procesados);
        setEnrichmentSummary({
          total: res.total_filas,
          enriquecidos: res.enriquecidos_por_ia || 0,
        });
        toast.success(`Archivo procesado: ${res.total_filas} activos detectados.`);
      } else {
        toast.error('No se detectaron registros válidos en el archivo.');
      }
    } catch (err: any) {
      console.error('Error previsualizando archivo:', err);
      toast.error(err.response?.data?.error || 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.length === 0) return;
    setIsSaving(true);
    try {
      const res = await activosService.bulkUploadActivos({
        activos: previewData,
        enriquecerConIa: false, // Ya fueron enriquecidos en el preview
        dryRun: false,
      });

      toast.success(`¡Éxito! Se crearon ${res.total_creados} activos en el inventario.`);
      onSuccess();
      handleModalClose();
    } catch (err: any) {
      console.error('Error guardando activos:', err);
      toast.error(err.response?.data?.error || 'Error al guardar activos');
    } finally {
      setIsSaving(false);
    }
  };

  const getCriticidadChipColor = (crit?: string) => {
    switch (crit?.toLowerCase()) {
      case 'crítico':
      case 'critico':
        return { bg: '#FEE2E2', color: '#991B1B', border: '#F87171' };
      case 'alto':
        return { bg: '#FEF3C7', color: '#92400E', border: '#FBBF24' };
      case 'medio':
        return { bg: '#E0E7FF', color: '#3730A3', border: '#818CF8' };
      default:
        return { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      {/* HEADER CON DEGRADADO CORPORATIVO */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
          color: '#ffffff',
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
              Carga Masiva Inteligente de Activos
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Guía Integral Función Pública V7 (2025) & Ley 1712 de Transparencia
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleModalClose} sx={{ color: '#ffffff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#F8FAFC' }}>
        {/* BARRA SUPERIOR DE OPCIONES Y DESCARGA DE PLANTILLA */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => activosService.downloadActivosTemplate()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#3B82F6',
              color: '#1E40AF',
              backgroundColor: '#EFF6FF',
              '&:hover': {
                backgroundColor: '#DBEAFE',
                borderColor: '#2563EB',
              },
            }}
          >
            Descargar Plantilla Oficial DAFP V7 (.xlsx)
          </Button>

          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enriquecerConIa}
                    onChange={(e) => setEnriquecerConIa(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <SparklesIcon sx={{ fontSize: 18, color: '#8B5CF6' }} />
                    <Typography variant="body2" fontWeight={600} color="#1E293B">
                      Enriquecimiento Automático con Copilot IA
                    </Typography>
                    <Tooltip title="Infiere automáticamente TRD, valoración CID, clasificación Ley 1712 y criticidad para filas incompletas.">
                      <Chip label="CAG & Agéntico" size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#EDE9FE', color: '#6D28D9' }} />
                    </Tooltip>
                  </Stack>
                }
              />
            </CardContent>
          </Card>
        </Box>

        {/* ZONA DE CARGA (DRAG & DROP) SI NO HAY ARCHIVO SELECCIONADO */}
        {!previewData && (
          <Box
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '2px dashed #94A3B8',
              borderRadius: 3,
              p: 6,
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: '#3B82F6',
                backgroundColor: '#F0F7FF',
              },
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />
            <ExcelIcon sx={{ fontSize: 56, color: '#10B981', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={600} color="#1E293B" gutterBottom>
              Arrastra tu archivo Excel (.xlsx) o CSV aquí
            </Typography>
            <Typography variant="body2" color="#64748B" sx={{ mb: 2 }}>
              o haz clic para explorar en tu equipo
            </Typography>
            <Chip
              label="Formatos soportados: .xlsx, .xls, .csv (Hasta 500 activos por lote)"
              size="small"
              variant="outlined"
              sx={{ color: '#64748B' }}
            />
          </Box>
        )}

        {/* BARRA DE PROGRESO DE CARGA O INFERENCIA */}
        {(isProcessing || isSaving) && (
          <Box sx={{ my: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <SparklesIcon sx={{ fontSize: 18, color: '#3B82F6', animation: 'spin 2s linear infinite' }} />
              <Typography variant="body2" fontWeight={600} color="#1E293B">
                {isProcessing
                  ? 'Analizando y enriqueciendo activos con el Auditor Copilot (DAFP V7)...'
                  : 'Registrando activos en base de datos MariaDB...'}
              </Typography>
            </Stack>
            <LinearProgress sx={{ borderRadius: 2, height: 8 }} />
          </Box>
        )}

        {/* TABLA DE PREVISUALIZACIÓN DE ACTIVOS ENRIQUECIDOS */}
        {previewData && (
          <Box sx={{ mt: 2 }}>
            {enrichmentSummary && (
              <Alert
                severity="info"
                icon={<SparklesIcon sx={{ color: '#8B5CF6' }} />}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  backgroundColor: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  color: '#4C1D95',
                }}
              >
                <strong>Previsualización Lista:</strong> Se procesaron{' '}
                <strong>{enrichmentSummary.total}</strong> activos.{' '}
                {enrichmentSummary.enriquecidos > 0 && (
                  <span>
                    El Copilot IA enriqueció <strong>{enrichmentSummary.enriquecidos}</strong> registros con
                    clasificación documental TRD, valoración CID y Ley 1712.
                  </span>
                )}
              </Alert>
            )}

            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 380,
                borderRadius: 2,
                border: '1px solid #E2E8F0',
                boxShadow: 'none',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>Nombre del Activo</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>Tipo / Subtipo</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>TRD & Proceso</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>CID (C/I/D)</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>Ley 1712</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>Criticidad</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F1F5F9' }}>Estado IA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((item, idx) => {
                    const critColors = getCriticidadChipColor(item.nivel_criticidad_negocio);
                    return (
                      <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#F8FAFC' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="#0F172A">
                            {item.Nombre}
                          </Typography>
                          <Typography variant="caption" color="#64748B" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                            {item.Descripcion}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.Tipo_Activo} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="#1E40AF">
                            {item.identificador_trd || 'Sin TRD'}
                          </Typography>
                          <Typography variant="caption" color="#64748B">
                            {item.proceso || 'No asignado'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontWeight={600}>
                            C:{item.Nivel_Clasificacion_Confidencialidad?.[0] || 'M'} | I:
                            {item.Nivel_Clasificacion_Integridad?.[0] || 'A'} | D:
                            {item.Nivel_Clasificacion_Disponibilidad?.[0] || 'M'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {item.es_clasificada_reservada ? (
                            <Chip label="Reservada" size="small" sx={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }} />
                          ) : (
                            <Chip label="Pública" size="small" sx={{ backgroundColor: '#E0F2FE', color: '#0369A1' }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.nivel_criticidad_negocio || 'Medio'}
                            size="small"
                            sx={{
                              backgroundColor: critColors.bg,
                              color: critColors.color,
                              border: `1px solid ${critColors.border}`,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.enriquecido_por_ia ? (
                            <Tooltip title={`Campos inferidos: ${item.campos_enriquecidos?.join(', ')}`}>
                              <Chip
                                icon={<SparklesIcon sx={{ fontSize: '14px !important', color: '#7C3AED !important' }} />}
                                label="Enriquecido IA"
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)',
                                  color: '#6D28D9',
                                  border: '1px solid #C4B5FD',
                                  fontWeight: 600,
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                              label="Completo"
                              size="small"
                              sx={{ backgroundColor: '#ECFDF5', color: '#047857' }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        {previewData ? (
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={() => {
              setPreviewData(null);
              setSelectedFile(null);
            }}
            disabled={isSaving}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cargar otro archivo
          </Button>
        ) : (
          <Button onClick={handleModalClose} disabled={isProcessing} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancelar
          </Button>
        )}

        {previewData && (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleConfirmImport}
            disabled={isSaving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)',
              },
            }}
          >
            {isSaving
              ? 'Guardando Activos...'
              : `Confirmar e Importar ${previewData.length} Activos`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadActivosModal;
