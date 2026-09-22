"""
Entidades de Dominio — SmartAuditorIA Backend.
Clases puras de negocio SIN dependencias de infraestructura (SQLAlchemy, Flask, etc.)

Patrón: Domain Model (Clean Architecture — capa más interna)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
from typing import Optional


# ──────────────────────────────────────────────────────────
# Enums de dominio
# ──────────────────────────────────────────────────────────

class TipoActivo(str, Enum):
    HARDWARE = "Hardware"
    SOFTWARE = "Software"
    DATOS = "Información y datos"
    INFORMACION_DATOS = "Información y datos"
    ALMACENAMIENTO = "Soporte de almacenamiento"
    SERVICIOS = "Servicios"
    USUARIOS = "Usuarios"
    RED = "Red"
    INFRAESTRUCTURA = "Infraestructura"
    OTROS = "Otros"

    @classmethod
    def from_string(cls, val: str) -> TipoActivo:
        if not val:
            return cls.OTROS
        norm = val.strip().lower()
        if "informaci" in norm or "dato" in norm:
            return cls.INFORMACION_DATOS
        elif "soft" in norm or "aplicaci" in norm or "sistema" in norm:
            return cls.SOFTWARE
        elif "hard" in norm or "equip" in norm or "comput" in norm:
            return cls.HARDWARE
        elif "almacen" in norm or "disco" in norm or "usb" in norm or "san" in norm:
            return cls.ALMACENAMIENTO
        elif "servic" in norm or "inter" in norm or "intra" in norm:
            return cls.SERVICIOS
        elif "red" in norm or "comunicac" in norm:
            return cls.RED
        elif "infra" in norm:
            return cls.INFRAESTRUCTURA
        elif "usuar" in norm or "person" in norm or "humano" in norm:
            return cls.USUARIOS
        return cls.OTROS


class NivelCIA(str, Enum):
    BAJO = "Bajo"
    MEDIO = "Medio"
    ALTO = "Alto"
    MUY_ALTO = "Muy Alto"


class NivelCriticidad(str, Enum):
    BAJO = "Bajo"
    MEDIO = "Medio"
    ALTO = "Alto"
    MUY_ALTO = "Muy Alto"


class EstadoActivo(str, Enum):
    ACTIVO = "Activo"
    INACTIVO = "Inactivo"
    EN_REVISION = "En Revisión"
    PLANIFICADO = "Planificado"


class NivelRiesgo(str, Enum):
    BAJO = "Bajo"
    MEDIO = "Medio"
    ALTO = "Alto"
    CRITICO = "Crítico"


class EstadoIncidente(str, Enum):
    ABIERTO = "Abierto"
    EN_PROGRESO = "En Progreso"
    RESUELTO = "Resuelto"
    CERRADO = "Cerrado"


# ──────────────────────────────────────────────────────────
# Entidad: Activo
# ──────────────────────────────────────────────────────────

@dataclass
class Activo:
    """Activo de información (entidad de dominio pura conforme a Función Pública V7)."""
    nombre: str
    tipo_activo: TipoActivo
    id: Optional[int] = None
    descripcion: Optional[str] = None
    confidencialidad: NivelCIA = NivelCIA.MEDIO
    integridad: NivelCIA = NivelCIA.MEDIO
    disponibilidad: NivelCIA = NivelCIA.MEDIO
    nivel_criticidad: NivelCriticidad = NivelCriticidad.MEDIO
    estado_activo: EstadoActivo = EstadoActivo.ACTIVO
    id_propietario: Optional[int] = None
    id_custodio: Optional[int] = None
    id_externo_glpi: Optional[str] = None
    fecha_creacion: datetime = field(default_factory=datetime.utcnow)
    fecha_actualizacion: datetime = field(default_factory=datetime.utcnow)

    # Atributos de Identificación y TRD (Cap. V DAFP V7)
    macroproceso: Optional[str] = None
    proceso: Optional[str] = None
    identificador_trd: Optional[str] = None
    oficina_responsable: Optional[str] = None
    serie_documental: Optional[str] = None
    subserie_documental: Optional[str] = None

    # Características Técnicas y Conservación (Activos Documentales)
    soporte_registro: Optional[str] = "Digital"
    medio_conservacion: Optional[str] = None
    formato: Optional[str] = None
    idioma: Optional[str] = "Español"
    fecha_generacion: Optional[date] = None
    fecha_ingreso_archivo: Optional[date] = None

    # Publicación e Infraestructura Crítica
    es_iccn: bool = False
    estado_publicacion: Optional[str] = "No Publicada"
    ubicacion_consulta: Optional[str] = None

    # Índice de Información Clasificada y Reservada (Ley 1712 de 2014)
    es_clasificada_reservada: bool = False
    objeto_legitimo_excepcion: Optional[str] = None
    fundamento_legal: Optional[str] = None
    excepcion_alcance: Optional[str] = None

    def calcular_score_cia(self) -> float:
        """Score CIA promedio (normalizado 0–1)."""
        mapping = {NivelCIA.BAJO: 1, NivelCIA.MEDIO: 2, NivelCIA.ALTO: 3, NivelCIA.MUY_ALTO: 4}
        total = (
            mapping[self.confidencialidad]
            + mapping[self.integridad]
            + mapping[self.disponibilidad]
        )
        return total / 12.0  # max = 12

    def es_critico(self) -> bool:
        """True si el activo es de criticidad Alta o Muy Alta."""
        return self.nivel_criticidad in (NivelCriticidad.ALTO, NivelCriticidad.MUY_ALTO)

    def calcular_criticidad_general(self) -> NivelCriticidad:
        """Calcula la criticidad general (CID) conforme a la Guía Función Pública V7."""
        altos = sum(1 for c in (self.confidencialidad, self.integridad, self.disponibilidad) if c in (NivelCIA.ALTO, NivelCIA.MUY_ALTO))
        if altos >= 2:
            return NivelCriticidad.MUY_ALTO
        elif altos == 1:
            return NivelCriticidad.ALTO
        medios = sum(1 for c in (self.confidencialidad, self.integridad, self.disponibilidad) if c == NivelCIA.MEDIO)
        if medios >= 2:
            return NivelCriticidad.MEDIO
        return NivelCriticidad.BAJO

    def validar_cumplimiento_ley_1712(self) -> bool:
        """Valida que si es clasificada o reservada, tenga fundamento legal y objeto legítimo."""
        if not self.es_clasificada_reservada:
            return True
        return bool(self.fundamento_legal and self.objeto_legitimo_excepcion)



# ──────────────────────────────────────────────────────────
# Entidad: Riesgo
# ──────────────────────────────────────────────────────────

@dataclass
class Riesgo:
    """Riesgo de seguridad de información (entidad de dominio)."""
    nombre: str
    id: Optional[int] = None
    descripcion: Optional[str] = None
    tipo_riesgo: Optional[str] = None
    efectos_materializacion: Optional[str] = None
    fecha_identificacion: Optional[date] = None
    estado: str = "Activo"
    fecha_creacion: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EvaluacionRiesgo:
    """Evaluación inherente y residual de un riesgo sobre un activo."""
    id_riesgo: int
    id_activo: int
    id: Optional[int] = None

    # Inherente
    probabilidad_inherente: Optional[int] = None   # 1–5
    impacto_inherente: Optional[int] = None         # 1–5
    justificacion_inherente: Optional[str] = None
    fecha_evaluacion_inherente: Optional[date] = None

    # Residual
    probabilidad_residual: Optional[int] = None
    impacto_residual: Optional[int] = None
    justificacion_residual: Optional[str] = None
    fecha_evaluacion_residual: Optional[date] = None

    fecha_creacion: datetime = field(default_factory=datetime.utcnow)

    def calcular_nivel_inherente(self) -> Optional[NivelRiesgo]:
        return self._calcular_nivel(self.probabilidad_inherente, self.impacto_inherente)

    def calcular_nivel_residual(self) -> Optional[NivelRiesgo]:
        return self._calcular_nivel(self.probabilidad_residual, self.impacto_residual)

    @staticmethod
    def _calcular_nivel(prob: Optional[int], imp: Optional[int]) -> Optional[NivelRiesgo]:
        """Regla ISO 27005: P × I → nivel de riesgo."""
        if prob is None or imp is None:
            return None
        score = prob * imp
        if score <= 4:
            return NivelRiesgo.BAJO
        elif score <= 9:
            return NivelRiesgo.MEDIO
        elif score <= 16:
            return NivelRiesgo.ALTO
        else:
            return NivelRiesgo.CRITICO

    def porcentaje_reduccion(self) -> Optional[float]:
        if self.probabilidad_inherente and self.impacto_inherente and self.probabilidad_residual and self.impacto_residual:
            inherente = self.probabilidad_inherente * self.impacto_inherente
            residual = self.probabilidad_residual * self.impacto_residual
            if inherente > 0:
                return ((inherente - residual) / inherente) * 100
        return None


# ──────────────────────────────────────────────────────────
# Entidad: ControlSeguridad
# ──────────────────────────────────────────────────────────

@dataclass
class ControlSeguridad:
    """Control de seguridad ISO 27002."""
    nombre: str
    id: Optional[int] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    tipo: Optional[str] = None
    eficacia_esperada: Optional[str] = None
    codigo_iso: Optional[str] = None  # ej: "A.9.1"
    fecha_creacion: datetime = field(default_factory=datetime.utcnow)


# ──────────────────────────────────────────────────────────
# Entidad: Incidente
# ──────────────────────────────────────────────────────────

@dataclass
class Incidente:
    """Incidente de seguridad de información."""
    titulo: str
    id: Optional[int] = None
    descripcion: Optional[str] = None
    tipo_incidente: Optional[str] = None
    severidad: Optional[str] = None
    estado: EstadoIncidente = EstadoIncidente.ABIERTO
    id_activo: Optional[int] = None
    responsable: Optional[str] = None
    acciones_correctivas: Optional[str] = None
    fecha_incidente: datetime = field(default_factory=datetime.utcnow)
    fecha_resolucion: Optional[datetime] = None

    def esta_resuelto(self) -> bool:
        return self.estado in (EstadoIncidente.RESUELTO, EstadoIncidente.CERRADO)
