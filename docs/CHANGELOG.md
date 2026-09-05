# Registro de Cambios y Versiones (CHANGELOG) - PINTU CLIC

Todas las modificaciones, nuevas funcionalidades y refactorizaciones del proyecto deben registrarse en este archivo siguiendo el estándar [SemVer](https://semver.org/lang/es/) y la [Guía de Versionado y Walkthroughs](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md).

> Formato de Versiones: `[vMAJOR.MINOR.PATCH] - AAAA-MM-DD`

## [v1.5.4] - 2026-09-05
### Módulo: Core Backend e Infraestructura de Base de Datos
- **Alcance:** Creación del script automatizado de despliegue y verificación de base de datos (`backend/src/core/db/setup.ts`) invocable mediante `npm run db` (o `npm run db:setup` / `npm run db:init`).
- **Hitos Clave:**
  - Ejecución integral del script DDL oficial (`bd/sql/schema_pintuclic.sql`) conectando por pool de PostgreSQL e inspeccionando `information_schema.tables`.
  - Verificación automática de integridad para las 31 tablas operativas (incluyendo `sesion` y las entidades de Habeas Data).
  - Configuración del archivo `backend/.env` local para conexión a PostgreSQL.
- **Estado:** ✅ Validado y ejecutado con éxito en PostgreSQL local (31 tablas creadas en 0.19s); compilación `tsc` y linter limpios.

---

## [v1.5.3] - 2026-09-05
### Módulo: BD (Base de Datos v2.3) y Privacidad (Habeas Data - M20 / HU-SEG-05)
- **Alcance:** Actualización a la versión 2.3 del esquema relacional (31 tablas) con la incorporación de entidades de aviso de privacidad, consentimiento auditable y radicación de solicitudes de supresión de datos personales (Habeas Data). Sincronización completa de tipos Kysely en `backend/src/core/db/types.ts` preservando intacta la tabla `sesion` (v2.2).
- **Hitos Clave:**
  - Nuevas tablas: `aviso_privacidad`, `consentimiento_usuario` y `solicitud_supresion`.
  - Nuevo enumerado nativo: `enum_estado_solicitud_supresion`.
  - Índices optimizados para auditoría de consentimientos y tramitación de supresiones.
- **Estado:** ✅ Compilación limpia con `npx tsc --noEmit` y linter sin errores.
- 🔗 **Walkthrough Técnico BD v2.3:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versión-23-2026-09-05)

---

## [v1.5.2] - 2026-09-05
### Módulo: Especificación Funcional de Negocio (M01, M02, M05, M08)
- **Alcance:** Especificación funcional formal, historias de usuario y diagramas de arquitectura de flujo para Catálogo, Búsqueda, Carrito y Órdenes de venta.
- **Hitos Clave:**
  - Especificación de Catálogo (`M01`): jerarquía, atributos técnicos, marcas, líneas, colores CIELAB y productos entonables (`HU-CAT-01` a `13`).
  - Especificación de Búsqueda y Navegación (`M02`): filtros facetados, ordenamiento y catálogo público (`HU-BUS-01` a `04`).
  - Especificación de Carrito (`M05`) y Órdenes de Venta (`M08`): snapshot inmutable y ciclo de vida de la orden (`HU-ORD-01` a `07`).
  - Incorporación de 15 diagramas de flujo y arquitectura en `docs/assets/diagrams/`.
- 🔗 **Especificaciones:** Ver [M01](./02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md), [M02](./02_MODULOS_FUNCIONALES/M02_ESPECIFICACION_BUSQUEDA.md), [M05](./02_MODULOS_FUNCIONALES/M05_ESPECIFICACION_CARRITO.md) y [M08](./02_MODULOS_FUNCIONALES/M08_ESPECIFICACION_ORDEN.md).

---

