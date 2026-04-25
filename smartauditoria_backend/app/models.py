"""
Modelos de base de datos para el Sistema de Gestión de Riesgos de la Información (SGRI)
Consolidación de todos los modelos del sistema
"""

from . import db
from datetime import datetime, timedelta
import bcrypt
import jwt
from flask import current_app

# ============================================================================
# MODELOS DE AUTENTICACIÓN Y AUTORIZACIÓN
# ============================================================================

class Rol(db.Model):
    """Modelo para roles de autenticación"""
    __tablename__ = 'roles_auth'
    
    id_rol = db.Column(db.Integer, primary_key=True)
    nombre_rol = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.Text)
    permisos = db.Column(db.Text)  # JSON string con permisos
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    # Relaciones
    usuarios = db.relationship('UsuarioAuth', backref='rol', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id_rol': self.id_rol,
            'nombre_rol': self.nombre_rol,
            'descripcion': self.descripcion,
            'permisos': self.permisos,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'activo': self.activo
        }

class UsuarioAuth(db.Model):
    """Modelo para autenticación de usuarios"""
    __tablename__ = 'usuarios_auth'
    
    id_usuario_auth = db.Column(db.Integer, primary_key=True)
    id_usuario_sistema = db.Column(db.Integer, db.ForeignKey('usuarios_sistema.id_usuario'), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    id_rol = db.Column(db.Integer, db.ForeignKey('roles_auth.id_rol'), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_ultimo_login = db.Column(db.DateTime)
    intentos_fallidos = db.Column(db.Integer, default=0)
    bloqueado_hasta = db.Column(db.DateTime)
    
    # Relaciones
    sesiones = db.relationship('SesionUsuario', backref='usuario_auth', lazy='dynamic')
    documentos_subidos = db.relationship('DocumentoAdjunto', backref='usuario', lazy='dynamic')
    
    def set_password(self, password):
        """Hash y guarda la contraseña"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Verifica la contraseña"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_token(self, expires_in=28800):  # 8 horas
        """Genera un JWT token"""
        try:
            rol_nombre = self.rol.nombre_rol if hasattr(self, 'rol') and self.rol else None
        except Exception:
            rol_nombre = None
        
        payload = {
            'user_id': self.id_usuario_auth,
            'username': self.username,
            'rol': rol_nombre,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    @staticmethod
    def verify_token(token):
        """Verifica un JWT token"""
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            return UsuarioAuth.query.get(payload['user_id'])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def to_dict(self):
        try:
            rol_nombre = self.rol.nombre_rol if hasattr(self, 'rol') and self.rol else None
        except Exception:
            rol_nombre = None
        
        return {
            'id_usuario_auth': self.id_usuario_auth,
            'id_usuario_sistema': self.id_usuario_sistema,
            'username': self.username,
            'id_rol': self.id_rol,
            'rol_nombre': rol_nombre,
            'activo': self.activo,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_ultimo_login': self.fecha_ultimo_login.isoformat() if self.fecha_ultimo_login else None
        }

class SesionUsuario(db.Model):
    """Modelo para sesiones de usuario"""
    __tablename__ = 'sesiones_usuario'
    
    id_sesion = db.Column(db.Integer, primary_key=True)
    id_usuario_auth = db.Column(db.Integer, db.ForeignKey('usuarios_auth.id_usuario_auth'), nullable=False)
    token = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    fecha_inicio = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_expiracion = db.Column(db.DateTime, nullable=False)
    activa = db.Column(db.Boolean, default=True)
    
    def is_valid(self):
        """Verifica si la sesión es válida"""
        return self.activa and datetime.utcnow() < self.fecha_expiracion
    
    def to_dict(self):
        return {
            'id_sesion': self.id_sesion,
            'id_usuario_auth': self.id_usuario_auth,
            'ip_address': self.ip_address,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_expiracion': self.fecha_expiracion.isoformat() if self.fecha_expiracion else None,
            'activa': self.activa
        }

# ============================================================================
# MODELOS PRINCIPALES DEL SISTEMA
# ============================================================================

class UsuarioSistema(db.Model):
    """Modelo para usuarios del sistema"""
    __tablename__ = 'usuarios_sistema'
    
    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(255), nullable=False)
    email_institucional = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    puesto_organizacion = db.Column(db.String(255))
    estado_usuario = db.Column(db.String(50))
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    fecha_ultimo_login = db.Column(db.DateTime)
    intentos_fallidos_login = db.Column(db.Integer, default=0)
    requiere_cambio_password = db.Column(db.Boolean, default=False)
    
    # Relaciones
    activos_propietario = db.relationship('Activo', foreign_keys='Activo.ID_Propietario', backref='propietario')
    activos_custodio = db.relationship('Activo', foreign_keys='Activo.ID_Custodio', backref='custodio')
    usuarios_auth = db.relationship('UsuarioAuth', backref='usuario_sistema', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id_usuario': self.id_usuario,
            'nombre_completo': self.nombre_completo,
            'email_institucional': self.email_institucional,
            'puesto_organizacion': self.puesto_organizacion,
            'estado_usuario': self.estado_usuario,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None,
            'fecha_ultima_actualizacion': self.fecha_ultima_actualizacion.isoformat() if self.fecha_ultima_actualizacion else None,
            'fecha_ultimo_login': self.fecha_ultimo_login.isoformat() if self.fecha_ultimo_login else None
        }

class Activo(db.Model):
    """Modelo para activos de información"""
    __tablename__ = 'activos'
    
    ID_Activo = db.Column(db.Integer, primary_key=True)
    Nombre = db.Column(db.String(255), nullable=False)
    Descripcion = db.Column(db.Text)
    Tipo_Activo = db.Column(db.String(50), nullable=False)
    subtipo_activo = db.Column(db.String(100))
    ID_Propietario = db.Column(db.Integer, db.ForeignKey('usuarios_sistema.id_usuario'))
    ID_Custodio = db.Column(db.Integer, db.ForeignKey('usuarios_sistema.id_usuario'))
    Nivel_Clasificacion_Confidencialidad = db.Column(db.String(50), default='Uso Interno')
    Nivel_Clasificacion_Integridad = db.Column(db.String(10), default='Media')
    Nivel_Clasificacion_Disponibilidad = db.Column(db.String(10), default='Media')
    justificacion_clasificacion_cia = db.Column(db.Text)
    nivel_criticidad_negocio = db.Column(db.String(10), default='Medio')
    estado_activo = db.Column(db.String(20), default='Planificado')
    fuente_datos_principal = db.Column(db.String(50), default='SGSI_Manual')
    id_externo_glpi = db.Column(db.String(100))
    id_externo_inventario_si = db.Column(db.String(100))
    fecha_adquisicion = db.Column(db.Date)
    version_general_activo = db.Column(db.String(50))
    requiere_backup = db.Column(db.Boolean, default=True)
    frecuencia_backup_general = db.Column(db.String(100))
    tiempo_retencion_general = db.Column(db.String(100))
    fecha_proxima_revision_sgsi = db.Column(db.Date)
    procedimiento_eliminacion_segura_ref = db.Column(db.Text)
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_ultima_actualizacion_sgsi = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    riesgos = db.relationship('RiesgoActivo', backref='activo', lazy='dynamic')
    evaluaciones_riesgo = db.relationship('evaluacion_riesgo_activo', backref='activo', lazy='dynamic')
    incidentes = db.relationship('Incidente', backref='activo', lazy='dynamic')
    
    def to_dict(self):
        return {
            'ID_Activo': self.ID_Activo,
            'Nombre': self.Nombre,
            'Descripcion': self.Descripcion,
            'Tipo_Activo': self.Tipo_Activo,
            'subtipo_activo': self.subtipo_activo,
            'ID_Propietario': self.ID_Propietario,
            'ID_Custodio': self.ID_Custodio,
            'Nivel_Clasificacion_Confidencialidad': self.Nivel_Clasificacion_Confidencialidad,
            'Nivel_Clasificacion_Integridad': self.Nivel_Clasificacion_Integridad,
            'Nivel_Clasificacion_Disponibilidad': self.Nivel_Clasificacion_Disponibilidad,
            'justificacion_clasificacion_cia': self.justificacion_clasificacion_cia,
            'nivel_criticidad_negocio': self.nivel_criticidad_negocio,
            'estado_activo': self.estado_activo,
            'fuente_datos_principal': self.fuente_datos_principal,
            'id_externo_glpi': self.id_externo_glpi,
            'id_externo_inventario_si': self.id_externo_inventario_si,
            'fecha_adquisicion': self.fecha_adquisicion.isoformat() if self.fecha_adquisicion else None,
            'version_general_activo': self.version_general_activo,
            'requiere_backup': self.requiere_backup,
            'frecuencia_backup_general': self.frecuencia_backup_general,
            'tiempo_retencion_general': self.tiempo_retencion_general,
            'fecha_proxima_revision_sgsi': self.fecha_proxima_revision_sgsi.isoformat() if self.fecha_proxima_revision_sgsi else None,
            'procedimiento_eliminacion_segura_ref': self.procedimiento_eliminacion_segura_ref,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None,
            'fecha_ultima_actualizacion_sgsi': self.fecha_ultima_actualizacion_sgsi.isoformat() if self.fecha_ultima_actualizacion_sgsi else None
        }

class Riesgo(db.Model):
    """Modelo para riesgos"""
    __tablename__ = 'riesgos'
    
    ID_Riesgo = db.Column(db.Integer, primary_key=True)
    Nombre = db.Column(db.Text, nullable=False)  # Cambiado de String(255) a Text para permitir textos largos
    Descripcion = db.Column(db.Text)
    ID_Amenaza_General = db.Column(db.Integer)
    ID_Vulnerabilidad_General = db.Column(db.Integer)
    ID_Proceso_Principal_Afectado = db.Column(db.Integer)
    tipo_riesgo = db.Column(db.String(100))
    Efectos_Materializacion = db.Column(db.Text)
    Fecha_Identificacion = db.Column(db.Date)
    Estado_Riesgo_General = db.Column(db.String(50))
    ID_Propietario_Riesgo_General = db.Column(db.Integer)
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    activos = db.relationship('RiesgoActivo', backref='riesgo', lazy='dynamic')
    evaluaciones_riesgo = db.relationship('evaluacion_riesgo_activo', backref='riesgo', lazy='dynamic')
    
    def to_dict(self):
        return {
            'ID_Riesgo': self.ID_Riesgo,
            'Nombre': self.Nombre,
            'Descripcion': self.Descripcion,
            'ID_Amenaza_General': self.ID_Amenaza_General,
            'ID_Vulnerabilidad_General': self.ID_Vulnerabilidad_General,
            'ID_Proceso_Principal_Afectado': self.ID_Proceso_Principal_Afectado,
            'tipo_riesgo': self.tipo_riesgo,
            'Efectos_Materializacion': self.Efectos_Materializacion,
            'Fecha_Identificacion': self.Fecha_Identificacion.isoformat() if self.Fecha_Identificacion else None,
            'Estado_Riesgo_General': self.Estado_Riesgo_General,
            'ID_Propietario_Riesgo_General': self.ID_Propietario_Riesgo_General,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None,
            'fecha_ultima_actualizacion': self.fecha_ultima_actualizacion.isoformat() if self.fecha_ultima_actualizacion else None
        }

class RiesgoActivo(db.Model):
    """Modelo para relación entre riesgos y activos"""
    __tablename__ = 'riesgo_activo'
    
    id = db.Column(db.Integer, primary_key=True)
    id_riesgo = db.Column(db.Integer, db.ForeignKey('riesgos.ID_Riesgo'), nullable=False)
    ID_Activo = db.Column(db.Integer, db.ForeignKey('activos.ID_Activo'), nullable=False)
    probabilidad = db.Column(db.Integer)  # 1-5 escala
    impacto = db.Column(db.Integer)  # 1-5 escala
    nivel_riesgo_calculado = db.Column(db.String(50))
    medidas_mitigacion = db.Column(db.Text)
    fecha_evaluacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    def calcular_nivel_riesgo(self):
        if self.probabilidad and self.impacto:
            riesgo_total = self.probabilidad * self.impacto
            if riesgo_total <= 4:
                return 'Bajo'
            elif riesgo_total <= 12:
                return 'Medio'
            else:
                return 'Alto'
        return None
    
    def to_dict(self):
        return {
            'id': self.id,
            'id_riesgo': self.id_riesgo,
            'ID_Activo': self.ID_Activo,
            'probabilidad': self.probabilidad,
            'impacto': self.impacto,
            'nivel_riesgo_calculado': self.nivel_riesgo_calculado,
            'medidas_mitigacion': self.medidas_mitigacion,
            'fecha_evaluacion': self.fecha_evaluacion.isoformat() if self.fecha_evaluacion else None
        }

class Incidente(db.Model):
    """Modelo para incidentes de seguridad"""
    __tablename__ = 'incidentes'
    
    id_incidente = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text)
    tipo_incidente = db.Column(db.String(100))
    severidad = db.Column(db.String(50))
    estado = db.Column(db.String(50), default='Abierto')
    ID_Activo = db.Column(db.Integer, db.ForeignKey('activos.ID_Activo'))
    fecha_incidente = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_resolucion = db.Column(db.DateTime)
    responsable = db.Column(db.String(255))
    acciones_correctivas = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id_incidente': self.id_incidente,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'tipo_incidente': self.tipo_incidente,
            'severidad': self.severidad,
            'estado': self.estado,
            'ID_Activo': self.ID_Activo,
            'fecha_incidente': self.fecha_incidente.isoformat() if self.fecha_incidente else None,
            'fecha_resolucion': self.fecha_resolucion.isoformat() if self.fecha_resolucion else None,
            'responsable': self.responsable,
            'acciones_correctivas': self.acciones_correctivas
        }

# ============================================================================
# MODELOS DE EVALUACIÓN DE RIESGOS
# ============================================================================

class niveles_probabilidad(db.Model):
    """Modelo para niveles de probabilidad"""
    __tablename__ = 'niveles_probabilidad'
    
    ID_NivelProbabilidad = db.Column(db.Integer, primary_key=True)
    Nombre = db.Column(db.String(50), nullable=False)
    Valor = db.Column(db.Integer, nullable=False)
    Descripcion = db.Column(db.Text)
    Color_Representacion = db.Column(db.String(50))
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'ID_NivelProbabilidad': self.ID_NivelProbabilidad,
            'Nombre': self.Nombre,
            'Valor': self.Valor,
            'Descripcion': self.Descripcion,
            'Color_Representacion': self.Color_Representacion,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None
        }

class niveles_impacto(db.Model):
    """Modelo para niveles de impacto"""
    __tablename__ = 'niveles_impacto'
    
    ID_NivelImpacto = db.Column(db.Integer, primary_key=True)
    Nombre = db.Column(db.String(50), nullable=False)
    Valor = db.Column(db.Integer, nullable=False)
    Descripcion = db.Column(db.Text)
    Color_Representacion = db.Column(db.String(50))
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'ID_NivelImpacto': self.ID_NivelImpacto,
            'Nombre': self.Nombre,
            'Valor': self.Valor,
            'Descripcion': self.Descripcion,
            'Color_Representacion': self.Color_Representacion,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None
        }

class controles_seguridad(db.Model):
    """Modelo para controles de seguridad"""
    __tablename__ = 'controles_seguridad'
    
    ID_Control = db.Column(db.Integer, primary_key=True)
    Nombre = db.Column(db.String(100), nullable=False)
    Descripcion = db.Column(db.Text)
    Categoria = db.Column(db.String(50))
    Tipo = db.Column(db.String(50))
    Eficacia_Esperada = db.Column(db.String(20))
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'ID_Control': self.ID_Control,
            'Nombre': self.Nombre,
            'Descripcion': self.Descripcion,
            'Categoria': self.Categoria,
            'Tipo': self.Tipo,
            'Eficacia_Esperada': self.Eficacia_Esperada,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None
        }

class nivelesriesgo(db.Model):
    """Modelo para niveles de riesgo"""
    __tablename__ = 'nivelesriesgo'
    
    ID_NivelRiesgo = db.Column(db.Integer, primary_key=True)
    Nombre = db.Column(db.String(50), nullable=False)
    Valor_Min = db.Column(db.Integer)
    Valor_Max = db.Column(db.Integer)
    Color_Representacion = db.Column(db.String(50))
    Acciones_Sugeridas = db.Column(db.Text)
    Descripcion = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'ID_NivelRiesgo': self.ID_NivelRiesgo,
            'Nombre': self.Nombre,
            'Valor_Min': self.Valor_Min,
            'Valor_Max': self.Valor_Max,
            'Color_Representacion': self.Color_Representacion,
            'Acciones_Sugeridas': self.Acciones_Sugeridas,
            'Descripcion': self.Descripcion
        }

class evaluacion_riesgo_activo(db.Model):
    """Modelo para evaluaciones de riesgo por activo"""
    __tablename__ = 'evaluacion_riesgo_activo'
    
    id_evaluacion_riesgo_activo = db.Column(db.Integer, primary_key=True)
    ID_Riesgo = db.Column(db.Integer, db.ForeignKey('riesgos.ID_Riesgo'), nullable=False)
    ID_Activo = db.Column(db.Integer, db.ForeignKey('activos.ID_Activo'), nullable=False)
    id_nivel_probabilidad_inherente = db.Column(db.Integer, db.ForeignKey('niveles_probabilidad.ID_NivelProbabilidad'))
    id_nivel_impacto_inherente = db.Column(db.Integer, db.ForeignKey('niveles_impacto.ID_NivelImpacto'))
    id_nivel_riesgo_inherente_calculado = db.Column(db.Integer, db.ForeignKey('nivelesriesgo.ID_NivelRiesgo'))
    justificacion_evaluacion_inherente = db.Column(db.Text)
    fecha_evaluacion_inherente = db.Column(db.Date)
    id_evaluador_inherente = db.Column(db.Integer, db.ForeignKey('usuarios_sistema.id_usuario'))
    id_nivel_probabilidad_residual = db.Column(db.Integer, db.ForeignKey('niveles_probabilidad.ID_NivelProbabilidad'))
    id_nivel_impacto_residual = db.Column(db.Integer, db.ForeignKey('niveles_impacto.ID_NivelImpacto'))
    id_nivel_riesgo_residual_calculado = db.Column(db.Integer, db.ForeignKey('nivelesriesgo.ID_NivelRiesgo'))
    justificacion_evaluacion_residual = db.Column(db.Text)
    fecha_evaluacion_residual = db.Column(db.Date)
    id_evaluador_residual = db.Column(db.Integer, db.ForeignKey('usuarios_sistema.id_usuario'))
    fecha_creacion_registro = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id_evaluacion_riesgo_activo': self.id_evaluacion_riesgo_activo,
            'ID_Riesgo': self.ID_Riesgo,
            'ID_Activo': self.ID_Activo,
            'id_nivel_probabilidad_inherente': self.id_nivel_probabilidad_inherente,
            'id_nivel_impacto_inherente': self.id_nivel_impacto_inherente,
            'id_nivel_riesgo_inherente_calculado': self.id_nivel_riesgo_inherente_calculado,
            'justificacion_evaluacion_inherente': self.justificacion_evaluacion_inherente,
            'fecha_evaluacion_inherente': self.fecha_evaluacion_inherente.isoformat() if self.fecha_evaluacion_inherente else None,
            'id_evaluador_inherente': self.id_evaluador_inherente,
            'id_nivel_probabilidad_residual': self.id_nivel_probabilidad_residual,
            'id_nivel_impacto_residual': self.id_nivel_impacto_residual,
            'id_nivel_riesgo_residual_calculado': self.id_nivel_riesgo_residual_calculado,
            'justificacion_evaluacion_residual': self.justificacion_evaluacion_residual,
            'fecha_evaluacion_residual': self.fecha_evaluacion_residual.isoformat() if self.fecha_evaluacion_residual else None,
            'id_evaluador_residual': self.id_evaluador_residual,
            'fecha_creacion_registro': self.fecha_creacion_registro.isoformat() if self.fecha_creacion_registro else None,
            'fecha_ultima_actualizacion': self.fecha_ultima_actualizacion.isoformat() if self.fecha_ultima_actualizacion else None
        }

# ============================================================================
# MODELOS DE DOCUMENTOS
# ============================================================================

class DocumentoAdjunto(db.Model):
    """Modelo para documentos adjuntos"""
    __tablename__ = 'documentos_adjuntos'
    
    id = db.Column(db.Integer, primary_key=True)
    accion_id = db.Column(db.String(50), nullable=False, index=True)
    nombre_original = db.Column(db.String(255), nullable=False)
    nombre_archivo = db.Column(db.String(255), nullable=False, unique=True)
    tipo_mime = db.Column(db.String(100), nullable=False)
    tamaño_bytes = db.Column(db.BigInteger, nullable=False)
    ruta_archivo = db.Column(db.String(500), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_modificacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    subido_por = db.Column(db.Integer, db.ForeignKey('usuarios_auth.id_usuario_auth'), nullable=True)
    activo = db.Column(db.Boolean, default=True, nullable=False)
    
    def to_dict(self):
        from flask import request
        try:
            # Intentar generar URL absoluta
            if request:
                base_url = request.host_url.rstrip('/')
                url = f'{base_url}/api/documentos/descargar/{self.id}'
            else:
                # Si no hay request context, usar URL relativa
                url = f'/api/documentos/descargar/{self.id}'
        except Exception as e:
            # Si hay error, usar URL relativa
            url = f'/api/documentos/descargar/{self.id}'
        
        return {
            'id': self.id,
            'accion_id': self.accion_id,
            'nombre': self.nombre_original,
            'nombre_original': self.nombre_original,
            'tipo': self.tipo_mime,
            'tamaño': self.tamaño_bytes,
            'tamaño_bytes': self.tamaño_bytes,
            'url': url,
            'fechaSubida': self.fecha_subida.isoformat() if self.fecha_subida else None,
            'fecha_subida': self.fecha_subida.isoformat() if self.fecha_subida else None,
            'descripcion': self.descripcion,
            'subido_por': self.subido_por,
            'activo': self.activo
        }
    
    @classmethod
    def crear_documento(cls, accion_id, nombre_original, nombre_archivo, tipo_mime, 
                       tamaño_bytes, ruta_archivo, descripcion=None, subido_por=None):
        documento = cls(
            accion_id=accion_id,
            nombre_original=nombre_original,
            nombre_archivo=nombre_archivo,
            tipo_mime=tipo_mime,
            tamaño_bytes=tamaño_bytes,
            ruta_archivo=ruta_archivo,
            descripcion=descripcion,
            subido_por=subido_por
        )
        db.session.add(documento)
        db.session.commit()
        return documento
    
    @classmethod
    def obtener_por_accion(cls, accion_id):
        return cls.query.filter_by(accion_id=accion_id, activo=True).all()
    
    @classmethod
    def obtener_por_id(cls, documento_id):
        return cls.query.filter_by(id=documento_id, activo=True).first()
    
    @classmethod
    def eliminar_documento(cls, documento_id):
        documento = cls.query.get(documento_id)
        if documento:
            documento.activo = False
            db.session.commit()
            return True
        return False
