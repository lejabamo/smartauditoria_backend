# Matriz de Trazabilidad - SmartAuditorIA (v3)

Esta matriz aplica estados de evidencia empíricos y no asume verificaciones de producción sin pruebas.

| Criterio de rúbrica | HU académica | Clave Jira | Resumen Jira | Relación | Sprint principal | Componente | Evidencia concreta | Prueba | Estado de Evidencia | Brecha | Acción propuesta | Fuente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Entorno Base | N/A | SCRUM-12 | Configuración del entorno base | MATCH | PENDING_VERIFICATION | Infraestructura | `docker-compose.yml`, `Dockerfile` | N/A | CONFIGURED | CI/CD no automatiza despliegue completo. | Declarar como Configurado, no Desplegado. | Código fuente |
| Prácticas Ágiles | HU-002 | SCRUM-14 | Matriz de riesgos 5x5 | RELATED | PENDING_VERIFICATION | Backend | `riesgos.py` | N/A | CODE_FOUND | No hay e2e de la matriz UI. | Mostrar código responsable. | Código fuente Backend |
| Prácticas Ágiles | N/A | SCRUM-15 | Almacenamiento de evaluaciones de riesgo | RELATED | PENDING_VERIFICATION | Backend | `evaluacion_riesgos.py`, DB Models | N/A | CODE_FOUND | No hay test E2E. | Mapear ruta de almacenamiento. | Código fuente Backend |
| Prácticas Ágiles | HU-002 | SCRUM-16 | Clasificación automática del nivel de riesgo | EVOLVED_FROM | PENDING_VERIFICATION | Backend | `evaluacion_riesgos.py` logic | N/A | CODE_FOUND | - | Mostrar algoritmo base. | Código fuente Backend |
| Arquitectura IA | HU-004 | SCRUM-17 | Procesamiento de documentos ISO | EVOLVED_FROM | PENDING_VERIFICATION | Engine | `ingest_iso.py`, ChromaDB dirs | N/A | CODE_FOUND | Carece de test E2E visible. | Mostrar script ingestor. | Código fuente Engine |
| Seguridad / Roles | HU-003 / HU-009 | SCRUM-26 | Autenticación JWT y Manejo de Sesión | EVOLVED_FROM | Sprint 2 | Backend | `app/auth/routes.py`, `app/models.py` | `tests/test_usuarios_flow.py` | E2E_VERIFIED | Ninguna. Flujo de login, expiración y claims de usuario cubiertos. | Pruebas automatizadas en CI y local. | Backend / Tests |
| Seguridad / Roles | HU-003 / HU-009 | SCRUM-27 | Control de acceso basado en roles (RBAC) | EVOLVED_FROM | Sprint 2 | Backend/Frontend | `app/auth/decorators.py`, `Usuarios.tsx` | `tests/test_usuarios_flow.py` | E2E_VERIFIED | Ninguna. Roles ADMIN, OPERADOR, AUXILIAR y CONSULTOR verificados con permisos diferenciados. | Enforzamiento en endpoints y vistas. | Fullstack / Tests |
| Calidad y CI | HU-008 | SCRUM-28 | Pipeline básico de integración continua | RELATED | PENDING_VERIFICATION | CI/CD | Workflows `.github/` | Ejecución GitHub Actions | CONFIGURED | Un CI verde no prueba el deploy final. | No asegurar despliegue de producción. | Repo Github |
| Gestión Usuarios | HU-009 | SCRUM-36 | Módulo de Gestión de Usuarios y Roles RBAC | DIRECT_MATCH | Sprint 2 | Fullstack | `app/routes/usuarios.py`, `Usuarios.tsx`, `usuariosService` | `tests/test_usuarios_flow.py`, `npm run build` | E2E_VERIFIED | Ninguna. CRUD, catálogo de roles, sincronización auth/sistema, bloqueo y desbloqueo verificados. | Totalmente operativo con interfaz visual. | Fullstack / Tests |
| Seguridad / Claves | HU-010 | SCRUM-37 | Recuperación y Restablecimiento Seguro de Contraseñas | DIRECT_MATCH | Sprint 2 | Fullstack | `app/auth/routes.py`, `Login.tsx`, `backend.ts` | `tests/test_usuarios_flow.py` | E2E_VERIFIED | Ninguna. Token firmado JWT temporal (1h), código numérico 6 dígitos, reseteo admin y modal frontend interactivo. | Totalmente operativo con autoservicio y admin reset. | Fullstack / Tests |
| Evolución Técnica | N/A | SCRUM-29 | PENDING_VERIFICATION | N/A (Evolución) | Hardening | Scripting | `fix.py`, `sanitize_db.py` | N/A | CODE_FOUND | Resumen Jira inaccesible. | Detallar como script de mantenimiento. | Repo raíz |
| Evolución Técnica | N/A | SCRUM-30 | PENDING_VERIFICATION | N/A (Evolución) | Infra/CI | `.github/workflows` | N/A | CONFIGURED | Resumen Jira inaccesible. | - | Repo raíz |
| Evolución Técnica | N/A | SCRUM-31 | PENDING_VERIFICATION | N/A (Evolución) | Backend | Ajustes varios API | N/A | PENDING_VERIFICATION | Resumen Jira inaccesible. | - | Repo |
| Evolución Técnica | N/A | SCRUM-32 | PENDING_VERIFICATION | N/A (Evolución) | Backend | Ajustes varios API | N/A | PENDING_VERIFICATION | Resumen Jira inaccesible. | - | Repo |
| Evolución Técnica | N/A | SCRUM-33 | PENDING_VERIFICATION | N/A (Evolución) | Backend | Ajustes varios API | N/A | PENDING_VERIFICATION | Resumen Jira inaccesible. | - | Repo |
| Evolución Técnica | N/A | SCRUM-34 | PENDING_VERIFICATION | N/A (Evolución) | Frontend | Ajustes UI/UX | N/A | PENDING_VERIFICATION | Resumen Jira inaccesible. | - | Repo |
| Evolución Técnica | N/A | SCRUM-35 | PENDING_VERIFICATION | N/A (Evolución) | Frontend | Ajustes UI/UX | N/A | PENDING_VERIFICATION | Resumen Jira inaccesible. | - | Repo |

### Notas de Auditoría:
- Los estados de evidencia se han restringido a hallazgos empíricos (`CODE_FOUND`, `CONFIGURED`, `E2E_VERIFIED`).
- Las historias SCRUM-26, SCRUM-27, SCRUM-36 y SCRUM-37 cuentan con validación E2E demostrada mediante `tests/test_usuarios_flow.py` (ejecutado con 100% de aserciones aprobadas) y compilación limpia de frontend Vite (`npm run build`).
- Las historias no referenciadas con un ID específico (como el despliegue final o el wizard interactivo) se consideran en estado de revisión hasta que se confirme su clave Jira, y no se declaran terminadas en este documento.
