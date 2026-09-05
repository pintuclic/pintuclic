# Registro de Cambios y Versiones (CHANGELOG) - PINTU CLIC

Todas las modificaciones, nuevas funcionalidades y refactorizaciones del proyecto deben registrarse en este archivo siguiendo el estándar [SemVer](https://semver.org/lang/es/) y la [Guía de Versionado y Walkthroughs](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md).

> Formato de Versiones: `[vMAJOR.MINOR.PATCH] - AAAA-MM-DD`

## [v1.5.0] - 2026-09-05

> **Nota de integración:** esta entrega se numeró inicialmente como `v1.4.0` mientras estaba
> sin publicar. Al integrar `develop` se encontró que ese número ya estaba tomado por la
> actualización de BD a 27 tablas, así que pasa a `v1.5.0` y el esquema a `v2.2`. El
> criterio: quien no ha publicado es quien renumera.
### Módulo: M20 (Seguridad, Auditoría y Protección de Datos) + BD v2.1
- **Alcance:** Primera entrega funcional de M20. Instala el validador central de autorización del sistema, la política de credenciales, la gestión de sesiones con estado y la red transversal de no exposición de datos sensibles. Cubre **HU-SEG-01, HU-SEG-02, HU-SEG-03 y HU-SEG-06** en backend.
- **Añadido (base de datos, esquema v2.2 — 28 tablas):**
  - `bd/sql/schema_pintuclic.sql`: tabla `sesion` (UUID, tipo, fecha de inicio, último acceso, expiración, estado y motivo de cierre), 3 ENUM nuevos (`enum_estado_sesion`, `enum_tipo_sesion`, `enum_motivo_cierre_sesion`) y 2 índices. **Cambio de DDL autorizado explícitamente por el líder técnico.**
- **Añadido (backend):**
  - `backend/src/modules/m20-seguridad/`: módulo completo (interfaces + Zod, repositorios Kysely, servicios, guardas y controlador) con inyección de dependencias en `seguridad.routes.ts`.
  - Guardas centrales `sesionVigente`, `requierePermiso`, `requiereTitularidad` y `protegido`, exportados para que cualquier módulo proteja sus rutas sin escribir lógica propia (RNF-SEG-03-01).
  - Resolución de identidad y permisos EN VIVO contra PostgreSQL en cada petición: una cuenta desactivada o un permiso retirado surten efecto de inmediato (CA-SEG-02-04, CA-SEG-02-05, CA-SEG-03-04).
  - Sesiones persistidas: el JWT porta el claim `sid` y el guarda comprueba en cada petición que la sesión siga viva, de modo que un token ya emitido es revocable. Cierre manual, caducidad por inactividad, renovación deslizante de la vigencia e invalidación en bloque (RF-SEG-01-06, RF-SEG-02-06).
  - Respuesta uniforme ante denegación: un recurso ajeno responde igual que uno inexistente (RF-SEG-03-05, CA-SEG-03-06).
  - Endpoints `POST|GET|DELETE /api/seguridad/sesion`, `GET|DELETE /api/seguridad/sesiones`, `GET|PUT /api/seguridad/politica-sesion` y `PUT /api/seguridad/credenciales`.
  - `backend/src/core/utils/sanitize.ts`: saneamiento recursivo de campos de credencial (HU-SEG-06).
  - `docs/walkthroughs/M20/walkthrough_v1.5.0_M20_seguridad.md`: walkthrough oficial de la entrega.
- **Ajustado:**
  - `backend/src/core/db/types.ts`: `SesionTable`, tipos ENUM de sesión y registro en la interfaz `Database`.
  - `backend/src/core/utils/apiResponse.ts`: `sendSuccess` sanea la carga útil antes de serializarla.
  - `backend/src/core/middlewares/errorHandler.ts`: el detalle técnico se registra internamente y al navegador solo viaja un mensaje genérico (RF-SEG-06-04, CA-SEG-06-02). `EXPONER_DETALLE_ERRORES=true` lo reabre en local.
  - `backend/src/core/utils/jwt.ts` y `core/types/api.types.ts`: claim y campo `sid`, y `tipo_sesion` (aditivos).
  - `backend/src/app.routes.ts`: montaje de `/api/seguridad`.
- **Pendiente / Bloqueado:**
  - **HU-SEG-04 (auditoría): EN PAUSA** por decisión del Product Owner hasta definir la tabla de auditoría. Mientras tanto los accesos denegados se emiten al registro técnico con la forma que exige CA-SEG-03-05.
  - **HU-SEG-05 (protección de datos personales): BLOQUEADA**, requiere columnas de consentimiento en `usuario`.
  - `bd/docs/DOCUMENTACION_BASE_DATOS.md` y `WALKTHROUGH_DATABASE.md` siguen documentando 25 tablas: **corresponde al equipo de BD** actualizarlos a v2.1.
  - M17 debe sembrar el catálogo `permisos` (incluido `seguridad.configurar_sesion`) e invocar `invalidarSesionesDeUsuario(id, 'permisos_retirados')` al revocar permisos.
  - M04 debe consumir `serviciosSeguridad.sesion.abrirSesion()` en su login en lugar de firmar JWT por su cuenta.
- **Estado:** ✅ `tsc --noEmit` y `npm run lint` sin errores, DDL aplicado y dos tandas de pruebas de integración contra PostgreSQL 18.4: 16 sobre autorización y credenciales (identidad en vivo, permiso inactivo, cuenta desactivada, retiro y restitución de permisos en caliente, cambio de contraseña y saneamiento de respuestas) y 12 sobre sesiones persistidas (apertura, cierre manual, caducidad por inactividad, revocación en cascada, 3 sesiones simultáneas y renovación deslizante).

---

## [v1.4.0] - 2026-09-04
### Módulo: BD (Base de Datos) y Core Backend (Tipos Kysely v2.1)
- **Alcance:** Actualización a la versión 2.1 del esquema relacional (27 tablas), implementación del patrón de e-commerce inmutable para ventas (`orden` y `linea_orden`), cotizaciones B2B/B2C (`cotizacion`), carrito vivo con soporte para visitantes anónimos (`token_visitante`) y variantes (`linea_carrito`), clasificación `enum_tipo_usuario`, sincronización completa de tipos Kysely en `backend/src/core/db/types.ts` y walkthrough técnico en `bd/docs/WALKTHROUGH_DATABASE.md`.
- **Añadido:**
  - `bd/assets/ER Pintuclic.drawio.xml` y `bd/assets/ER Pintuclic-Final 1.1.drawio.png`: Diagramas Entidad-Relación actualizados con las 27 tablas y relaciones formales.
  - Tablas: `orden`, `linea_orden`, `linea_carrito`, `cotizacion`.
  - Tipos enumerados de PostgreSQL: `enum_tipo_usuario`, `enum_origen_orden`, `enum_estado_orden`, `enum_estado_cotizacion`.
- **Ajustado:**
  - `bd/sql/schema_pintuclic.sql`: Reemplazo de `pedido` por `orden`/`linea_orden` y de `detalle_carrito` por `linea_carrito`. Actualización de `usuario` (con `tipo`), `variante` (con `precio_vigente` y `estado`), `carrito` (con `token_visitante`), `pagos` y `factura` vinculados a `id_orden`. 29 claves foráneas e índices de rendimiento.
  - `bd/docs/WALKTHROUGH_DATABASE.md`: Registro oficial de la versión 2.1 con matriz de cambios, constraints, índices y plan de impacto.
  - `bd/docs/DOCUMENTACION_BASE_DATOS.md`: Diagrama Mermaid ER actualizado, changelog y diccionario de 27 tablas.
  - `backend/src/core/db/types.ts`: Sincronización completa de las 27 tablas y tipos helpers Kysely con cero errores de TypeScript (`tsc --noEmit`).
- **Estado:** ✅ Compilación limpia con `npx tsc --noEmit` en backend, orden topológico de BD validado sin dependencias circulares.

---

## [v1.3.0] - 2026-09-04
### Módulo: Frontend y Design System (Paleta Oficial de Colores)
- **Alcance:** Implementación y estandarización de los tokens de color globales de Pintuclic (`corporate`, `action`, `subaction`, `conversion`, `highlight`, `neutral-*`), integración con Tailwind CSS v4, directiva de diseño estricta en `AGENTS.md` y documentación técnica en `frontend/src/core/theme/`.
- **Añadido:**
  - `frontend/src/core/theme/colors.ts`: Constantes fuertemente tipadas de la paleta oficial (HEX).
  - `frontend/src/core/theme/index.ts`: Punto de exportación centralizado del tema.
  - `frontend/src/core/theme/GUIA_COLORES.md`: Manual de uso de clases Tailwind, tabla de roles y ejemplos de componentes.
- **Ajustado:**
  - `frontend/tailwind.config.ts`: Mapeo oficial de los tokens semánticos en el tema extendido.
  - `frontend/src/style.css`: Declaración de variables CSS nativas `@theme` para Tailwind CSS v4.
  - `frontend/src/App.vue`: Showcase interactivo demostrativo de los roles visuales.
  - `frontend/infraestructura.md`: Actualización de la arquitectura con el módulo `core/theme/` y la tabla oficial de colores.
  - `AGENTS.md`: Directiva crítica #8 con regla estricta de prohibición de colores arbitrarios.
- **Estado:** ✅ Validado con `npm run lint` y `npm run build` sin errores.

---

## [v1.2.0] - 2026-09-04
### Módulo: BD (Base de Datos) y Documentación Técnica
- **Alcance:** Actualización a la versión 2.0 del esquema relacional (25 tablas), reorganización modular del directorio `bd/`, documentación técnica, diagramas fuente y guía de refactorización para agentes de IA y desarrolladores.
- **Añadido:**
  - `bd/sql/schema_pintuclic.sql`: Script DDL PostgreSQL v2.0 (25 tablas, 8 ENUMs nativos, 27 FKs e índices de rendimiento).
  - `bd/docs/DOCUMENTACION_BASE_DATOS.md`: Especificación técnica del modelo, diagrama Mermaid ER, diccionario de datos y tabla sinóptica de versiones.
  - `bd/docs/WALKTHROUGH_DATABASE.md`: Registro histórico y técnico de migraciones (v1.0 $\rightarrow$ v2.0 con tablas nuevas, deprecadas, constraints e impacto en backend/frontend).
  - `bd/docs/GUIA_REFACTORIZACION_BD.md`: Instrucciones paso a paso, reglas de oro, checklist y plantilla oficial para futuras refactorizaciones.
  - `bd/assets/`: Recursos de diagramas ER (`ER_Pintuco.png`, `ER_Pintuco.drawio.xml`).
  - `bd/README.md`: Mapa general y accesos directos al módulo de base de datos.
- **Refactorizado:**
  - Estructuración del directorio `bd/` en subcarpetas semánticas (`sql/`, `docs/`, `assets/`).
  - Renombrado y estandarización global del directorio raíz de documentación: `equipo-2-doc/` $\rightarrow$ `docs/` para abarcar a toda la organización.
- **Estado:** ✅ DDL validado, orden topológico comprobado y rutas de documentación estandarizadas a `docs/`.

---

## [v1.1.1] - 2026-09-04
### Módulo: 00_SISTEMA y Calidad de Código (Linters)
- **Alcance:** Activación de restricción estricta contra tipos `any` explícitos en TypeScript para backend y frontend.
- **Añadido:**
  - `backend/eslint.config.mjs`: Configuración ESLint 9 + `typescript-eslint` con regla `@typescript-eslint/no-explicit-any: "error"`.
  - `frontend/eslint.config.js`: Configuración ESLint 9 + `typescript-eslint` + `eslint-plugin-vue` con regla `@typescript-eslint/no-explicit-any: "error"`.
  - Scripts `"lint"` y `"lint:fix"` en los `package.json` de backend y frontend.
- **Ajustado:**
  - `backend/src/core/db/connection.ts` y `auth.middleware.ts`: Tipado estricto de variables de error no utilizadas.
- **Estado:** ✅ Regla probada y validada activamente contra violaciones de tipo `any` en ambos entornos.

---

## [v1.1.0] - 2026-09-04
### Módulo: 00_SISTEMA y Core Backend / Infraestructura Docker
- **Alcance:** Implementación de la capa transversal `backend/src/core/` y refactorización de Dockerfiles para compilación limpia a producción.
- **Añadido:**
  - `backend/src/core/db/types.ts`: Tipado Kysely centralizado de las 25 tablas de la base de datos y 8 ENUMs nativos a partir de `schema_pintuclic.sql`.
  - `backend/src/core/db/connection.ts`: Conexión PostgreSQL con Kysely y fallback de entorno por defecto.
  - `backend/src/core/utils/crypto.ts`: Hashing seguro de contraseñas con BCrypt (costo 12, `HU-SEG-01`).
  - `backend/src/core/utils/jwt.ts` y middleware `auth.middleware.ts`: Gestión de sesiones y tokens seguros (`HU-SEG-02`).
  - `backend/src/core/middlewares/errorHandler.ts`: Manejador centralizado de excepciones y validaciones Zod con protección contra exposición de datos sensibles (`HU-SEG-06`).
  - `backend/src/core/middlewares/cors.middleware.ts`: CORS restrictivo.
  - `backend/src/app.routes.ts`: Enrutador global con endpoint `/api/health`.
  - `backend/.dockerignore` y `frontend/.dockerignore`: Prevención de filtración de `node_modules` del host a contenedores Linux.
- **Refactorizado:**
  - `backend/Dockerfile` y `Dockerfile.backend`: Multi-stage build con compilación estricta de TypeScript a JavaScript (`tsc` $\rightarrow$ `dist/`) y runtime mínimo con `node dist/index.js` bajo usuario no-root `USER node`.
  - `frontend/Dockerfile` y `Dockerfile.frontend`: Multi-stage build estandarizado con `npm ci` determinístico y servidor estático Nginx 1.27.
  - `backend/tsconfig.json`: Habilitados `rootDir` y `outDir` para compilación limpia en `/dist`.
- **Estado:** ✅ Compilación limpia con `tsc` y build verificado en backend y frontend.

---

## [v1.0.0] - 2026-09-01
### Módulo: 00_SISTEMA y Transversales (Línea Base del Proyecto)
- **Alcance:** Creación y formalización de la arquitectura documental, técnica y de seguridad de Pintu Clic.
- **Añadido:**
  - Definición del Stack Oficial: TypeScript, Express.js, Kysely, Zod, JWT, BCrypt, SMTP, CORS.
  - Protocolo y reglas obligatorias para Agentes de IA en `AGENTS.md`.
  - Matriz de trazabilidad y dependencias transversales en `MATRIZ_TRAZABILIDAD.md`.
  - Políticas de Unicidad (`HU-CUE-08`), Comprobación en Servidor (`HU-ADM-03`) y Datos Sensibles (`HU-SEG-06`).
  - Plantilla de Reporte de Pruebas QA (`PLANTILLA_REPORTE_QA_MODULO.md` / `.docx`).
  - Guía y Plantilla de Walkthroughs de Implementación (`PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md` / `.docx`).
- **Estado:** ✅ Línea Base Aprobada y Lista para Desarrollo de Módulos.
