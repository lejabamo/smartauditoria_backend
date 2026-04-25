"""
Generator — Paso 3 del pipeline RAG.
Patrón: Chain of Responsibility (tercer eslabón) + Builder para justificaciones.

Responsabilidad única: dado un AugmentedContext, genera las sugerencias
o justificaciones normativas estructuradas.
"""

from __future__ import annotations

import logging
from typing import Any

from app.config import get_settings
from app.core.pipeline.augmenter import AugmentedContext
from app.domain.risk_context import AssetType, RiskContext
from app.domain.suggestion import Justification, Suggestion

logger = logging.getLogger(__name__)

# ── Base de conocimiento estática: amenazas por tipo de activo ──
_THREAT_CATALOG: dict[str, dict[str, Any]] = {
    "T.1": {
        "nombre": "Malware / Código Malicioso",
        "descripcion": "Software malicioso que compromete la confidencialidad, integridad o disponibilidad del activo.",
        "categoria": "Técnica",
        "activos": [AssetType.SERVIDOR, AssetType.BASE_DATOS, AssetType.APLICACION,
                    AssetType.RED, AssetType.DISPOSITIVO_MOVIL],
        "controles": ["A.12.2", "A.9.4", "A.14.2"],
        "confianza_base": 0.85,
    },
    "T.2": {
        "nombre": "Phishing / Ingeniería Social",
        "descripcion": "Engaño a usuarios para obtener credenciales o información confidencial.",
        "categoria": "Humana",
        "activos": [AssetType.USUARIO, AssetType.APLICACION, AssetType.DISPOSITIVO_MOVIL],
        "controles": ["A.7.2", "A.9.2", "A.6.1"],
        "confianza_base": 0.80,
    },
    "T.3": {
        "nombre": "Acceso No Autorizado",
        "descripcion": "Acceso a sistemas o datos sin los privilegios adecuados.",
        "categoria": "Técnica/Humana",
        "activos": [AssetType.SERVIDOR, AssetType.BASE_DATOS, AssetType.DATOS,
                    AssetType.APLICACION, AssetType.USUARIO],
        "controles": ["A.9.1", "A.9.2", "A.9.4", "A.8.2"],
        "confianza_base": 0.90,
    },
    "T.4": {
        "nombre": "Pérdida o Corrupción de Datos",
        "descripcion": "Destrucción, pérdida o alteración no autorizada de información crítica.",
        "categoria": "Técnica",
        "activos": [AssetType.BASE_DATOS, AssetType.DATOS, AssetType.DISPOSITIVO_MOVIL,
                    AssetType.INFRAESTRUCTURA],
        "controles": ["A.12.3", "A.17.1", "A.8.3"],
        "confianza_base": 0.75,
    },
    "T.5": {
        "nombre": "Interrupción de Servicio (DoS/DDoS)",
        "descripcion": "Ataques que impiden la disponibilidad del servicio o sistema.",
        "categoria": "Técnica",
        "activos": [AssetType.SERVIDOR, AssetType.RED, AssetType.INFRAESTRUCTURA],
        "controles": ["A.17.1", "A.13.1", "A.12.1"],
        "confianza_base": 0.80,
    },
    "T.6": {
        "nombre": "Exfiltración de Información",
        "descripcion": "Robo o transferencia no autorizada de datos confidenciales.",
        "categoria": "Técnica/Humana",
        "activos": [AssetType.DATOS, AssetType.BASE_DATOS, AssetType.SERVIDOR],
        "controles": ["A.13.2", "A.9.4", "A.10.1"],
        "confianza_base": 0.85,
    },
}

# ── Base de conocimiento: vulnerabilidades por amenaza ────
_VULNERABILITY_CATALOG: dict[str, dict[str, Any]] = {
    "V.1": {"nombre": "Parches de seguridad desactualizados",
             "descripcion": "El sistema no tiene actualizaciones de seguridad recientes.",
             "categoria": "Técnica", "amenazas": ["T.1", "T.3"], "controles": ["A.12.6", "A.14.2"]},
    "V.2": {"nombre": "Contraseñas débiles o compartidas",
             "descripcion": "Uso de contraseñas inseguras o compartidas entre usuarios.",
             "categoria": "Humana", "amenazas": ["T.2", "T.3"], "controles": ["A.9.2", "A.9.3"]},
    "V.3": {"nombre": "Ausencia de cifrado en tránsito",
             "descripcion": "Comunicaciones sin cifrado expuestas a interceptación.",
             "categoria": "Técnica", "amenazas": ["T.3", "T.6"], "controles": ["A.10.1", "A.13.1"]},
    "V.4": {"nombre": "Falta de copias de seguridad",
             "descripcion": "Sin mecanismos de backup regular y verificado.",
             "categoria": "Proceso", "amenazas": ["T.4"], "controles": ["A.12.3", "A.17.1"]},
    "V.5": {"nombre": "Gestión de accesos deficiente",
             "descripcion": "Privilegios excesivos o mal gestionados (principio de mínimo privilegio).",
             "categoria": "Proceso", "amenazas": ["T.3", "T.6"], "controles": ["A.9.1", "A.9.2"]},
    "V.6": {"nombre": "Sin monitoreo de actividades",
             "descripcion": "Ausencia de logs, alertas o SIEM para detectar incidentes.",
             "categoria": "Técnica", "amenazas": ["T.1", "T.3"], "controles": ["A.12.4", "A.16.1"]},
}


