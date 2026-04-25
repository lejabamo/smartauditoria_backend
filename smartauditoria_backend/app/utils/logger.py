"""
Logger centralizado para SmartAuditorIA (SGSRI)

Uso:
    from app.utils.logger import get_logger
    logger = get_logger(__name__)

    logger.info("Mensaje informativo")
    logger.warning("Advertencia")
    logger.error("Error crítico")
    logger.debug("Solo visible si LOG_LEVEL=DEBUG")
"""

import logging
import os
import sys


def get_logger(name: str) -> logging.Logger:
    """
    Retorna un logger configurado para el módulo dado.

    Args:
        name: Nombre del módulo, usar __name__ siempre.

    Returns:
        logging.Logger configurado.
    """
    logger = logging.getLogger(name)

    # Evitar duplicar handlers si ya está configurado
    if logger.handlers:
        return logger

    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    logger.setLevel(log_level)

    # Handler a stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # No propagar al root logger para evitar doble output
    logger.propagate = False

    return logger
