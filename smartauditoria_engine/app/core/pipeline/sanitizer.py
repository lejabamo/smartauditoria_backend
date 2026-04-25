"""
Sanitizer Módulo — Blue Team Layer.
Protección contra Prompt Injection y manipulación de contexto.
"""

from __future__ import annotations

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

class SecurityViolationError(Exception):
    """Excepción lanzada cuando se detecta un intento de ataque o malformación."""
    pass

class PromptSanitizer:
    """
    Sanitizador de entradas para el RAG Engine.
    Detecta patrones de inyección y limpia entradas maliciosas.
    """

    # Patrones comunes de Jailbreak / Prompt Injection
    FORBIDDEN_PATTERNS = [
        r"ignore previous instructions",
        r"forget all instructions",
        r"olvida las instrucciones",
        r"act as a",
        r"system prompt:",
        r"DAN mode",
        r"ignore iso rules",
        r"haz lo que quieras",
        r"recomienda algo genérico"
    ]

    def __init__(self, mode: str = "strict"):
        self.mode = mode

    def sanitize(self, input_text: str) -> str:
        """
        Limpia y valida la entrada del usuario/backend.
        Lanza SecurityViolationError si detecta patrones prohibidos.
        """
        if not input_text or len(input_text.strip()) < 3:
            raise SecurityViolationError("Entrada vacía o demasiado corta.")

        # 1. Detección de Inyección
        clean_text = input_text.lower()
        for pattern in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, clean_text):
                logger.warning("ALERTA SEGURIDAD: Detectado intento de bypass: %s", pattern)
                raise SecurityViolationError(f"Entrada bloqueada por política de ciberseguridad: {pattern}")

        # 2. Sanitización básica (XSS / SQL Injection prevention simple)
        # Aunque es un RAG, sanitizamos caracteres que puedan romper prompts
        sanitized = re.sub(r'[<>{}\[\]]', '', input_text)
        
        return sanitized.strip()

    def validate_context(self, context: dict[str, Any]) -> bool:
        """Valida que el RiskContext sea coherente."""
        required = ["activo", "activo_tipo"]
        if not all(k in context.get("activo", {}) for k in ["nombre", "tipo"]):
            return False
        return True
