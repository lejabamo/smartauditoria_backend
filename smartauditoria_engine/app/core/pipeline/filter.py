"""
Hard Filter Normativo — Security Layer.
Descarta chunks que no coinciden con el dominio del activo.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

class HardFilter:
    """
    Filtro de coherencia ISO.
    Evita alucinaciones semánticas al filtrar por dominios de control.
    """

    # Mapeo de categorías de activos a dominios de control ISO 27002 sugeridos
    DOMAIN_MAPPING = {
        "hardware": ["A.8.1", "A.11.1", "A.11.2"],
        "software": ["A.12.1", "A.12.2", "A.14.1"],
        "datos": ["A.8.2", "A.18.1", "A.23.1"],
        "usuarios": ["A.7.1", "A.7.2", "A.9.1"],
        "servidor": ["A.12.1", "A.12.4", "A.12.5"],
        "red": ["A.13.1", "A.13.2"]
    }

    def filter(self, results: list[dict[str, Any]], activo_tipo: str) -> list[dict[str, Any]]:
        """
        Descarta resultados que no tienen relación directa con el tipo de activo.
        """
        tipo_low = activo_tipo.lower()
        if tipo_low not in self.DOMAIN_MAPPING:
            logger.info("Tipo de activo '%s' no tiene mapeo de dominio. Pasando todo.", activo_tipo)
            return results

        dominios_validos = self.DOMAIN_MAPPING[tipo_low]
        filtered = []

        for res in results:
            control_id = res.get("metadata", {}).get("control_id", "")
            
            # Verificamos si el control_id empieza con alguno de los dominios válidos
            if any(control_id.startswith(d) for d in dominios_validos):
                filtered.append(res)
            else:
                logger.debug("HardFilter descartó control '%s' para activo '%s'", control_id, activo_tipo)

        return filtered
