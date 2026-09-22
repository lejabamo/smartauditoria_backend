-- ============================================================================
-- 004_catalogo_iso27002_2022_soa.sql
-- Catálogo Completo Oficial de los 93 Controles de ISO/IEC 27002:2022 para SoA
-- ============================================================================

INSERT INTO controles (codigo_control_iso, Nombre, Descripcion, categoria_control_iso, Tipo_Control, Formalidad_Control, estado_implementacion, efectividad_control_evaluada)
VALUES
-- ============================================================================
-- CLÁUSULA 5: CONTROLES ORGANIZACIONALES (37 controles)
-- ============================================================================
('A.5.1', 'Políticas para la seguridad de la información', 'Definición, aprobación, publicación y revisión periódica de directrices de seguridad.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.2', 'Roles y responsabilidades de seguridad de la información', 'Asignación formal de responsabilidades de seguridad según necesidades institucionales.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.3', 'Segregación de funciones', 'Separación de deberes y áreas de responsabilidad para reducir riesgos de error o fraude.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.4', 'Responsabilidades de la dirección', 'Requerimiento a la dirección para que el personal aplique la seguridad según políticas.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Media'),
('A.5.5', 'Contacto con autoridades', 'Mantenimiento de canales y contactos adecuados con autoridades relevantes y reguladores.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.6', 'Contacto con grupos de interés especial', 'Participación en grupos de interés, asociaciones profesionales y foros de seguridad.', 'Organizacional', 'Preventivo', 'Informal', 'Parcialmente Implementado', 'Baja'),
('A.5.7', 'Inteligencia sobre amenazas', 'Recopilación y análisis de información sobre amenazas para mitigar riesgos oportunamente.', 'Organizacional', 'Preventivo', 'Mixto', 'En Diseno', 'Media'),
('A.5.8', 'Seguridad de la información en la gestión de proyectos', 'Integración de requisitos de seguridad en la planificación y ejecución de proyectos.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.9', 'Inventario de información y otros activos asociados', 'Identificación y mantenimiento actualizado del inventario de activos según DAFP V7.', 'Organizacional', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.5.10', 'Uso aceptable de información y otros activos asociados', 'Reglas para el uso aceptable de activos de información y recursos tecnológicos.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Media'),
('A.5.11', 'Devolución de activos', 'Procedimiento para devolución de activos al terminar la relación contractual o empleo.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.12', 'Clasificación de la información', 'Clasificación según confidencialidad, integridad, disponibilidad y Ley 1712.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.13', 'Etiquetado de la información', 'Procedimientos para el etiquetado físico y digital conforme a la clasificación.', 'Organizacional', 'Preventivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.5.14', 'Transferencia de información', 'Reglas y acuerdos para la transferencia segura de información interna y externa.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.15', 'Control de acceso', 'Reglas lógicas y físicas para restringir acceso según el principio de menor privilegio.', 'Organizacional', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.5.16', 'Gestión de identidades', 'Gestión del ciclo de vida de identidades digitales de usuarios institucionales.', 'Organizacional', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.5.17', 'Información de autenticación', 'Gestión y control de contraseñas y factores de autenticación seguros.', 'Organizacional', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.5.18', 'Derechos de acceso', 'Asignación, revisión y revocación periódica de privilegios de acceso a sistemas.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.19', 'Seguridad de la información en relaciones con proveedores', 'Políticas y requisitos de seguridad contractuales para terceros y proveedores.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.20', 'Abordaje de la seguridad en acuerdos con proveedores', 'Inclusión de acuerdos de nivel de servicio y confidencialidad con proveedores.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.21', 'Gestión de la seguridad en la cadena de suministro de TIC', 'Monitoreo y mitigación de riesgos derivados de la cadena de suministro de hardware/software.', 'Organizacional', 'Preventivo', 'Formal', 'En Diseno', 'Baja'),
('A.5.22', 'Monitoreo, revisión y gestión del cambio en servicios de proveedores', 'Supervisión regular del cumplimiento de proveedores y control de cambios en servicios.', 'Organizacional', 'Detectivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.23', 'Seguridad en el uso de servicios en la nube', 'Procesos de adquisición, uso, gestión y salida de plataformas y servicios cloud.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.24', 'Planificación y preparación para la gestión de incidentes', 'Establecimiento de procedimientos y equipo de respuesta a incidentes de seguridad (CSIRT).', 'Organizacional', 'Correctivo', 'Formal', 'Implementado', 'Alta'),
('A.5.25', 'Evaluación y decisión sobre eventos de seguridad', 'Criterios de evaluación y categorización de eventos para declarar incidentes de seguridad.', 'Organizacional', 'Detectivo', 'Formal', 'Implementado', 'Media'),
('A.5.26', 'Respuesta a incidentes de seguridad', 'Ejecución coordinada de contención, erradicación y recuperación de incidentes.', 'Organizacional', 'Correctivo', 'Formal', 'Implementado', 'Alta'),
('A.5.27', 'Aprendizaje de los incidentes de seguridad', 'Análisis de causas raíz y lecciones aprendidas para mejorar los controles del SGSI.', 'Organizacional', 'Correctivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.28', 'Recolección de evidencia', 'Identificación, recolección y preservación de evidencia digital admisible en procesos legales.', 'Organizacional', 'Correctivo', 'Formal', 'En Diseno', 'Baja'),
('A.5.29', 'Seguridad de la información durante la disrupción', 'Continuidad de la seguridad durante situaciones de emergencia o interrupción operativa.', 'Organizacional', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.30', 'Preparación de las TIC para la continuidad del negocio', 'Objetivos de tiempo de recuperación (RTO) y punto de recuperación (RPO) en plataformas TIC.', 'Organizacional', 'Preventivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.5.31', 'Requisitos legales, estatutarios, reglamentarios y contractuales', 'Identificación y cumplimiento de normativa legal (Ley 1712, Ley 1581, DAFP MIPG).', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.32', 'Derechos de propiedad intelectual', 'Protección de software bajo licencia y cumplimiento de derechos de autor y patentes.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.33', 'Protección de registros', 'Protección de registros contra pérdida, destrucción, falsificación o acceso no autorizado.', 'Organizacional', 'Preventivo', 'Mixto', 'Implementado', 'Alta'),
('A.5.34', 'Privacidad y protección de datos personales (PII)', 'Cumplimiento estricto de la Ley 1581 de 2012 y política de protección de datos personales.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.5.35', 'Revisión independiente de la seguridad de la información', 'Auditorías internas y externas independientes al SGSI para verificar eficacia.', 'Organizacional', 'Detectivo', 'Formal', 'Implementado', 'Alta'),
('A.5.36', 'Cumplimiento con políticas y normas de seguridad', 'Revisiones regulares de los administradores sobre el cumplimiento de estándares y guías.', 'Organizacional', 'Detectivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.5.37', 'Procedimientos operativos documentados', 'Elaboración y mantenimiento de procedimientos documentados para operaciones del sistema.', 'Organizacional', 'Preventivo', 'Formal', 'Implementado', 'Alta'),

-- ============================================================================
-- CLÁUSULA 6: CONTROLES DE PERSONAS (8 controles)
-- ============================================================================
('A.6.1', 'Selección de personal', 'Verificación de antecedentes y validación de competencias antes de la contratación.', 'Personas', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.6.2', 'Términos y condiciones de empleo', 'Acuerdos de confidencialidad y cláusulas de responsabilidad en contratos laborales.', 'Personas', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.6.3', 'Concientización, educación y formación en seguridad', 'Campañas periódicas de capacitación y entrenamiento en seguridad y phishing.', 'Personas', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.6.4', 'Proceso disciplinario', 'Proceso formal para sancionar violaciones a las políticas de seguridad de la entidad.', 'Personas', 'Disuasorio', 'Formal', 'Implementado', 'Alta'),
('A.6.5', 'Responsabilidades después de la terminación o cambio', 'Vigencia de la confidencialidad tras la desvinculación laboral o cambio de rol.', 'Personas', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.6.6', 'Acuerdos de confidencialidad o no divulgación (NDA)', 'Formalización de acuerdos NDA con empleados, contratistas y terceros externos.', 'Personas', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.6.7', 'Trabajo remoto', 'Directrices y medidas de seguridad para teletrabajo, VPN y dispositivos remotos.', 'Personas', 'Preventivo', 'Mixto', 'Implementado', 'Alta'),
('A.6.8', 'Reporte de eventos de seguridad de la información', 'Mecanismo formal y accesible para que el personal reporte incidentes o anomalías.', 'Personas', 'Detectivo', 'Mixto', 'Implementado', 'Alta'),

-- ============================================================================
-- CLÁUSULA 7: CONTROLES FÍSICOS (14 controles)
-- ============================================================================
('A.7.1', 'Perímetros de seguridad física', 'Barreras físicas, muros y puertas para proteger áreas que albergan activos críticos.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.7.2', 'Entrada física', 'Control de acceso biométrico, tarjetas magnéticas y registro de visitantes.', 'Fisico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.7.3', 'Seguridad de oficinas, despachos y recursos', 'Protección física de oficinas y espacios donde se procesa información institucional.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Media'),
('A.7.4', 'Monitoreo de seguridad física', 'Sistemas de circuito cerrado de televisión (CCTV) y vigilancia 24/7.', 'Fisico', 'Detectivo', 'Automatizado', 'Implementado', 'Alta'),
('A.7.5', 'Protección contra amenazas físicas y ambientales', 'Sistemas contra incendios, inundaciones, sismos y acondicionamiento climático.', 'Fisico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.7.6', 'Trabajo en áreas seguras', 'Procedimientos y restricciones para el trabajo en centros de datos o bóvedas.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Media'),
('A.7.7', 'Escritorio limpio y pantalla limpia', 'Política de bloqueo de pantalla y no dejar documentos sensibles en escritorios.', 'Fisico', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.7.8', 'Emplazamiento y protección de equipos', 'Ubicación estratégica de equipos para reducir riesgos ambientales y visuales.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.7.9', 'Seguridad de los activos fuera de las instalaciones', 'Protección de portátiles y medios que se transportan fuera de la institución.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Media'),
('A.7.10', 'Medios de almacenamiento', 'Gestión, custodia, transporte y borrado seguro de discos y medios extraíbles.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.7.11', 'Servicios de suministro', 'Protección contra cortes de energía eléctrica (UPS, plantas eléctricas) y servicios básicos.', 'Fisico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.7.12', 'Seguridad del cableado', 'Protección de cableado de telecomunicaciones y energía contra daño o interceptación.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.7.13', 'Mantenimiento de equipos', 'Mantenimiento preventivo periódico para garantizar disponibilidad de hardware.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.7.14', 'Eliminación segura o reutilización de equipos', 'Desmagnetización y borrado seguro antes de donar, destruir o reciclar equipos.', 'Fisico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),

-- ============================================================================
-- CLÁUSULA 8: CONTROLES TECNOLÓGICOS (34 controles)
-- ============================================================================
('A.8.1', 'Dispositivos de usuario final', 'Configuración segura, cifrado y políticas de endpoint en portátiles y móviles.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.2', 'Derechos de acceso privilegiado', 'Restricción y control riguroso de cuentas de superusuario y administradores.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.3', 'Restricción del acceso a la información', 'Control de permisos según roles y clasificación de expedientes en servidores.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.4', 'Acceso al código fuente', 'Control estricto de repositorios Git y protección del código fuente misional.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.5', 'Autenticación segura', 'Implementación de autenticación multifactor (MFA) en accesos clave y remotos.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.6', 'Gestión de capacidad', 'Monitoreo de almacenamiento, CPU y ancho de banda para prevenir saturación.', 'Tecnologico', 'Detectivo', 'Automatizado', 'Implementado', 'Media'),
('A.8.7', 'Protección contra malware', 'Despliegue de antivirus / EDR con actualización automática de firmas y heurística.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.8', 'Gestión de vulnerabilidades técnicas', 'Escaneo regular de vulnerabilidades y aplicación oportuna de parches de seguridad.', 'Tecnologico', 'Preventivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.8.9', 'Gestión de la configuración', 'Líneas base de configuración segura y hardening en servidores y sistemas operativos.', 'Tecnologico', 'Preventivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.8.10', 'Eliminación de información', 'Procedimientos seguros de purga y eliminación lógica conforme a retención TRD.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Parcialmente Implementado', 'Media'),
('A.8.11', 'Enmascaramiento de datos', 'Anonimización y enmascaramiento de datos sensibles en entornos de prueba.', 'Tecnologico', 'Preventivo', 'Automatizado', 'En Diseno', 'Baja'),
('A.8.12', 'Prevención de fuga de datos (DLP)', 'Controles de monitoreo y bloqueo de exfiltración de información confidencial.', 'Tecnologico', 'Preventivo', 'Automatizado', 'En Diseno', 'Baja'),
('A.8.13', 'Copia de seguridad de la información', 'Copias de seguridad regulares, cifradas y pruebas periódicas de restauración.', 'Tecnologico', 'Correctivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.14', 'Redundancia de las instalaciones de procesamiento', 'Arquitectura de alta disponibilidad y contingencia para servicios misionales.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Parcialmente Implementado', 'Media'),
('A.8.15', 'Registro de eventos (Logging)', 'Generación y almacenamiento centralizado de logs de acceso, auditoría y errores.', 'Tecnologico', 'Detectivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.16', 'Actividades de monitoreo', 'Monitoreo continuo de tráfico de red, comportamiento anómalo y eventos en el SIEM.', 'Tecnologico', 'Detectivo', 'Automatizado', 'Parcialmente Implementado', 'Media'),
('A.8.17', 'Sincronización del reloj', 'Sincronización horaria (NTP) de todos los servidores y equipos con fuentes oficiales.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.18', 'Uso de programas de utilidad privilegiados', 'Restricción de herramientas de diagnóstico capaces de eludir controles del sistema.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Media'),
('A.8.19', 'Instalación de software en sistemas operativos', 'Restricción de permisos para que usuarios no instalen software no autorizado.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.20', 'Seguridad en redes', 'Segmentación por VLANs, DMZ y cifrado de comunicaciones en tránsito.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.21', 'Seguridad en los servicios de red', 'Garantía de acuerdos de seguridad con proveedores de conectividad e internet.', 'Tecnologico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.8.22', 'Segregación de redes', 'Aislamiento de redes de producción, administración, invitados y DMZ.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.23', 'Filtrado web', 'Bloqueo de sitios maliciosos, descargas peligrosas y contenido inadecuado.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.24', 'Uso de criptografía', 'Cifrado de datos en reposo y en tránsito con algoritmos seguros y gestión de llaves.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.25', 'Ciclo de vida de desarrollo seguro', 'Metodología de desarrollo de software seguro (DevSecOps) y revisión de código.', 'Tecnologico', 'Preventivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.8.26', 'Requisitos de seguridad en aplicaciones', 'Definición de requerimientos de seguridad para nuevos aplicativos institucionales.', 'Tecnologico', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.8.27', 'Principios de arquitectura e ingeniería de sistemas seguros', 'Diseño de arquitecturas de software aplicando defensa en profundidad.', 'Tecnologico', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.8.28', 'Codificación segura', 'Capacitación y directrices de código seguro basadas en OWASP Top 10.', 'Tecnologico', 'Preventivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.8.29', 'Pruebas de seguridad en desarrollo y aceptación', 'Pruebas de vulnerabilidad (DAST/SAST) y ethical hacking antes de paso a producción.', 'Tecnologico', 'Detectivo', 'Mixto', 'Parcialmente Implementado', 'Media'),
('A.8.30', 'Desarrollo tercerizado', 'Supervisión y auditoría del código desarrollado por contratistas externos.', 'Tecnologico', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.8.31', 'Separación de entornos de desarrollo, prueba y producción', 'Aislamiento completo de ambientes para evitar afectaciones o fuga de datos.', 'Tecnologico', 'Preventivo', 'Automatizado', 'Implementado', 'Alta'),
('A.8.32', 'Gestión del cambio', 'Control formal y comité de cambios (CAB) antes de aplicar cambios en producción.', 'Tecnologico', 'Preventivo', 'Formal', 'Implementado', 'Alta'),
('A.8.33', 'Información de prueba', 'Uso de datos ficticios o anonimizados para pruebas de sistemas.', 'Tecnologico', 'Preventivo', 'Formal', 'Parcialmente Implementado', 'Media'),
('A.8.34', 'Protección de sistemas de información durante auditorías', 'Restricciones y salvaguardas para que las auditorías no degraden los servicios TIC.', 'Tecnologico', 'Preventivo', 'Formal', 'Implementado', 'Alta')
ON DUPLICATE KEY UPDATE
  Nombre = VALUES(Nombre),
  Descripcion = VALUES(Descripcion),
  categoria_control_iso = VALUES(categoria_control_iso),
  Tipo_Control = VALUES(Tipo_Control),
  Formalidad_Control = VALUES(Formalidad_Control);
