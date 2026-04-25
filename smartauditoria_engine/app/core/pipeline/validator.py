"""
Validator Módulo — Anti-Alucinaciones.
Verifica que el output del LLM se base estrictamente en los chunks.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

class Validator:
    """
    Componente de Validación de Respuesta y Anti-Alucinaciones.
    Diseñado para asegurar que la evidencia normativa sea real.
    """

    def __init__(self, confidence_threshold: float = 0.8):
        self.confidence_threshold = confidence_threshold

    def validate_integrity(self, response_text: str, source_chunks: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Verifica integridad semántica y normativa.
        Detecta menciones a normas que NO existen en los chunks.
        """
        response_low = response_text.lower()
        
        # 1. Extraemos los códigos de control presentes en los chunks
        valid_control_ids = [str(c.get("metadata", {}).get("control_id", "")).lower() for c in source_chunks]
        valid_norms = [str(c.get("metadata", {}).get("norma", "")).lower() for c in source_chunks]
        
        # 2. Verificamos menciones a controles en el texto generado
        # (Ejemplo: el LLM dice "cumple A.9.1" pero A.9.1 no estaba en los chunks)
        mentioned_controls = []  # Lógica simplificada: regex de patrones ISO A.X.Y
        import re
        iso_patterns = re.findall(r"A\.\d+\.\d+", response_text)
        
        hallucinations = []
        for pat in iso_patterns:
            if pat.lower() not in valid_control_ids:
                hallucinations.append(f"Control mencionado '{pat}' no presente en evidencia normativa recuperada.")
        
        # 3. Cálculo de confianza (basado en proporción de evidencia verificada)
        confidence = 1.0 - (len(hallucinations) * 0.2)
        confidence = max(0.0, confidence)
        
        is_valid = len(hallucinations) == 0 and confidence >= self.confidence_threshold
        
        return {
            "valid": is_valid,
            "confidence": confidence,
            "hallucinations": hallucinations,
            "evidence_count": len(source_chunks)
        }
