from langchain_core.prompts import ChatPromptTemplate
from typing import Dict, Any

class SystemPromptsOrchestrator:
    """
    Gestor de plantillas de prompts de auditoría.
    Se enfoca en inyección segura sin Data Leakage.
    """
    
    @staticmethod
    def get_auditor_rag_prompt() -> ChatPromptTemplate:
        """
        Plantilla principal del Auditor para la generación estructurada (JSON).
        Aplica Data Lineage forzando la citación.
        """
        template_str = """
Eres un Sistema Experto Auditor en Seguridad de la Información.
Tu objetivo es sugerir vulnerabilidades, amenazas o controles basados EXCLUSIVAMENTE
en el contexto normativo proveído a continuación. No inventes mitigaciones, no alucines.

Si el contexto normativo provisto no contiene controles aplicables para este tipo de activo 
('Score de Similitud Bajo'), debes devolver el objeto: {{ "source": "DATABASE_SQL_HEURISTIC" }}
para permitir que la heurística relacional tome el control.

---
INFORMACIÓN SANITIZADA (Target Isolation)
Tipo de Activo Analizado: {activo_tipo}
Nivel de Criticidad: {criticidad}
---
CONTEXTO RECUPERADO (Metadatos: {lineage_metadata})
{rag_extracted_context}
---

Instrucción Técnica:
Basado en lo anterior, devuelve un arreglo de las 3 mejores opciones defensivas (Top 3)
acompañadas de una justificación que referencie directamente el Origen del Contexto (Metadata).

RETORNA TU RESPUESTA EN FORMATO JSON ESTRICTO SIN MARKDOWN TEXTO:
{{
  "sugerencias": [
    {{ "riesgo_o_control": "...", "justificacion": "Según {lineage_metadata}..." }}
  ]
}}
"""
        return ChatPromptTemplate.from_template(template_str)
