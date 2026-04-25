import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as WordIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import type { DocumentoAdjunto } from '../../services/documentos';
import { documentosService } from '../../services/documentos';

interface DocumentManagerProps {
  accionId: string;
  documentos: DocumentoAdjunto[];
  onDocumentosChange: (documentos: DocumentoAdjunto[]) => void;
  disabled?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  accionId,
  documentos,
  onDocumentosChange,
  disabled = false
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError('');
      
      // Validar tipo de archivo
      if (!documentosService.validarTipoArchivo(file)) {
        setError('Tipo de archivo no permitido. Solo se permiten PDF, Word, Excel, imagenes y archivos de texto.');
        return;
      }

      // Validar tamano
      if (!documentosService.validarTamanoArchivo(file)) {
        setError('El archivo es demasiado grande. El tamano maximo permitido es 10MB.');
        return;
      }

      setArchivoSeleccionado(file);
      setOpenDialog(true);
    }
  };

  const handleSubirDocumento = async () => {
    if (!archivoSeleccionado) return;

    setSubiendo(true);
    setError('');

    try {
      // Simular subida de documento (en produccion se conectaria con el backend)
      const nuevoDocumento: DocumentoAdjunto = {
        id: Date.now().toString(),
        nombre: archivoSeleccionado.name,
        tipo: archivoSeleccionado.type,
        tamano: archivoSeleccionado.size,
        url: URL.createObjectURL(archivoSeleccionado), // En produccion seria la URL real
        fechaSubida: new Date().toISOString(),
        descripcion: descripcion || undefined
      };

      // Agregar a la lista de documentos
      onDocumentosChange([...documentos, nuevoDocumento]);

      // Limpiar formulario
      setArchivoSeleccionado(null);
      setDescripcion('');
      setOpenDialog(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError('Error al subir el documento. Intentalo de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminarDocumento = (documentoId: string) => {
    onDocumentosChange(documentos.filter(doc => doc.id !== documentoId));
  };

  const handleDescargarDocumento = async (documento: DocumentoAdjunto) => {
    try {
      // En produccion, esto descargaria el archivo real
      const link = document.createElement('a');
      link.href = documento.url;
      link.download = documento.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar documento:', error);
    }
  };

  const obtenerIconoDocumento = (tipo: string) => {
    if (tipo.includes('pdf')) return <PdfIcon sx={{ color: '#DC2626' }} />;
    if (tipo.includes('word') || tipo.includes('document')) return <WordIcon sx={{ color: '#2563EB' }} />;
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return <ExcelIcon sx={{ color: '#059669' }} />;
    if (tipo.includes('image')) return <ImageIcon sx={{ color: '#7C3AED' }} />;
    return <FileIcon sx={{ color: '#6B7280' }} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A' }}>
          Documentos de Evidencia
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AttachFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          sx={{ borderRadius: '8px' }}
        >
          Adjuntar Documento
        </Button>
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {documentos.length === 0 ? (
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            border: '2px dashed #E5E7EB',
            borderRadius: '8px',
            backgroundColor: '#F9FAFB'
          }}
        >
          <DescriptionIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 1 }} />
          <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
            No hay documentos adjuntos
          </Typography>
          <Typography variant="caption" className="font-roboto" sx={{ color: '#9CA3AF' }}>
            Haz clic en "Adjuntar Documento" para agregar evidencia
          </Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          {documentos.map((documento, index) => (
            <React.Fragment key={documento.id}>
              <ListItem sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {obtenerIconoDocumento(documento.tipo)}
                </Box>
                <ListItemText
                  primary={
                    <Typography variant="body1" className="font-roboto" sx={{ fontWeight: 500 }}>
                      {documento.nombre}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280' }}>
                        {documentosService.formatearTamano(documento.tamano)} • 
                        {new Date(documento.fechaSubida).toLocaleDateString()}
                      </Typography>
                      {documento.descripcion && (
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block' }}>
                          {documento.descripcion}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleDescargarDocumento(documento)}
                      size="small"
                      sx={{ color: '#1E3A8A' }}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEliminarDocumento(documento.id)}
                      size="small"
                      sx={{ color: '#EF4444' }}
                      disabled={disabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < documentos.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Dialog para agregar descripcion */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-poppins" sx={{ color: '#1E3A8A' }}>
          Adjuntar Documento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
              Archivo seleccionado:
            </Typography>
            <Chip
              label={archivoSeleccionado?.name}
              icon={obtenerIconoDocumento(archivoSeleccionado?.type || '')}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Descripcion del documento (opcional)"
              multiline
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el contenido o proposito de este documento..."
              sx={{ borderRadius: '8px' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={subiendo}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubirDocumento}
            variant="contained"
            disabled={subiendo}
            sx={{ borderRadius: '8px' }}
          >
            {subiendo ? 'Subiendo...' : 'Adjuntar'}
          </Button>
        </DialogActions>
      </Dialog>

      {subiendo && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', mt: 1 }}>
            Subiendo documento...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DocumentManager;
