"""
Modelos de autenticación y autorización

Este módulo actúa como un *wrapper* de compatibilidad y simplemente
reexporta los modelos definidos en `app.models`, para evitar
definiciones duplicadas de tablas (por ejemplo `roles_auth`).
"""

from app.models import Rol, UsuarioAuth, SesionUsuario

__all__ = ["Rol", "UsuarioAuth", "SesionUsuario"]