class SuggestionGenerator:
    """
    Genera sugerencias de amenazas, vulnerabilidades y controles
    a partir del contexto augmentado del pipeline RAG.
    """

    def __init__(self) -> None:
        self._settings = get_settings()

    def generate_threat_suggestions(
        self, aug_ctx: AugmentedContext
    ) -> list[Suggestion]:
        ctx = aug_ctx.risk_context
        asset_type = ctx.activo.tipo
        results: list[Suggestion] = []

        for threat_id, threat in _THREAT_CATALOG.items():
            if asset_type not in threat["activos"]:
                continue

            # Ajuste de confianza con base en RAG
            confidence = self._adjust_confidence(
                threat["confianza_base"], aug_ctx, threat["nombre"]
            )

            results.append(
                Suggestion(
                    id=threat_id,
                    nombre=threat["nombre"],
                    descripcion=threat["descripcion"],
                    categoria=threat["categoria"],
                    confianza=confidence,
                    referencias_iso=aug_ctx.iso_references[:3],
                    referencias_legales=aug_ctx.legal_references[:2],
                    controles_relacionados=threat["controles"],
                )
            )

        results.sort(key=lambda s: s.confianza, reverse=True)
        return results[: self._settings.rag_max_suggestions]

    def generate_vulnerability_suggestions(
        self, aug_ctx: AugmentedContext
    ) -> list[Suggestion]:
        ctx = aug_ctx.risk_context
        amenaza_id = ctx.amenaza_id
        results: list[Suggestion] = []

        for vuln_id, vuln in _VULNERABILITY_CATALOG.items():
            if amenaza_id and amenaza_id not in vuln.get("amenazas", []):
                continue

            confidence = self._adjust_confidence(0.75, aug_ctx, vuln["nombre"])

            results.append(
                Suggestion(
                    id=vuln_id,
                    nombre=vuln["nombre"],
                    descripcion=vuln["descripcion"],
                    categoria=vuln["categoria"],
                    confianza=confidence,
                    referencias_iso=aug_ctx.iso_references[:3],
                    referencias_legales=aug_ctx.legal_references[:2],
                    controles_relacionados=vuln.get("controles", []),
                )
            )

        results.sort(key=lambda s: s.confianza, reverse=True)
        return results[: self._settings.rag_max_suggestions]

    def generate_control_suggestions(
        self, aug_ctx: AugmentedContext
    ) -> list[Suggestion]:
        ctx = aug_ctx.risk_context
        threat_controls: list[str] = []
        vuln_controls: list[str] = []

        if ctx.amenaza_id and ctx.amenaza_id in _THREAT_CATALOG:
            threat_controls = _THREAT_CATALOG[ctx.amenaza_id]["controles"]

        if ctx.vulnerabilidad_id and ctx.vulnerabilidad_id in _VULNERABILITY_CATALOG:
            vuln_controls = _VULNERABILITY_CATALOG[ctx.vulnerabilidad_id].get("controles", [])

        all_codes = list(dict.fromkeys(threat_controls + vuln_controls))
        if not all_codes:
            all_codes = ["A.9.1", "A.12.1", "A.8.1", "A.16.1", "A.17.1"]

        results: list[Suggestion] = []
        for code in all_codes:
            confidence = self._adjust_confidence(0.80, aug_ctx, code)
            results.append(
                Suggestion(
                    id=code,
                    nombre=f"Control ISO 27002 — {code}",
                    descripcion=f"Implementar el control {code} según ISO 27002:2022.",
                    categoria="ISO 27002",
                    confianza=confidence,
                    referencias_iso=[code] + aug_ctx.iso_references[:2],
                    referencias_legales=aug_ctx.legal_references[:2],
                    controles_relacionados=[],
                )
            )

        results.sort(key=lambda s: s.confianza, reverse=True)
        return results[: self._settings.rag_max_suggestions]

    def _adjust_confidence(
        self, base: float, aug_ctx: AugmentedContext, keyword: str
    ) -> float:
        """Ajusta la confianza base según la relevancia de los documentos recuperados."""
        boost = 0.0
        for chunk in aug_ctx.relevant_text_chunks:
            if keyword.lower() in chunk.lower():
                boost += 0.05
        return min(base + aug_ctx.confidence_base * 0.1 + boost, 1.0)


