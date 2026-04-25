import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import {
  Security as SecurityIcon,
  CloudDone as AvailabilityIcon,
  VerifiedUser as IntegrityIcon
} from '@mui/icons-material';

interface CriticityCalculatorProps {
  onCriticityChange?: (criticity: {
    confidencialidad: number;
    disponibilidad: number;
    integridad: number;
    promedio: number;
    clasificacion: string;
  }) => void;
  initialValues?: {
    confidencialidad: number;
    disponibilidad: number;
    integridad: number;
  };
}

const CriticityCalculator: React.FC<CriticityCalculatorProps> = ({
  onCriticityChange,
  initialValues = { confidencialidad: 3, disponibilidad: 3, integridad: 3 }
}) => {
  const [values, setValues] = useState(initialValues);

  const calculateAverage = (c: number, d: number, i: number) => {
    return Math.round(((c + d + i) / 3) * 10) / 10;
  };

  const getClassification = (average: number) => {
    if (average >= 4.5) return { label: 'Muy Alta', color: '#D32F2F' };
    if (average >= 3.5) return { label: 'Alta', color: '#F57C00' };
    if (average >= 2.5) return { label: 'Media', color: '#FBC02D' };
    if (average >= 1.5) return { label: 'Baja', color: '#388E3C' };
    return { label: 'Muy Baja', color: '#4CAF50' };
  };

  const handleValueChange = (dimension: string, value: number) => {
    const newValues = { ...values, [dimension]: value };
    setValues(newValues);
    
    const promedio = calculateAverage(newValues.confidencialidad, newValues.disponibilidad, newValues.integridad);
    const clasificacion = getClassification(promedio);
    
    if (onCriticityChange) {
      onCriticityChange({
        confidencialidad: newValues.confidencialidad,
        disponibilidad: newValues.disponibilidad,
        integridad: newValues.integridad,
        promedio,
        clasificacion: clasificacion.label
      });
    }
  };

  const promedio = calculateAverage(values.confidencialidad, values.disponibilidad, values.integridad);
  const clasificacion = getClassification(promedio);

  const dimensions = [
    {
      key: 'confidencialidad',
      label: 'Confidencialidad',
      icon: <SecurityIcon />,
      description: 'Nivel de proteccion de la informacion confidencial'
    },
    {
      key: 'disponibilidad',
      label: 'Disponibilidad',
      icon: <AvailabilityIcon />,
      description: 'Nivel de acceso y disponibilidad del activo'
    },
    {
      key: 'integridad',
      label: 'Integridad',
      icon: <IntegrityIcon />,
      description: 'Nivel de integridad y precision de la informacion'
    }
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 3, textAlign: 'center' }}>
          ðŸ”¢ Calculo Automatico de Criticidad
        </Typography>
        
        <Grid container spacing={3}>
          {dimensions.map((dimension) => (
            <Grid key={dimension.key} size={{ xs: 12, md: 4 }}>
              <Box>
                <Box display="flex" alignItems="center" mb={2}>
                  {dimension.icon}
                  <Typography variant="h6" sx={{ ml: 1, color: '#1E3A8A' }}>
                    {dimension.label}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {dimension.description}
                </Typography>
                
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={values[dimension.key as keyof typeof values]}
                    onChange={(_, value) => handleValueChange(dimension.key, value as number)}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 2, label: '2' },
                      { value: 3, label: '3' },
                      { value: 4, label: '4' },
                      { value: 5, label: '5' }
                    ]}
                    sx={{
                      color: '#1E3A8A',
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#1E3A8A'
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: '#1E3A8A'
                      }
                    }}
                  />
                </Box>
                
                <Box display="flex" justifyContent="center" mt={1}>
                  <Chip
                    label={`Nivel ${values[dimension.key as keyof typeof values]}`}
                    color="primary"
                    size="small"
                  />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Resultado del calculo */}
        <Box sx={{ mt: 4, p: 3, backgroundColor: '#F8F9FA', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2, textAlign: 'center' }}>
            Resultado del Calculo
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid  size={{ xs: 12, md: 6 }}>
              <Box display="flex" justifyContent="center">
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ color: clasificacion.color, fontWeight: 'bold' }}>
                    {promedio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Promedio (1-5)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid  size={{ xs: 12, md: 6 }}>
              <Box display="flex" justifyContent="center">
                <Chip
                  label={clasificacion.label}
                  sx={{
                    backgroundColor: clasificacion.color,
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    px: 3,
                    py: 1
                  }}
                />
              </Box>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Formula:</strong> Criticidad = (Confidencialidad + Disponibilidad + Integridad) Ã· 3
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CriticityCalculator;








