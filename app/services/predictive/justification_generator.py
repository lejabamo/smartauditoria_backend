"""
Generador de justificaciones profesionales y contextualizadas
Usa RAG para enriquecer justificaciones con normativa y mejores prácticas
"""

import logging
from typing import Dict, Any, Optional, List

from .vector_store import VectorStore

logger = logging.getLogger(__name__)

class JustificationGenerator:
    """Generador de justificaciones profesionales usando RAG"""
    
    def __init__(self, vector_store: VectorStore = None):
        """
        Inicializar generador de justificaciones
        
        Args:
            vector_store: Instancia de VectorStore para búsqueda semántica
        """
        self.vector_store = vector_store or VectorStore()
    
    def generar_justificacion(self, control: Dict[str, Any],
                             riesgo: Dict[str, Any],
                             contexto: Dict[str, Any],
                             activo: Dict[str, Any] = None) -> str:
        """
        Generar justificación profesional para un control
        
        Args:
            control: Información del control (id, nombre, descripción)
            riesgo: Información del riesgo que se mitiga
            contexto: Contexto organizacional
            activo: Información del activo (opcional)
        
        Returns:
            Justificación completa y profesional
        """
        logger.info(f"Generando justificación para control: {control.get('id', 'N/A')}")
        
        # 1. Buscar información normativa
        info_normativa = self._buscar_normativa(control, riesgo)
        
        # 2. Buscar mejores prácticas
        mejores_practicas = self._buscar_mejores_practicas(control, contexto, activo)
        
        # 3. Buscar ejemplos similares
        ejemplos = self._buscar_ejemplos_similares(control, contexto)
        
        # 4. Construir justificación usando template
        justificacion = self._construir_justificacion(
            control=control,
            riesgo=riesgo,
            contexto=contexto,
            activo=activo,
            normativa=info_normativa,
            mejores_practicas=mejores_practicas,
            ejemplos=ejemplos
        )
        
        # 5. Validar y refinar
        justificacion_validada = self._validar_y_refinar(justificacion)
        
        return justificacion_validada
    
    def _buscar_normativa(self, control: Dict[str, Any],
                         riesgo: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Buscar información normativa relevante"""
        control_id = control.get('id', '')
        control_nombre = control.get('nombre', control.get('titulo', ''))
        
        # Buscar en base vectorial
        query = f"{control_id} {control_nombre} normativa ISO implementación"
        resultados = self.vector_store.search(query, top_k=5)
        
        # Filtrar por relevancia
        resultados_relevantes = [r for r in resultados if r['score'] > 0.6]
        
        return resultados_relevantes
    
    def _buscar_mejores_practicas(self, control: Dict[str, Any],
                                  contexto: Dict[str, Any],
                                  activo: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Buscar mejores prácticas para implementar el control"""
        control_nombre = control.get('nombre', control.get('titulo', ''))
        industria = contexto.get('industria', '')
        tipo_activo = activo.get('tipo', '') if activo else ''
        
        query = f"mejores prácticas implementar {control_nombre} {industria} {tipo_activo}"
        resultados = self.vector_store.search(query, top_k=3)
        
        return [r for r in resultados if r['score'] > 0.5]
    
    def _buscar_ejemplos_similares(self, control: Dict[str, Any],
                                   contexto: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Buscar ejemplos de implementación similares"""
        control_nombre = control.get('nombre', control.get('titulo', ''))
        industria = contexto.get('industria', '')
        
        query = f"ejemplo caso estudio {control_nombre} {industria} implementación"
        resultados = self.vector_store.search(query, top_k=2)
        
        return [r for r in resultados if r['score'] > 0.5]
    
    def _construir_justificacion(self, **kwargs) -> str:
        """Construir justificación usando template estructurado"""
        control = kwargs.get('control', {})
        riesgo = kwargs.get('riesgo', {})
        contexto = kwargs.get('contexto', {})
        activo = kwargs.get('activo', {})
        normativa = kwargs.get('normativa', [])
        mejores_practicas = kwargs.get('mejores_practicas', [])
        ejemplos = kwargs.get('ejemplos', [])
        
        # Template de justificación profesional
        justificacion = f"""**Justificación del Control {control.get('id', 'N/A')}: {control.get('nombre', control.get('titulo', 'N/A'))}**

## Contexto

El activo {activo.get('nombre', 'identificado')} ({activo.get('tipo', 'tipo de activo')}) está expuesto al riesgo de {riesgo.get('descripcion', riesgo.get('nombre', 'riesgo identificado'))}, el cual requiere la implementación de controles específicos para su mitigación.

## Base Normativa

"""
        
        # Agregar información normativa
        if normativa:
            for i, info in enumerate(normativa[:3], 1):
                norma = info['metadata'].get('norma', 'Normativa aplicable')
                texto = info['text'][:200]
                justificacion += f"{i}. **Según {norma}:**\n   {texto}...\n\n"
        else:
            justificacion += "Este control está alineado con las mejores prácticas de seguridad de la información establecidas en las normas ISO 27001 e ISO 27002.\n\n"
        
        # Agregar mejores prácticas
        if mejores_practicas:
            justificacion += "## Mejores Prácticas de Implementación\n\n"
            for i, practica in enumerate(mejores_practicas[:2], 1):
                texto = practica['text'][:150]
                justificacion += f"{i}. {texto}...\n\n"
        
        # Agregar beneficios esperados
        justificacion += "## Beneficios Esperados\n\n"
        justificacion += f"- **Reducción de probabilidad:** La implementación de este control reduce significativamente la probabilidad de materialización del riesgo identificado.\n"
        justificacion += f"- **Mitigación de impacto:** En caso de materialización, el impacto se verá reducido gracias a las medidas de control implementadas.\n"
        justificacion += f"- **Cumplimiento normativo:** Este control contribuye al cumplimiento de los requisitos establecidos en {contexto.get('normativa', 'las normas ISO aplicables')}.\n\n"
        
        # Agregar ejemplos si están disponibles
        if ejemplos:
            justificacion += "## Evidencia y Ejemplos\n\n"
            for i, ejemplo in enumerate(ejemplos[:2], 1):
                texto = ejemplo['text'][:150]
                justificacion += f"{i}. {texto}...\n\n"
        
        # Agregar recomendación
        justificacion += "## Recomendación\n\n"
        justificacion += f"Se recomienda la implementación de este control como parte de la estrategia de gestión de riesgos de la organización, priorizando su implementación según el nivel de riesgo identificado y los recursos disponibles.\n"
        
        return justificacion
    
    def _validar_y_refinar(self, justificacion: str) -> str:
        """Validar y refinar la justificación"""
        # Validaciones básicas
        # 1. Longitud mínima
        if len(justificacion) < 200:
            logger.warning("Justificación muy corta, enriqueciendo...")
            justificacion += "\n\n*Nota: Esta justificación puede ser enriquecida con información adicional específica del contexto organizacional.*"
        
        # 2. Verificar estructura
        secciones_requeridas = ['Contexto', 'Base Normativa', 'Beneficios Esperados']
        for seccion in secciones_requeridas:
            if seccion not in justificacion:
                logger.warning(f"Sección '{seccion}' no encontrada en justificación")
        
        # 3. Limpiar formato
        justificacion = self._limpiar_formato(justificacion)
        
        return justificacion
    
    def _limpiar_formato(self, texto: str) -> str:
        """Limpiar y normalizar formato del texto"""
        # Eliminar espacios múltiples
        import re
        texto = re.sub(r'\s+', ' ', texto)
        
        # Normalizar saltos de línea
        texto = re.sub(r'\n{3,}', '\n\n', texto)
        
        return texto.strip()


