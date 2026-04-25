import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Paper,
  Tooltip,
  IconButton,
  Alert,
  Fade,
  Stack,
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import JustificationSuggestions from '../predictive/JustificationSuggestions';
import '../../styles/design-system.css';

interface InherentEvaluationStepProps {
  data: {
    probabilidad: string;
    impacto: string;
    nivelRiesgo: string;
    justificacion: string;
  };
  onUpdate: (data: {
    probabilidad: string;
    impacto: string;
    nivelRiesgo: string;
    justificacion: string;
  }) => void;
  // Props opcionales para sugerencias de normatividad
  amenaza?: string;
  controles?: string[];
}

interface LevelDefinition {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  examples: string[];
}

const InherentEvaluationStep: React.FC<InherentEvaluationStepProps> = ({
  data,
  onUpdate,
  amenaza = '',
  controles = []
}) => {
  const [currentStep, setCurrentStep] = useState<'probability' | 'impact' | 'justification'>('probability');
  const [probabilityValue, setProbabilityValue] = useState(0);
  const [impactValue, setImpactValue] = useState(0);
  const [justification, setJustification] = useState(data.justificacion || '');

  // Definiciones de niveles con contexto
  const probabilityLevels: LevelDefinition[] = [
    {
      value: 'Frecuente',
      label: 'Frecuente',
      description: 'Ocurre varias veces al ano',
      color: '#EF4444',
      icon: <WarningIcon />,
      examples: ['Fallas diarias de sistema', 'Ataques de phishing semanales', 'Errores de usuario frecuentes']
    },
    {
      value: 'Probable',
      label: 'Probable',
      description: 'Ocurre al menos una vez al ano',
      color: '#F59E0B',
      icon: <TrendingUpIcon />,
      examples: ['Fallas mensuales', 'Incidentes de seguridad trimestrales', 'Errores de configuracion']
    },
    {
      value: 'Ocasional',
      label: 'Ocasional',
      description: 'Ocurre cada 2-3 anos',
      color: '#F59E0B',
      icon: <InfoIcon />,
      examples: ['Fallas de hardware', 'Ataques dirigidos', 'Errores de software criticos']
    },
    {
      value: 'Posible',
      label: 'Posible',
      description: 'Ocurre cada 5-10 anos',
      color: '#10B981',
      icon: <CheckCircleIcon />,
      examples: ['Desastres naturales', 'Ataques avanzados', 'Fallas de infraestructura']
    },
    {
      value: 'Improbable',
      label: 'Improbable',
      description: 'Muy raro, menos de una vez cada 10 anos',
      color: '#10B981',
      icon: <CheckCircleIcon />,
      examples: ['Ataques de estado', 'Desastres catastroficos', 'Fallas multiples simultaneas']
    }
  ];

  const impactLevels: LevelDefinition[] = [
    {
      value: 'Insignificante',
      label: 'Insignificante',
      description: 'Sin impacto significativo en la operacion',
      color: '#10B981',
      icon: <CheckCircleIcon />,
      examples: ['Interrupcion menor', 'Perdida de datos no criticos', 'Retraso minimo']
    },
    {
      value: 'Menor',
      label: 'Menor',
      description: 'Impacto limitado, recuperacion rapida',
      color: '#10B981',
      icon: <CheckCircleIcon />,
      examples: ['Interrupcion de horas', 'Perdida de datos recuperables', 'Retraso de dias']
    },
    {
      value: 'Moderado',
      label: 'Moderado',
      description: 'Impacto significativo pero manejable',
      color: '#F59E0B',
      icon: <WarningIcon />,
      examples: ['Interrupcion de dias', 'Perdida de datos parcial', 'Retraso de semanas']
    },
    {
      value: 'Mayor',
      label: 'Mayor',
      description: 'Impacto severo en operaciones criticas',
      color: '#EF4444',
      icon: <WarningIcon />,
      examples: ['Interrupcion de semanas', 'Perdida de datos importantes', 'Retraso de meses']
    },
    {
      value: 'Catastrofico',
      label: 'Catastrofico',
      description: 'Perdida total o impacto critico',
      color: '#EF4444',
      icon: <WarningIcon />,
      examples: ['Perdida total del activo', 'Interrupcion permanente', 'Impacto legal severo']
    }
  ];

  // Funcion para calcular el nivel de riesgo
  const calculateRiskLevel = (prob: string, imp: string): string => {
    const probIndex = probabilityLevels.findIndex(p => p.value === prob);
    const impIndex = impactLevels.findIndex(i => i.value === imp);
    
    if (probIndex === -1 || impIndex === -1) return 'LOW';
    
    // Matriz de riesgo (probabilidad x impacto)
    // Orden: Insignificante, Menor, Moderado, Mayor, Catastrofico
    const riskMatrix = [
      ['MEDIUM', 'HIGH', 'HIGH', 'HIGH', 'HIGH'],      // Frecuente
      ['MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'HIGH'],    // Probable
      ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH'],     // Ocasional
      ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH'],      // Posible
      ['LOW', 'LOW', 'LOW', 'MEDIUM', 'MEDIUM']        // Improbable
    ];
    
    return riskMatrix[probIndex][impIndex];
  };

  // Funcion para obtener el color del nivel de riesgo
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Funcion para obtener el texto del nivel de riesgo
  const getRiskText = (level: string): string => {
    switch (level) {
      case 'LOW': return 'BAJO';
      case 'MEDIUM': return 'MEDIO';
      case 'HIGH': return 'ALTO';
      default: return 'NO DEFINIDO';
    }
  };

  // Efectos para sincronizar con datos externos
  useEffect(() => {
    const probIndex = probabilityLevels.findIndex(p => p.value === data.probabilidad);
    const impIndex = impactLevels.findIndex(i => i.value === data.impacto);
    setProbabilityValue(probIndex >= 0 ? probIndex : 0);
    setImpactValue(impIndex >= 0 ? impIndex : 0);
    setJustification(data.justificacion || '');
  }, [data]);

  // Actualizar datos cuando cambian los valores (solo probabilidad e impacto, no justificación)
  useEffect(() => {
    if (probabilityValue >= 0 && impactValue >= 0) {
      const selectedProb = probabilityLevels[probabilityValue];
      const selectedImp = impactLevels[impactValue];
      const riskLevel = calculateRiskLevel(selectedProb.value, selectedImp.value);
      
      onUpdate({
        probabilidad: selectedProb.value,
        impacto: selectedImp.value,
        nivelRiesgo: riskLevel,
        justificacion: justification
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probabilityValue, impactValue]);

  const handleProbabilityChange = (event: Event, newValue: number | number[]) => {
    setProbabilityValue(newValue as number);
    setCurrentStep('impact');
  };

  const handleImpactChange = (event: Event, newValue: number | number[]) => {
    setImpactValue(newValue as number);
    setCurrentStep('justification');
  };

  const handleJustificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setJustification(newValue);
    // Actualizar inmediatamente sin esperar al useEffect para evitar bucles
    if (probabilityValue >= 0 && impactValue >= 0) {
      const selectedProb = probabilityLevels[probabilityValue];
      const selectedImp = impactLevels[impactValue];
      const riskLevel = calculateRiskLevel(selectedProb.value, selectedImp.value);
      
      onUpdate({
        probabilidad: selectedProb.value,
        impacto: selectedImp.value,
        nivelRiesgo: riskLevel,
        justificacion: newValue
      });
    }
  };

  const selectedProbability = probabilityLevels[probabilityValue];
  const selectedImpact = impactLevels[impactValue];
  const currentRiskLevel = calculateRiskLevel(selectedProbability?.value || '', selectedImpact?.value || '');

  return (
    <Box>
      {/* Header con progreso */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 1 }}>
          evaluación Inherente del Riesgo
        </Typography>
        
        {/* Indicador de pasos */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Chip
            label="1. Probabilidad"
            color={currentStep === 'probability' ? 'primary' : 'default'}
            variant={currentStep === 'probability' ? 'filled' : 'outlined'}
            onClick={() => setCurrentStep('probability')}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="2. Impacto"
            color={currentStep === 'impact' ? 'primary' : 'default'}
            variant={currentStep === 'impact' ? 'filled' : 'outlined'}
            onClick={() => setCurrentStep('impact')}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="3. justificación"
            color={currentStep === 'justification' ? 'primary' : 'default'}
            variant={currentStep === 'justification' ? 'filled' : 'outlined'}
            onClick={() => setCurrentStep('justification')}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Panel Principal - evaluación Paso a Paso */}
        <Grid  size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 2.5, pt: 2.5, minHeight: '400px' }}>
              <Box>
                {/* Paso 1: Probabilidad */}
                {currentStep === 'probability' && (
                <Fade in={true}>
                <Box>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                    Paso 1: ¿Con que frecuencia puede ocurrir este riesgo?
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Slider
                      value={probabilityValue}
                      onChange={handleProbabilityChange}
                      min={0}
                      max={probabilityLevels.length - 1}
                      step={1}
                      marks={probabilityLevels.map((_, index) => ({
                        value: index,
                        label: probabilityLevels[index].label
                      }))}
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 24,
                          height: 24,
                          backgroundColor: '#1E3A8A',
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: '#1E3A8A',
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: '#E5E7EB',
                        },
                      }}
                    />
                  </Box>

                  {selectedProbability && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: '12px',
                        backgroundColor: '#F0F9FF',
                        border: `2px solid ${selectedProbability.color}20`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: selectedProbability.color }}>
                          {selectedProbability.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" className="font-poppins" sx={{ fontWeight: 600 }}>
                            {selectedProbability.label}
                          </Typography>
                          <Typography variant="body2" className="font-roboto">
                            {selectedProbability.description}
                          </Typography>
                          <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', mt: 1, display: 'block' }}>
                            Ejemplos: {selectedProbability.examples.join(', ')}
                          </Typography>
                        </Box>
                      </Box>
                    </Alert>
                  )}
                </Box>
              </Fade>
              )}

              {/* Paso 2: Impacto */}
              {currentStep === 'impact' && (
              <Fade in={true}>
                <Box>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>
                    Paso 2: ¿Cual seria el impacto si ocurriera?
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Slider
                      value={impactValue}
                      onChange={handleImpactChange}
                      min={0}
                      max={impactLevels.length - 1}
                      step={1}
                      marks={impactLevels.map((_, index) => ({
                        value: index,
                        label: impactLevels[index].label
                      }))}
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 24,
                          height: 24,
                          backgroundColor: '#1E3A8A',
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: '#1E3A8A',
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: '#E5E7EB',
                        },
                      }}
                    />
                  </Box>

                  {selectedImpact && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: '12px',
                        backgroundColor: '#F0F9FF',
                        border: `2px solid ${selectedImpact.color}20`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: selectedImpact.color }}>
                          {selectedImpact.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" className="font-poppins" sx={{ fontWeight: 600 }}>
                            {selectedImpact.label}
                          </Typography>
                          <Typography variant="body2" className="font-roboto">
                            {selectedImpact.description}
                          </Typography>
                          <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', mt: 1, display: 'block' }}>
                            Ejemplos: {selectedImpact.examples.join(', ')}
                          </Typography>
                        </Box>
                      </Box>
                    </Alert>
                  )}
                </Box>
              </Fade>
              )}

              {/* Paso 3: justificación */}
              {currentStep === 'justification' && (
              <Fade in={true}>
                <Box>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 1.5 }}>
                    Paso 3: Justifica tu evaluación
                  </Typography>
                  
                  {/* Sugerencias de normatividad ISO - Foco principal */}
                  {(amenaza || controles.length > 0) && (
                    <Box sx={{ mb: 2 }}>
                      <JustificationSuggestions
                        riskType={amenaza || 'Riesgo de seguridad'}
                        controls={controles}
                        onJustificationSelect={(justificationText) => {
                          const newJustification = justification
                            ? `${justification}\n\n${justificationText}`
                            : justificationText;
                          setJustification(newJustification);
                          if (probabilityValue >= 0 && impactValue >= 0) {
                            const selectedProb = probabilityLevels[probabilityValue];
                            const selectedImp = impactLevels[impactValue];
                            const riskLevel = calculateRiskLevel(selectedProb.value, selectedImp.value);
                            onUpdate({
                              probabilidad: selectedProb.value,
                              impacto: selectedImp.value,
                              nivelRiesgo: riskLevel,
                              justificacion: newJustification
                            });
                          }
                        }}
                      />
                    </Box>
                  )}
                  
                  {/* Campo de texto para justificación */}
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={justification}
                    onChange={handleJustificationChange}
                    placeholder="Explica por que seleccionaste estos niveles de probabilidad e impacto. Incluye evidencia, datos historicos, o analisis que respalde tu evaluación. Puedes usar las sugerencias de normatividad ISO arriba..."
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
                  
                  <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', mt: 1, display: 'block' }}>
                    💡 Tip: Usa las sugerencias de normatividad ISO arriba para crear una justificación solida basada en estandares reconocidos.
                  </Typography>
                </Box>
              </Fade>
              )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Lateral - Resultado y Referencia */}
        <Grid  size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Resultado en Tiempo Real */}
            <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 3 }}>
                  Resultado de la evaluación
                </Typography>
                
                {selectedProbability && selectedImpact ? (
                  <Box>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: '12px', 
                      backgroundColor: `${getRiskColor(currentRiskLevel)}20`,
                      border: `2px solid ${getRiskColor(currentRiskLevel)}`,
                      textAlign: 'center',
                      mb: 3
                    }}>
                      <Typography variant="h4" className="font-poppins" sx={{ 
                        color: getRiskColor(currentRiskLevel),
                        fontWeight: 700,
                        mb: 1
                      }}>
                        {getRiskText(currentRiskLevel)}
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        Nivel de Riesgo Inherente
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#374151', mb: 1 }}>
                        Probabilidad: {selectedProbability.label}
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280', mb: 2 }}>
                        {selectedProbability.description}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" className="font-poppins" sx={{ color: '#374151', mb: 1 }}>
                        Impacto: {selectedImpact.label}
                      </Typography>
                      <Typography variant="body2" className="font-roboto" sx={{ color: '#6B7280' }}>
                        {selectedImpact.description}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" className="font-roboto" sx={{ color: '#6B7280' }}>
                      Completa la evaluación para ver el resultado
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Matriz de Referencia Mejorada */}
            <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A' }}>
                    Matriz de Riesgo
                  </Typography>
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          ¿Como usar esta matriz?
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>1. Visualizacion:</strong> Cada celda muestra el nivel de riesgo resultante de combinar probabilidad (filas) e impacto (columnas).
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>2. Seleccion rapida:</strong> Haz clic en cualquier celda para seleccionar esa combinacion directamente.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>3. Interpretacion:</strong> Los colores indican la criticidad: Verde (Bajo), Naranja (Medio), Rojo (Alto).
                        </Typography>
                        <Typography variant="body2">
                          <strong>4. Referencia:</strong> Úsala para validar tu evaluación o para seleccion rapida si ya conoces los valores.
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="left"
                  >
                    <IconButton size="small" sx={{ color: '#1E3A8A' }}>
                      <HelpIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Alert severity="info" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.75rem' }}>
                  <Typography variant="caption" className="font-roboto">
                    <strong>Tip:</strong> Haz clic en cualquier celda para seleccionar esa combinacion de probabilidad e impacto. La celda resaltada muestra tu seleccion actual.
                  </Typography>
                </Alert>
                
                <Box sx={{ fontSize: '0.75rem' }}>
                  {/* Encabezado de columnas (Impacto) */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', gap: 0.5, mb: 1 }}>
                    <Box></Box>
                    {impactLevels.map((level, index) => (
                      <Tooltip
                        key={`impact-header-${level.value}-${index}`}
                        title={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {level.label}
                            </Typography>
                            <Typography variant="body2">{level.description}</Typography>
                            {level.examples.length > 0 && (
                              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                Ej: {level.examples[0]}
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                      >
                        <Typography 
                          variant="caption" 
                          className="font-roboto" 
                          sx={{ 
                            textAlign: 'center', 
                            fontWeight: 600,
                            color: '#374151',
                            cursor: 'help',
                            fontSize: '0.7rem',
                            lineHeight: 1.2
                          }}
                        >
                          {level.label}
                        </Typography>
                      </Tooltip>
                    ))}
                  </Box>
                  
                  {/* Filas de probabilidad */}
                  {probabilityLevels.map((probLevel, probIndex) => (
                    <Box key={`prob-row-${probLevel.value}-${probIndex}`} sx={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', gap: 0.5, mb: 0.5 }}>
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {probLevel.label}
                            </Typography>
                            <Typography variant="body2">{probLevel.description}</Typography>
                            {probLevel.examples.length > 0 && (
                              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                Ej: {probLevel.examples[0]}
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                        placement="left"
                      >
                        <Typography 
                          variant="caption" 
                          className="font-roboto" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'help',
                            fontSize: '0.7rem',
                            lineHeight: 1.2
                          }}
                        >
                          {probLevel.label}
                        </Typography>
                      </Tooltip>
                      {impactLevels.map((impLevel, impIndex) => {
                        const riskLevel = calculateRiskLevel(probLevel.value, impLevel.value);
                        const isSelected = selectedProbability?.value === probLevel.value && selectedImpact?.value === impLevel.value;
                        const riskText = getRiskText(riskLevel);
                        const riskColor = getRiskColor(riskLevel);
                        
                        // Obtener recomendacion segun el nivel
                        const getRecommendation = (level: string) => {
                          switch(level) {
                            case 'HIGH':
                              return 'Accion inmediata requerida';
                            case 'MEDIUM':
                              return 'Monitoreo y plan de mitigacion';
                            case 'LOW':
                              return 'Aceptable con monitoreo';
                            default:
                              return '';
                          }
                        };
                        
                        return (
                          <Tooltip
                            key={`cell-tooltip-${probLevel.value}-${impLevel.value}`}
                            title={
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  Riesgo {riskText}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Probabilidad:</strong> {probLevel.label}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Impacto:</strong> {impLevel.label}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  display: 'block', 
                                  mt: 1, 
                                  pt: 1, 
                                  borderTop: '1px solid rgba(255,255,255,0.2)',
                                  fontStyle: 'italic'
                                }}>
                                  {getRecommendation(riskLevel)}
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Box
                              sx={{
                                width: '100%',
                                minHeight: 32,
                                backgroundColor: riskColor,
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: isSelected ? '3px solid #1E3A8A' : '2px solid rgba(255,255,255,0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                boxShadow: isSelected ? '0 4px 12px rgba(30, 58, 138, 0.3)' : 'none',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  zIndex: 1
                                }
                              }}
                              onClick={() => {
                                setProbabilityValue(probIndex);
                                setImpactValue(impIndex);
                                setCurrentStep('justification');
                              }}
                            >
                              <Typography variant="caption" sx={{ 
                                color: 'white', 
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}>
                                {riskText}
                              </Typography>
                              {isSelected && (
                                <Box sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  backgroundColor: '#1E3A8A',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid white',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                  <CheckCircleIcon sx={{ fontSize: 12, color: 'white' }} />
                                </Box>
                              )}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
                
                {/* Leyenda mejorada */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E5E7EB' }}>
                  <Typography variant="caption" className="font-roboto" sx={{ fontWeight: 600, color: '#374151', mb: 1, display: 'block' }}>
                    Niveles de Riesgo:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 16, height: 16, backgroundColor: '#10B981', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" className="font-roboto" sx={{ fontWeight: 600 }}>Bajo</Typography>
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', fontSize: '0.65rem' }}>
                          Riesgo aceptable, monitoreo rutinario
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 16, height: 16, backgroundColor: '#F59E0B', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" className="font-roboto" sx={{ fontWeight: 600 }}>Medio</Typography>
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', fontSize: '0.65rem' }}>
                          Requiere plan de mitigacion y monitoreo
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 16, height: 16, backgroundColor: '#EF4444', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}></Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" className="font-roboto" sx={{ fontWeight: 600 }}>Alto</Typography>
                        <Typography variant="caption" className="font-roboto" sx={{ color: '#6B7280', display: 'block', fontSize: '0.65rem' }}>
                          Accion inmediata requerida, prioridad alta
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InherentEvaluationStep;