class JustificationBuilder:
    """
    Builder para justificaciones normativas residuales.
    Patrón Builder: construye la justificación sección por sección.
    """

    def build(self, aug_ctx: AugmentedContext) -> Justification:
        ctx = aug_ctx.risk_context
        activo = ctx.activo
        controles = ctx.controles_seleccionados or ["controles de seguridad aplicables"]
        iso_refs = aug_ctx.iso_references or ["ISO 27001:2022", "ISO 27005:2022"]
        legal_refs = aug_ctx.legal_references

        # ── Sección: Contexto ─────────────────────────────
        contexto = (
            f"El activo '{activo.nombre}' (tipo: {activo.tipo.value}, "
            f"criticidad: {activo.criticidad or 'no especificada'}) "
            f"ha sido evaluado bajo la metodología ISO 27005:2022. "
            f"Se identificó un riesgo inherente de nivel "
            f"{ctx.riesgo_inherente or 'N/A'}/25 y, tras la implementación de los controles "
            f"seleccionados, el riesgo residual se establece en "
            f"{ctx.riesgo_residual or 'N/A'}/25."
        )

        # ── Sección: Base Normativa ───────────────────────
        base_normativa = "La selección de controles se fundamenta en:\n"
        for ref in iso_refs[:4]:
            base_normativa += f"• {ref}\n"
        if legal_refs:
            base_normativa += "\nMarco legal colombiano aplicable:\n"
            for ref in legal_refs[:3]:
                base_normativa += f"• {ref}\n"

        # ── Sección: Implementación ───────────────────────
        ctrl_list = ", ".join(controles[:5])
        implementacion = (
            f"Los controles implementados ({ctrl_list}) reducen "
            f"el vector de ataque identificado mediante: "
            f"(1) restricción de acceso al mínimo privilegio necesario, "
            f"(2) monitoreo continuo de actividades, "
            f"(3) procedimientos documentados de respuesta ante incidentes."
        )
        if aug_ctx.relevant_text_chunks:
            implementacion += f"\n\nReferencia técnica recuperada: {aug_ctx.relevant_text_chunks[0][:200]}..."

        # ── Sección: Beneficios ───────────────────────────
        delta = ""
        if ctx.riesgo_inherente and ctx.riesgo_residual and ctx.riesgo_inherente > 0:
            reduccion = ((ctx.riesgo_inherente - ctx.riesgo_residual) / ctx.riesgo_inherente) * 100
            delta = f" ({reduccion:.0f}% de reducción)"
        beneficios = (
            f"• Reducción del nivel de riesgo{delta}.\n"
            "• Cumplimiento normativo verificable y auditable.\n"
            "• Trazabilidad completa de decisiones de tratamiento de riesgo.\n"
            "• Mejora en la postura de seguridad del activo evaluado."
        )

        # ── Sección: Recomendación ────────────────────────
        recomendacion = (
            "Se recomienda mantener los controles implementados bajo revisión periódica "
            "(mínimo anual o ante cambios significativos del entorno tecnológico), "
            "documentar las evidencias de implementación y verificar la eficacia "
            "mediante auditorías internas alineadas con ISO 27001:2022 cláusula 9."
        )

        # ── Confianza final ───────────────────────────────
        confidence = max(aug_ctx.confidence_base, 0.65)
        if len(aug_ctx.iso_references) >= 3:
            confidence = min(confidence + 0.05, 1.0)

        control_id = controles[0] if controles else "N/A"
        return Justification(
            control_id=control_id,
            control_nombre=f"Controles seleccionados: {', '.join(controles[:3])}",
            activo_nombre=activo.nombre,
            riesgo_descripcion=ctx.amenaza_nombre or "Riesgo de seguridad de información identificado",
            contexto=contexto,
            base_normativa=base_normativa,
            implementacion=implementacion,
            beneficios_esperados=beneficios,
            recomendacion=recomendacion,
            nivel_confianza=confidence,
            articulos_iso_citados=iso_refs,
            normas_colombianas_citadas=legal_refs,
            fuentes_recuperadas=len(aug_ctx.retrieved_docs),
        )
