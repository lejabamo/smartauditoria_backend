import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import type { AccionPlan, DocumentoAdjunto } from '../../services/documentos';

interface EditableActionPlanProps {
  actionItems: AccionPlan[];
  onActionItemsChange: (items: AccionPlan[]) => void;
  readOnly?: boolean;
}



const EditableActionPlan: React.FC<EditableActionPlanProps> = ({
  actionItems,
  onActionItemsChange,
  readOnly = false
}) => {
  const [editingItem, setEditingItem] = useState<AccionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<AccionPlan>>({
    titulo: '',
    descripcion: '',
    responsable: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'pendiente',
    prioridad: 'media',
    comentarios: '',
    documentos: []
  });

  const handleAddItem = () => {
    setEditingItem(null);
    setNewItem({
      titulo: '',
      descripcion: '',
      responsable: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'pendiente',
      prioridad: 'media',
      comentarios: '',
      documentos: []
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setNewItem({
        ...newItem,
        documentos: [...(newItem.documentos || []) as any[], ...fileArray]
      });
    }
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = (newItem.documentos || []).filter((_, i) => i !== index);
    setNewItem({
      ...newItem,
      documentos: updatedDocuments
    });
  };

  const handleEditItem = (item: AccionPlan) => {
    setEditingItem(item);
    setNewItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = actionItems.filter(item => item.id !== id);
    onActionItemsChange(updatedItems);
  };

  const handleSaveItem = () => {
    if (!newItem.titulo || !newItem.descripcion) {
      return;
    }

    const itemToSave: AccionPlan = {
      id: editingItem?.id || Date.now().toString(),
      titulo: newItem.titulo || '',
      descripcion: newItem.descripcion || '',
      responsable: newItem.responsable || '',
      fechaInicio: newItem.fechaInicio || '',
      fechaFin: newItem.fechaFin || '',
      estado: newItem.estado || 'pendiente',
      prioridad: newItem.prioridad || 'media',
      comentarios: newItem.comentarios || '',
      documentos: (newItem.documentos || []) as any[]
    };

    if (editingItem) {
      const updatedItems = actionItems.map(item => item.id === editingItem.id ? itemToSave : item
      );
      onActionItemsChange(updatedItems);
    } else {
      onActionItemsChange([...actionItems, itemToSave]);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completada': return '#4CAF50';
      case 'en_progreso': return '#2196F3';
      case 'pendiente': return '#FF9800';
      case 'cancelada': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return '#D32F2F';
      case 'alta': return '#F57C00';
      case 'media': return '#FFC107';
      case 'baja': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completada': return 'âœ…';
      case 'en_progreso': return 'ðŸ”„';
      case 'pendiente': return 'â³';
      case 'cancelada': return 'âŒ';
      default: return 'â“';
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <AssignmentIcon sx={{ color: '#1E3A8A', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
            ðŸ“‹ Plan de Accion
          </Typography>
        </Box>
        
        {!readOnly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            sx={{
              backgroundColor: '#1E3A8A',
              '&:hover': { backgroundColor: '#1E40AF' }
            }}
          >
            Agregar Accion
          </Button>
        )}
      </Box>

      {actionItems.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', backgroundColor: '#F8F9FA' }}>
          <Typography variant="body1" color="text.secondary">
            No hay acciones en el plan. {!readOnly && 'Haz clic en "Agregar Accion" para comenzar.'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {actionItems.map((item, index) => (
            <Grid key={`action-plan-item-${item.id || index}-${index}`} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
                      {getStatusIcon(item.estado)} {item.titulo}
                    </Typography>
                    
                    {!readOnly && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          sx={{ color: '#1E3A8A' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item.id)}
                          sx={{ color: '#F44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.descripcion}
                  </Typography>

                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    <Chip
                      label={item.estado.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(item.estado),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip
                      label={item.prioridad.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(item.prioridad),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    {item.responsable && (
                      <Grid  size={{ xs: 12 }}>
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Responsable:</strong> {item.responsable}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {(item.fechaInicio || item.fechaFin) && (
                      <Grid  size={{ xs: 12 }}>
                        <Box display="flex" alignItems="center">
                          <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Periodo:</strong> {item.fechaInicio} - {item.fechaFin}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {item.comentarios && (
                      <Grid  size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          <strong>Comentarios:</strong> {item.comentarios}
                        </Typography>
                      </Grid>
                    )}
                    
                    {item.documentos && item.documentos.length > 0 && (
                      <Grid  size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AttachFileIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Documentos:</strong> {item.documentos.length} archivo(s)
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {item.documentos.map((file: any, index: number) => {
                            const docUrl = file.url || file.id 
                              ? (file.url?.startsWith('http') 
                                  ? file.url 
                                  : `${window.location.origin}${file.url || `/api/documentos/descargar/${file.id}`}`)
                              : null;
                            const docNombre = file.nombre || file.nombre_original || file.name || `Documento ${index + 1}`;
                            
                            return (
                              <Box 
                                key={`doc-${item.id}-${file.id || file.name || index}`}
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  p: 1,
                                  borderRadius: '4px',
                                  border: '1px solid #E5E7EB',
                                  '&:hover': { backgroundColor: '#F3F4F6' }
                                }}
                              >
                                <AttachFileIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    flex: 1,
                                    color: docUrl ? '#1E3A8A' : '#6B7280',
                                    cursor: docUrl ? 'pointer' : 'default',
                                    textDecoration: docUrl ? 'underline' : 'none',
                                    '&:hover': docUrl ? { color: '#0F172A' } : {}
                                  }}
                                  onClick={() => {
                                    if (docUrl) {
                                      window.open(docUrl, '_blank');
                                    }
                                  }}
                                >
                                  {docNombre}
                                </Typography>
                                {docUrl && (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={() => window.open(docUrl, '_blank')}
                                      sx={{ color: '#1E3A8A' }}
                                      title="Ver en ventana emergente"
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(docUrl, {
                                            method: 'GET',
                                            headers: {
                                              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                                            }
                                          });
                                          if (response.ok) {
                                            const blob = await response.blob();
                                            const downloadUrl = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = downloadUrl;
                                            link.download = docNombre;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(downloadUrl);
                                          } else {
                                            window.open(docUrl, '_blank');
                                          }
                                        } catch (error) {
                                          console.error('Error descargando:', error);
                                          window.open(docUrl, '_blank');
                                        }
                                      }}
                                      sx={{ color: '#1E3A8A' }}
                                      title="Descargar documento"
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para editar/agregar accion */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar Accion' : 'Agregar Nueva Accion'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid  size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Titulo de la Accion"
                value={newItem.titulo || ''}
                onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
                required
              />
            </Grid>
            
            <Grid  size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripcion"
                value={newItem.descripcion || ''}
                onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
                required
              />
            </Grid>
            
            <Grid  size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Responsable"
                value={newItem.responsable || ''}
                onChange={(e) => setNewItem({ ...newItem, responsable: e.target.value })}
              />
            </Grid>
            
            <Grid  size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={newItem.prioridad || 'media'}
                  onChange={(e) => setNewItem({ ...newItem, prioridad: e.target.value as any })}
                  label="Prioridad"
                >
                  <MenuItem value="baja">Baja</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="critica">Critica</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid  size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Inicio"
                value={newItem.fechaInicio || ''}
                onChange={(e) => setNewItem({ ...newItem, fechaInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid  size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Finalizacion"
                value={newItem.fechaFin || ''}
                onChange={(e) => setNewItem({ ...newItem, fechaFin: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid  size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Comentarios"
                value={newItem.comentarios || ''}
                onChange={(e) => setNewItem({ ...newItem, comentarios: e.target.value })}
              />
            </Grid>
            
            <Grid  size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>
                ðŸ“Ž Documentos de Soporte
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ 
                      borderColor: '#1E3A8A',
                      color: '#1E3A8A',
                      '&:hover': {
                        borderColor: '#1E40AF',
                        backgroundColor: '#1E3A8A10'
                      }
                    }}
                  >
                    Adjuntar Documentos
                  </Button>
                </label>
              </Box>
              
              {newItem.documentos && newItem.documentos.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Documentos adjuntos:
                  </Typography>
                  {newItem.documentos && (newItem.documentos as any[]).map((file, index) => (
                    <Box key={`new-doc-${file.nombre || file.name || index}`} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 1,
                      border: '1px solid #E5E7EB',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: '#F9FAFB'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFileIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {file.nombre || file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          ({((file.tamano || file.size || 0) / 1024).toFixed(1)} KB)
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveDocument(index)}
                        sx={{ color: '#EF4444' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!newItem.titulo || !newItem.descripcion}
            sx={{ backgroundColor: '#1E3A8A' }}
          >
            {editingItem ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditableActionPlan;


