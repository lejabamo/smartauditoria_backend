import sys

with open('src/pages/wizard/RiskAssessmentWizard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('case 3:')
end_idx = text.find('case 4:', start_idx)

if start_idx == -1 or end_idx == -1:
    print('Could not find case 3 or case 4')
    sys.exit(1)

case_3_code = """      case 3:
        return (
          <Box>
            <Typography variant="h6" className="font-poppins" sx={{ color: '#1E3A8A', mb: 2 }}>Selecciona los controles</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
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
                    } else {
                      toast.info(`El control ${controlNombre} ya estaba seleccionado`);
                    }
                  }}
                />
              </Grid>
              
              {wizardData.controles.seleccionados.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>Controles Seleccionados:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {wizardData.controles.seleccionados.map((control: string, index: number) => (
                      <Chip 
                        key={index} 
                        label={control} 
                        color="primary" 
                        onDelete={() => {
                          setWizardData(prev => ({
                            ...prev,
                            controles: {
                              ...prev.controles,
                              seleccionados: prev.controles.seleccionados.filter((c: string) => c !== control)
                            }
                          }));
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Card className="card" sx={{ mt: 2 }}>
                  <CardHeader 
                    title="Evaluación de Eficacia" 
                    subheader="Evalúa el impacto de los controles seleccionados en conjunto"
                    sx={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Eficacia General de los Controles</InputLabel>
                      <Select 
                        value={wizardData.controles.eficacia || ''} 
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
                    
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                      Sugerencias de Justificación (Asistencia IA)
                    </Typography>
                    <JustificationSuggestions
                      riskType={wizardData.newRiesgo.amenaza}
                      controls={wizardData.controles.seleccionados}
                      onJustificationSelect={(text) => {
                        setWizardData({
                          ...wizardData,
                          controles: {
                            ...wizardData.controles,
                            justificacion: wizardData.controles.justificacion 
                              ? `${wizardData.controles.justificacion}\n\n${text}`
                              : text
                          }
                        });
                      }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      sx={{ mt: 2 }}
                      label="Justificación de la Eficacia"
                      value={wizardData.controles.justificacion}
                      onChange={(e) => setWizardData({...wizardData, controles: {...wizardData.controles, justificacion: e.target.value}})}
                      placeholder="Explica por qué has seleccionado este nivel de eficacia..."
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

"""

new_text = text[:start_idx] + case_3_code + text[end_idx:]

with open('src/pages/wizard/RiskAssessmentWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Updated case 3 successfully')
