# Registro de Cambios y Versiones (CHANGELOG) - PINTU CLIC

Todas las modificaciones, nuevas funcionalidades y refactorizaciones del proyecto deben registrarse en este archivo siguiendo el estándar [SemVer](https://semver.org/lang/es/) y la [Guía de Versionado y Walkthroughs](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md).

> Formato de Versiones: `[vMAJOR.MINOR.PATCH] - AAAA-MM-DD`

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