## [v1.5.1] - 2026-09-05
### Módulo: 00_SISTEMA, Gobernanza de Calidad (Reviews) y Refactorización M20 (DTOs)
- **Alcance:** Desacoplamiento estricto de esquemas Zod (runtime) de contratos e interfaces estáticas en el módulo `m20-seguridad`, estandarización de la carpeta obligatoria `dtos/` en la arquitectura backend y formalización del sistema de auditoría técnica en `docs/reviews/`.
- **Añadido:**
  - `docs/reviews/`: Directorio central de auditoría técnica y code reviews del Tech Lead (`README.md`, `backend/`, `frontend/`).
  - `docs/reviews/backend/review_v1.5.0_M20_seguridad.md`: Primer informe formal de code review evaluando M20, justificando el desacoplamiento de DTOs y emitiendo dictamen de aprobación.
  - `backend/src/modules/m20-seguridad/dtos/`: Carpeta modular dedicada a esquemas Zod y tipos inferidos (`seguridad.dto.ts`, `index.ts`).
- **Ajustado:**
  - `backend/src/modules/m20-seguridad/interfaces/seguridad.interfaces.ts`: Purificación a tipos y contratos de dominio TypeScript 100% libres de dependencias de Zod en runtime.
  - `backend/src/modules/m20-seguridad/controllers/seguridad.controller.ts` y `services/`: Actualizadas importaciones hacia la capa `dtos`.
  - `backend/infraestructura.md`: Actualizada la especificación arquitectónica consagrando la carpeta `dtos/` separada de `interfaces/` para todos los módulos del proyecto.
  - `docs/README.md`: Registro de `docs/reviews/` y `docs/walkthroughs/` en el árbol de gobernanza del sistema.
- **Estado:** ✅ Compilación limpia con `npx tsc --noEmit` y `npm run lint` en backend con cero errores.

---

## [v1.5.0] - 2026-09-05
### Módulo: M20 (Seguridad, Auditoría y Protección de Datos) + BD v2.2
- **Alcance:** Primera entrega funcional de M20 (HU-SEG-01, HU-SEG-02, HU-SEG-03, HU-SEG-06) e incorporación de la tabla `sesion` en el esquema de base de datos v2.2 (28 tablas).
- **Hitos Clave:**
  - Validador central de autorización en servidor y guardas reutilizables (`sesionVigente`, `requierePermiso`, `requiereTitularidad`, `protegido`).
  - Hashing seguro con BCrypt (costo 12) y saneamiento recursivo de credenciales en respuestas HTTP.
  - Sesiones con estado persistidas en PostgreSQL (`sesion` con UUID) y resolución de permisos en tiempo real.
- **Estado:** ✅ `tsc --noEmit` y `npm run lint` limpios; 28 pruebas de integración ejecutadas contra PostgreSQL 18.
- 🔗 **Walkthrough Técnico M20:** [walkthrough_v1.5.0_M20_seguridad.md](./walkthroughs/M20/walkthrough_v1.5.0_M20_seguridad.md)
- 🔗 **Walkthrough Técnico BD v2.2:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versión-22-2026-09-05)

---

## [v1.4.0] - 2026-09-04
### Módulo: BD (Base de Datos v2.1) y Core Backend
- **Alcance:** Actualización a la versión 2.1 del esquema relacional (27 tablas) y sincronización de tipos Kysely en `backend/src/core/db/types.ts`.
- **Hitos Clave:**
  - Patrón de e-commerce inmutable para ventas (`orden` y `linea_orden`).
  - Desacoplamiento de cotizaciones comerciales B2B/B2C (`cotizacion`).
  - Carrito vivo con soporte para visitantes anónimos (`token_visitante`) y variantes (`linea_carrito`).
  - Clasificación de tipo de cuenta (`enum_tipo_usuario`).
- **Estado:** ✅ Compilación limpia con `npx tsc --noEmit` en backend; orden topológico validado.
- 🔗 **Walkthrough Técnico BD v2.1:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versión-21-2026-09-04)

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
### Módulo: BD (Base de Datos v2.0) y Reorganización Modular
- **Alcance:** Actualización a la versión 2.0 del esquema relacional (25 tablas), reorganización de la carpeta `bd/` (`sql/`, `docs/`, `assets/`) y unificación de `docs/`.
- **Hitos Clave:** Catálogo de 4 niveles (`categoria` $\rightarrow$ `subcategorias` $\rightarrow$ `sub_subcategorias` $\rightarrow$ `linea`), variantes por color/tono, combos y 8 ENUMs nativos.
- **Estado:** ✅ DDL validado, orden topológico comprobado y rutas de documentación unificadas.
- 🔗 **Walkthrough Técnico BD v2.0:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versión-20-2026-09-03)

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
