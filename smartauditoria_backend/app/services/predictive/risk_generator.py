"""
Generador inteligente de riesgos usando RAG
Analiza activos y contexto para generar riesgos relevantes y contextualizados
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from .vector_store import VectorStore
from .suggestion_service import PredictiveSuggestionService

logger = logging.getLogger(__name__)

@dataclass
class Riesgo:
    """Estructura de un riesgo generado"""
    id: str
    nombre: str
    descripcion: str
    amenaza_id: str
    vulnerabilidad_id: str
    probabilidad: float
    impacto: float
    nivel_riesgo: str
    activo_tipo: str
    contexto: Dict[str, Any]
    justificacion: str
    score_confianza: float

class RiskGenerator:
    """Generador inteligente de riesgos usando RAG"""
    
    def __init__(self, vector_store: VectorStore = None, 
                 suggestion_service: PredictiveSuggestionService = None):
        """
        Inicializar generador de riesgos
        
        Args:
            vector_store: Instancia de VectorStore para búsqueda semántica
            suggestion_service: Servicio de sugerencias para datos estructurados
        """
        self.vector_store = vector_store or VectorStore()
        self.suggestion_service = suggestion_service or PredictiveSuggestionService()
    
    def generar_riesgos(self, activo: Dict[str, Any], 
                       contexto_org: Dict[str, Any]) -> List[Riesgo]:
        """
        Generar riesgos relevantes para un activo dado
        
        Args:
            activo: Información del activo (tipo, nombre, descripción, etc.)
            contexto_org: Contexto organizacional (industria, tamaño, normativa, etc.)
        
        Returns:
            Lista de riesgos generados y contextualizados
        """
        logger.info(f"Generando riesgos para activo: {activo.get('nombre', 'N/A')}")
        
        # 1. Identificar amenazas relevantes
        amenazas = self._identificar_amenazas(activo, contexto_org)
        
        # 2. Identificar vulnerabilidades relevantes
        vulnerabilidades = self._identificar_vulnerabilidades(activo, contexto_org)
        
        # 3. Generar riesgos combinando amenazas y vulnerabilidades
        riesgos = []
        for amenaza in amenazas:
            for vulnerabilidad in vulnerabilidades:
                # Verificar si la combinación es relevante
                if self._es_combinacion_relevante(amenaza, vulnerabilidad, activo):
                    riesgo = self._construir_riesgo(
                        amenaza, vulnerabilidad, activo, contexto_org
                    )
                    if riesgo:
                        riesgos.append(riesgo)
        
        # 4. Priorizar y filtrar riesgos
        riesgos_priorizados = self._priorizar_riesgos(riesgos)
        
        logger.info(f"Generados {len(riesgos_priorizados)} riesgos relevantes")
        
        return riesgos_priorizados
    
    def _identificar_amenazas(self, activo: Dict[str, Any], 
                               contexto: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identificar amenazas relevantes usando RAG + JSON"""
        amenazas = []
        
        # Usar servicio de sugerencias para amenazas estructuradas
        tipo_activo = activo.get('tipo', '')
        amenazas_estructuradas = self.suggestion_service.suggest_threats_for_asset(
            asset_type=tipo_activo,
            context=contexto.get('descripcion', '')
        )
        
        # Enriquecer con información de RAG
        for amenaza_est in amenazas_estructuradas:
            # Buscar información adicional en base vectorial
            query = f"amenaza {amenaza_est.get('nombre', '')} {tipo_activo} {contexto.get('industria', '')}"
            resultados_rag = self.vector_store.search(query, top_k=3)
            
            # Combinar información estructurada + RAG
            amenaza_enriquecida = {
                **amenaza_est,
                'informacion_rag': resultados_rag,
                'descripcion_detallada': self._extraer_descripcion_detallada(resultados_rag)
            }
            amenazas.append(amenaza_enriquecida)
        
        return amenazas
    
    def _identificar_vulnerabilidades(self, activo: Dict[str, Any],
                                     contexto: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identificar vulnerabilidades relevantes"""
        vulnerabilidades = []
        
        tipo_activo = activo.get('tipo', '')
        
        # Buscar vulnerabilidades en base vectorial
        query = f"vulnerabilidad {tipo_activo} {contexto.get('industria', '')} seguridad"
        resultados_rag = self.vector_store.search(query, top_k=10)
        
        # Procesar y estructurar vulnerabilidades
        for resultado in resultados_rag:
            if 'vulnerabilidad' in resultado['text'].lower():
                vuln = {
                    'id': resultado['id'],
                    'nombre': self._extraer_nombre_vulnerabilidad(resultado['text']),
                    'descripcion': resultado['text'][:300],
                    'norma': resultado['metadata'].get('norma', 'N/A'),
                    'score': resultado['score']
                }
                vulnerabilidades.append(vuln)
        
        return vulnerabilidades
    
    def _es_combinacion_relevante(self, amenaza: Dict[str, Any],
                                  vulnerabilidad: Dict[str, Any],
                                  activo: Dict[str, Any]) -> bool:
        """Verificar si la combinación amenaza-vulnerabilidad es relevante"""
        # Lógica de relevancia
        # Por ejemplo: verificar que la vulnerabilidad puede ser explotada por la amenaza
        
        # Buscar en RAG si hay relación
        query = f"{amenaza.get('nombre', '')} explotar {vulnerabilidad.get('nombre', '')}"
        resultados = self.vector_store.search(query, top_k=2)
        
        # Si hay resultados relevantes (score > 0.6), es relevante
        if resultados and resultados[0]['score'] > 0.6:
            return True
        
        return False
    
    def _construir_riesgo(self, amenaza: Dict[str, Any],
                         vulnerabilidad: Dict[str, Any],
                         activo: Dict[str, Any],
                         contexto: Dict[str, Any]) -> Optional[Riesgo]:
        """Construir un riesgo completo"""
        try:
            # Calcular probabilidad e impacto
            probabilidad = self._calcular_probabilidad(amenaza, vulnerabilidad, activo, contexto)
            impacto = self._calcular_impacto(amenaza, vulnerabilidad, activo, contexto)
            
            # Determinar nivel de riesgo
            nivel_riesgo = self._determinar_nivel_riesgo(probabilidad, impacto)
            
            # Generar descripción contextualizada
            descripcion = self._generar_descripcion_riesgo(
                amenaza, vulnerabilidad, activo, contexto
            )
            
            # Generar justificación
            justificacion = self._generar_justificacion_riesgo(
                amenaza, vulnerabilidad, activo, contexto
            )
            
            # Calcular score de confianza
            score_confianza = self._calcular_confianza(amenaza, vulnerabilidad, activo)
            
            riesgo = Riesgo(
                id=f"R-{amenaza.get('id', 'UNK')}-{vulnerabilidad.get('id', 'UNK')}",
                nombre=f"Riesgo de {amenaza.get('nombre', 'Amenaza')} en {activo.get('nombre', 'Activo')}",
                descripcion=descripcion,
                amenaza_id=amenaza.get('id', ''),
                vulnerabilidad_id=vulnerabilidad.get('id', ''),
                probabilidad=probabilidad,
                impacto=impacto,
                nivel_riesgo=nivel_riesgo,
                activo_tipo=activo.get('tipo', ''),
                contexto=contexto,
                justificacion=justificacion,
                score_confianza=score_confianza
            )
            
            return riesgo
            
        except Exception as e:
            logger.error(f"Error al construir riesgo: {e}")
            return None
    
    def _calcular_probabilidad(self, amenaza: Dict[str, Any],
                              vulnerabilidad: Dict[str, Any],
                              activo: Dict[str, Any],
                              contexto: Dict[str, Any]) -> float:
        """Calcular probabilidad del riesgo (0.0 - 1.0)"""
        # Factores a considerar:
        # - Frecuencia de la amenaza
        # - Facilidad de explotación de la vulnerabilidad
        # - Exposición del activo
        # - Controles existentes
        
        base_prob = 0.5  # Probabilidad base
        
        # Ajustar según tipo de activo
        tipo_activo = activo.get('tipo', '').lower()
        if 'servidor' in tipo_activo or 'base_datos' in tipo_activo:
            base_prob += 0.1  # Más expuestos
        
        # Ajustar según industria
        industria = contexto.get('industria', '').lower()
        if 'financiera' in industria or 'salud' in industria:
            base_prob += 0.1  # Más atractivos para atacantes
        
        # Normalizar a rango [0, 1]
        return min(1.0, max(0.0, base_prob))
    
    def _calcular_impacto(self, amenaza: Dict[str, Any],
                          vulnerabilidad: Dict[str, Any],
                          activo: Dict[str, Any],
                          contexto: Dict[str, Any]) -> float:
        """Calcular impacto del riesgo (0.0 - 1.0)"""
        # Factores a considerar:
        # - Criticidad del activo
        # - Tipo de amenaza
        # - Sensibilidad de los datos
        
        base_impacto = 0.5
        
        # Ajustar según criticidad
        criticidad = activo.get('criticidad', 'media').lower()
        if criticidad == 'alta':
            base_impacto += 0.3
        elif criticidad == 'media':
            base_impacto += 0.1
        
        # Normalizar
        return min(1.0, max(0.0, base_impacto))
    
    def _determinar_nivel_riesgo(self, probabilidad: float, impacto: float) -> str:
        """Determinar nivel de riesgo basado en probabilidad e impacto"""
        riesgo_total = probabilidad * impacto
        
        if riesgo_total >= 0.7:
            return "ALTO"
        elif riesgo_total >= 0.4:
            return "MEDIO"
        else:
            return "BAJO"
    
    def _generar_descripcion_riesgo(self, amenaza: Dict[str, Any],
                                   vulnerabilidad: Dict[str, Any],
                                   activo: Dict[str, Any],
                                   contexto: Dict[str, Any]) -> str:
        """Generar descripción contextualizada del riesgo"""
        # Buscar información en RAG para enriquecer descripción
        query = f"riesgo {amenaza.get('nombre', '')} {vulnerabilidad.get('nombre', '')} {activo.get('tipo', '')}"
        resultados = self.vector_store.search(query, top_k=2)
        
        descripcion_base = f"El activo {activo.get('nombre', 'activo')} ({activo.get('tipo', 'tipo desconocido')}) "
        descripcion_base += f"está expuesto a la amenaza de {amenaza.get('nombre', 'amenaza desconocida')} "
        descripcion_base += f"debido a la vulnerabilidad de {vulnerabilidad.get('nombre', 'vulnerabilidad desconocida')}."
        
        # Enriquecer con información de RAG
        if resultados and resultados[0]['score'] > 0.6:
            info_rag = resultados[0]['text'][:200]
            descripcion_base += f" {info_rag}"
        
        return descripcion_base
    
    def _generar_justificacion_riesgo(self, amenaza: Dict[str, Any],
                                  vulnerabilidad: Dict[str, Any],
                                  activo: Dict[str, Any],
                                  contexto: Dict[str, Any]) -> str:
        """Generar justificación del riesgo"""
        # Buscar normativa y mejores prácticas
        query = f"evaluación riesgo {amenaza.get('nombre', '')} {contexto.get('normativa', 'ISO 27005')}"
        resultados = self.vector_store.search(query, top_k=3)
        
        justificacion = f"**Justificación del Riesgo:**\n\n"
        justificacion += f"Este riesgo ha sido identificado considerando:\n\n"
        justificacion += f"1. **Amenaza:** {amenaza.get('descripcion', amenaza.get('nombre', 'N/A'))}\n"
        justificacion += f"2. **Vulnerabilidad:** {vulnerabilidad.get('descripcion', vulnerabilidad.get('nombre', 'N/A'))}\n"
        justificacion += f"3. **Activo:** {activo.get('nombre', 'N/A')} ({activo.get('tipo', 'N/A')})\n\n"
        
        if resultados:
            justificacion += f"**Base Normativa:**\n"
            for i, resultado in enumerate(resultados, 1):
                norma = resultado['metadata'].get('norma', 'N/A')
                texto = resultado['text'][:150]
                justificacion += f"{i}. Según {norma}: {texto}...\n"
        
        return justificacion
    
    def _calcular_confianza(self, amenaza: Dict[str, Any],
                            vulnerabilidad: Dict[str, Any],
                            activo: Dict[str, Any]) -> float:
        """Calcular score de confianza en la generación del riesgo"""
        score = 0.5  # Base
        
        # Aumentar si hay información de RAG
        if amenaza.get('informacion_rag'):
            score += 0.2
        
        # Aumentar si la vulnerabilidad tiene buena descripción
        if vulnerabilidad.get('descripcion') and len(vulnerabilidad['descripcion']) > 50:
            score += 0.2
        
        # Aumentar si el activo tiene información completa
        if activo.get('tipo') and activo.get('nombre'):
            score += 0.1
        
        return min(1.0, score)
    
    def _priorizar_riesgos(self, riesgos: List[Riesgo]) -> List[Riesgo]:
        """Priorizar riesgos por nivel de riesgo y confianza"""
        # Ordenar por: nivel de riesgo (ALTO > MEDIO > BAJO) y luego por confianza
        def key_func(riesgo):
            nivel_order = {'ALTO': 3, 'MEDIO': 2, 'BAJO': 1}
            return (nivel_order.get(riesgo.nivel_riesgo, 0), riesgo.score_confianza)
        
        riesgos_ordenados = sorted(riesgos, key=key_func, reverse=True)
        
        # Filtrar riesgos con muy baja confianza
        riesgos_filtrados = [r for r in riesgos_ordenados if r.score_confianza > 0.3]
        
        return riesgos_filtrados
    
    def _extraer_descripcion_detallada(self, resultados_rag: List[Dict[str, Any]]) -> str:
        """Extraer descripción detallada de resultados RAG"""
        if not resultados_rag:
            return ""
        
        # Combinar los mejores resultados
        descripciones = []
        for resultado in resultados_rag[:2]:
            if resultado['score'] > 0.6:
                descripciones.append(resultado['text'][:200])
        
        return " ".join(descripciones)
    
    def _extraer_nombre_vulnerabilidad(self, texto: str) -> str:
        """Extraer nombre de vulnerabilidad del texto"""
        # Lógica simple: buscar patrones comunes
        texto_lower = texto.lower()
        
        if 'desactualizado' in texto_lower or 'actualización' in texto_lower:
            return "Software Desactualizado"
        elif 'configuración' in texto_lower or 'mal configurado' in texto_lower:
            return "Configuración Incorrecta"
        elif 'acceso' in texto_lower and 'no autorizado' in texto_lower:
            return "Acceso No Autorizado"
        else:
            # Extraer primeras palabras como nombre
            palabras = texto.split()[:5]
            return " ".join(palabras)


