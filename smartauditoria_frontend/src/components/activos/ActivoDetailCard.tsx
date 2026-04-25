import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Computer as ComputerIcon,
  Storage as StorageIcon,
  Shield as ShieldIcon,
  Schedule as ScheduleIcon,
  Update as UpdateIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import '../../styles/design-system.css';

interface ActivoDetailCardProps {
  open: boolean;
  onClose: () => void;
  activo: any;
  onEdit?: () => void;
  onEvaluate?: () => void;
}

const ActivoDetailCard: React.FC<ActivoDetailCardProps> = ({
  open,
  onClose,
  activo,
  onEdit,
  onEvaluate
}) => {
  if (!activo) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critico':
      case 'critico':
        return '#DC2626';
      case 'alto':
        return '#D97706';
      case 'medio':
        return '#2563EB';
      case 'bajo':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'en produccion':
      case 'en produccion':
        return '#10B981';
      case 'planificado':
        return '#F59E0B';
      case 'en desarrollo':
        return '#3B82F6';
      case 'mantenimiento':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'hardware':
        return <ComputerIcon />;
      case 'software':
        return <StorageIcon />;
      case 'infraestructura':
        return <SecurityIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
          color: 'white',
          p: 4,
          borderRadius: '16px 16px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
            <Avatar sx={{ 
              width: 64, 
              height: 64,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}>
              {getTypeIcon(activo.Tipo_Activo || activo.tipo)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" className="font-poppins" sx={{ fontWeight: 600, mb: 1 }}>
                {activo.Nombre || activo.nombre || 'Sin nombre'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  label={activo.Tipo_Activo || activo.tipo || 'Sin tipo'}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {activo.Descripcion || activo.descripcion || 'Sin descripcion'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Informacion Basica */}
            <Grid  size={{ xs: 12, md: 6 }}>
              <Card sx={{ 
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ 
                    color: '#1E3A8A', 
                    fontWeight: 600, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <SecurityIcon sx={{ fontSize: 20 }} />
                    Informacion Basica
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        ID:
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
                        {activo.ID_Activo || activo.id || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Area:
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
                        {activo.Descripcion || activo.descripcion || 'No especificada'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Categoria:
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
                        {activo.subtipo_activo || 'No especificada'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Origen:
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
                        {activo.fuente_datos_principal || 'No especificado'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Clasificaciones */}
            <Grid  size={{ xs: 12, md: 6 }}>
              <Card sx={{ 
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ 
                    color: '#1E3A8A', 
                    fontWeight: 600, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ShieldIcon sx={{ fontSize: 20 }} />
                    Clasificaciones
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Confidencialidad:
                      </Typography>
                      <Chip
                        label={activo.Nivel_Clasificacion_Confidencialidad || 'No especificada'}
                        size="small"
                        sx={{
                          backgroundColor: '#E5E7EB',
                          color: '#374151',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Integridad:
                      </Typography>
                      <Chip
                        label={activo.Nivel_Clasificacion_Integridad || 'No especificada'}
                        size="small"
                        sx={{
                          backgroundColor: '#E5E7EB',
                          color: '#374151',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Disponibilidad:
                      </Typography>
                      <Chip
                        label={activo.Nivel_Clasificacion_Disponibilidad || 'No especificada'}
                        size="small"
                        sx={{
                          backgroundColor: '#E5E7EB',
                          color: '#374151',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Criticidad:
                      </Typography>
                      <Chip
                        label={activo.nivel_criticidad_negocio || 'No especificada'}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(activo.nivel_criticidad_negocio),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Estado y Fechas */}
            <Grid  size={{ xs: 12 }}>
              <Card sx={{ 
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ 
                    color: '#1E3A8A', 
                    fontWeight: 600, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ScheduleIcon sx={{ fontSize: 20 }} />
                    Estado y Fechas
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid  size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                          Estado Actual
                        </Typography>
                        <Chip
                          label={activo.estado_activo || activo.estado || 'No especificado'}
                          sx={{
                            backgroundColor: getStatusColor(activo.estado_activo || activo.estado),
                            color: 'white',
                            fontWeight: 500,
                            minWidth: '120px'
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid  size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                          Fecha Creacion
                        </Typography>
                        <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
                          {activo.fecha_creacion_registro ? 
                            new Date(activo.fecha_creacion_registro).toLocaleDateString('es-CO') : 
                            'No especificada'
                          }
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid  size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                          Ãšltima Actualizacion
                        </Typography>
                        <Typography variant="body2" className="font-roboto" sx={{ fontWeight: 500, color: '#374151' }}>
                          {activo.fecha_ultima_actualizacion_sgsi ? 
                            new Date(activo.fecha_ultima_actualizacion_sgsi).toLocaleDateString('es-CO') : 
                            'No especificada'
                          }
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid  size={{ xs: 12, md: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 1 }}>
                          Requiere Backup
                        </Typography>
                        <Chip
                          label={activo.requiere_backup ? 'Si' : 'No'}
                          size="small"
                          sx={{
                            backgroundColor: activo.requiere_backup ? '#10B981' : '#6B7280',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          p: 3, 
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ 
              borderRadius: '8px',
              borderColor: '#D1D5DB',
              color: '#6B7280',
              '&:hover': {
                borderColor: '#9CA3AF',
                backgroundColor: '#F9FAFB'
              }
            }}
          >
            Volver
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{ 
                  borderRadius: '8px',
                  borderColor: '#1E3A8A',
                  color: '#1E3A8A',
                  '&:hover': {
                    borderColor: '#1E40AF',
                    backgroundColor: '#F8FAFC'
                  }
                }}
              >
                Editar Activo
              </Button>
            )}
            
            {onEvaluate && (
              <Button
                onClick={onEvaluate}
                variant="contained"
                startIcon={<AssessmentIcon />}
                sx={{ 
                  borderRadius: '8px',
                  backgroundColor: '#1E3A8A',
                  '&:hover': {
                    backgroundColor: '#1E40AF',
                  }
                }}
              >
                Evaluar Activo
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ActivoDetailCard;
