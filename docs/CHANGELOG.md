# Registro de Cambios y Versiones (CHANGELOG) - PINTU CLIC

Todas las modificaciones, nuevas funcionalidades y refactorizaciones del proyecto deben registrarse en este archivo siguiendo el estÃ¡ndar [SemVer](https://semver.org/lang/es/) y la [GuÃ­a de Versionado y Walkthroughs](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md).

> Formato de Versiones: `[vMAJOR.MINOR.PATCH] - AAAA-MM-DD`

## [v1.6.0] - 2026-09-05
### MÃ³dulo: M17 (AdministraciÃ³n y Permisos - Frontend Core)
- **Alcance:** ImplementaciÃ³n de la infraestructura de autenticaciÃ³n simulada y comprobaciÃ³n reactiva de permisos (`useAuth`, `can()`) para frontend, integraciÃ³n del widget interactivo de desarrollo `DevRoleSwitcher` y publicaciÃ³n de la guÃ­a de testing de M17 para desacoplar el desarrollo de permisos de la pantalla de login (M04).
- **Hitos Clave:**
  - Composable `useAuth.ts` con persistencia en `localStorage`, roles tipados y catÃ¡logo de perfiles mock basado en el seed central.
  - Componente flotante `DevRoleSwitcher.vue` con alternador de identidades en 1 clic (Admin, Empleado Parcial, Cliente, Empresa).
  - GuÃ­a oficial de implementaciÃ³n y estÃ¡ndares visuales en `frontend/src/modules/m17-permisos/README.md`.
- **Estado:** âœ… Build de Vite (`npm run build`) y linter limpios; contenedor Docker verificado.
- ðŸ”— **Walkthrough TÃ©cnico M17 Frontend:** [walkthrough_v1.6.0_M17_auth_simulation_frontend.md](./walkthroughs/M17/walkthrough_v1.6.0_M17_auth_simulation_frontend.md)

---

## [v1.5.5] - 2026-09-05
### MÃ³dulo: Base de Datos y Calidad de Desarrollo (Mocks y Fixtures Centralizados)
- **Alcance:** UnificaciÃ³n del sistema de mocks de prueba en una Ãºnica fuente centralizada ([`bd/sql/seed_pintuclic.sql`](../bd/sql/seed_pintuclic.sql)), eliminaciÃ³n definitiva de la carpeta aislada `backend/src/modules/m20-seguridad/__fixtures__`, creaciÃ³n del ejecutor `npm run db:seed` y publicaciÃ³n de la [GuÃ­a de Mocks y Datos de Prueba](../bd/docs/GUIA_MOCKS_Y_DATOS_PRUEBA.md).
- **Hitos Clave:**
  - Siembra integral e idempotente de datos en las **31 tablas** del esquema relacional (79 registros de prueba vinculados).
  - EliminaciÃ³n de dependencias dispersas en `m20-seguridad/__fixtures__` concentrando toda la data en la capa `bd/`.
  - InclusiÃ³n de comandos `db:seed` y `db:reset` en `backend/package.json`.
  - PublicaciÃ³n de [`GUIA_MOCKS_Y_DATOS_PRUEBA.md`](../bd/docs/GUIA_MOCKS_Y_DATOS_PRUEBA.md) con roles, credenciales (`Pintuclic2026`) y catÃ¡logo de testing.
- **Estado:** âœ… Validado contra PostgreSQL local con 31 tablas verificadas; `tsc --noEmit` y `eslint` limpios.

---

## [v1.5.4] - 2026-09-05
### MÃ³dulo: Core Backend e Infraestructura de Base de Datos
- **Alcance:** CreaciÃ³n del script automatizado de despliegue y verificaciÃ³n de base de datos (`backend/src/core/db/setup.ts`) invocable mediante `npm run db` (o `npm run db:setup` / `npm run db:init`).
- **Hitos Clave:**
  - EjecuciÃ³n integral del script DDL oficial (`bd/sql/schema_pintuclic.sql`) conectando por pool de PostgreSQL e inspeccionando `information_schema.tables`.
  - VerificaciÃ³n automÃ¡tica de integridad para las 31 tablas operativas (incluyendo `sesion` y las entidades de Habeas Data).
  - ConfiguraciÃ³n del archivo `backend/.env` local para conexiÃ³n a PostgreSQL.
- **Estado:** âœ… Validado y ejecutado con Ã©xito en PostgreSQL local (31 tablas creadas en 0.19s); compilaciÃ³n `tsc` y linter limpios.

---

## [v1.5.3] - 2026-09-05
### MÃ³dulo: BD (Base de Datos v2.3) y Privacidad (Habeas Data - M20 / HU-SEG-05)
- **Alcance:** ActualizaciÃ³n a la versiÃ³n 2.3 del esquema relacional (31 tablas) con la incorporaciÃ³n de entidades de aviso de privacidad, consentimiento auditable y radicaciÃ³n de solicitudes de supresiÃ³n de datos personales (Habeas Data). SincronizaciÃ³n completa de tipos Kysely en `backend/src/core/db/types.ts` preservando intacta la tabla `sesion` (v2.2).
- **Hitos Clave:**
  - Nuevas tablas: `aviso_privacidad`, `consentimiento_usuario` y `solicitud_supresion`.
  - Nuevo enumerado nativo: `enum_estado_solicitud_supresion`.
  - Ãndices optimizados para auditorÃ­a de consentimientos y tramitaciÃ³n de supresiones.
- **Estado:** âœ… CompilaciÃ³n limpia con `npx tsc --noEmit` y linter sin errores.
- ðŸ”— **Walkthrough TÃ©cnico BD v2.3:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versiÃ³n-23-2026-09-05)

---

## [v1.5.2] - 2026-09-05
### MÃ³dulo: EspecificaciÃ³n Funcional de Negocio (M01, M02, M05, M08)
- **Alcance:** EspecificaciÃ³n funcional formal, historias de usuario y diagramas de arquitectura de flujo para CatÃ¡logo, BÃºsqueda, Carrito y Ã“rdenes de venta.
- **Hitos Clave:**
  - EspecificaciÃ³n de CatÃ¡logo (`M01`): jerarquÃ­a, atributos tÃ©cnicos, marcas, lÃ­neas, colores CIELAB y productos entonables (`HU-CAT-01` a `13`).
  - EspecificaciÃ³n de BÃºsqueda y NavegaciÃ³n (`M02`): filtros facetados, ordenamiento y catÃ¡logo pÃºblico (`HU-BUS-01` a `04`).
  - EspecificaciÃ³n de Carrito (`M05`) y Ã“rdenes de Venta (`M08`): snapshot inmutable y ciclo de vida de la orden (`HU-ORD-01` a `07`).
  - IncorporaciÃ³n de 15 diagramas de flujo y arquitectura en `docs/assets/diagrams/`.
- ðŸ”— **Especificaciones:** Ver [M01](./02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md), [M02](./02_MODULOS_FUNCIONALES/M02_ESPECIFICACION_BUSQUEDA.md), [M05](./02_MODULOS_FUNCIONALES/M05_ESPECIFICACION_CARRITO.md) y [M08](./02_MODULOS_FUNCIONALES/M08_ESPECIFICACION_ORDEN.md).

---

## [v1.5.1] - 2026-09-05
### MÃ³dulo: 00_SISTEMA, Gobernanza de Calidad (Reviews) y RefactorizaciÃ³n M20 (DTOs)
- **Alcance:** Desacoplamiento estricto de esquemas Zod (runtime) de contratos e interfaces estÃ¡ticas en el mÃ³dulo `m20-seguridad`, estandarizaciÃ³n de la carpeta obligatoria `dtos/` en la arquitectura backend y formalizaciÃ³n del sistema de auditorÃ­a tÃ©cnica en `docs/reviews/`.
- **AÃ±adido:**
  - `docs/reviews/`: Directorio central de auditorÃ­a tÃ©cnica y code reviews del Tech Lead (`README.md`, `backend/`, `frontend/`).
  - `docs/reviews/backend/review_v1.5.0_M20_seguridad.md`: Primer informe formal de code review evaluando M20, justificando el desacoplamiento de DTOs y emitiendo dictamen de aprobaciÃ³n.
  - `backend/src/modules/m20-seguridad/dtos/`: Carpeta modular dedicada a esquemas Zod y tipos inferidos (`seguridad.dto.ts`, `index.ts`).
- **Ajustado:**
  - `backend/src/modules/m20-seguridad/interfaces/seguridad.interfaces.ts`: PurificaciÃ³n a tipos y contratos de dominio TypeScript 100% libres de dependencias de Zod en runtime.
  - `backend/src/modules/m20-seguridad/controllers/seguridad.controller.ts` y `services/`: Actualizadas importaciones hacia la capa `dtos`.
  - `backend/infraestructura.md`: Actualizada la especificaciÃ³n arquitectÃ³nica consagrando la carpeta `dtos/` separada de `interfaces/` para todos los mÃ³dulos del proyecto.
  - `docs/README.md`: Registro de `docs/reviews/` y `docs/walkthroughs/` en el Ã¡rbol de gobernanza del sistema.
- **Estado:** âœ… CompilaciÃ³n limpia con `npx tsc --noEmit` y `npm run lint` en backend con cero errores.

---

## [v1.5.0] - 2026-09-05
### MÃ³dulo: M20 (Seguridad, AuditorÃ­a y ProtecciÃ³n de Datos) + BD v2.2
- **Alcance:** Primera entrega funcional de M20 (HU-SEG-01, HU-SEG-02, HU-SEG-03, HU-SEG-06) e incorporaciÃ³n de la tabla `sesion` en el esquema de base de datos v2.2 (28 tablas).
- **Hitos Clave:**
  - Validador central de autorizaciÃ³n en servidor y guardas reutilizables (`sesionVigente`, `requierePermiso`, `requiereTitularidad`, `protegido`).
  - Hashing seguro con BCrypt (costo 12) y saneamiento recursivo de credenciales en respuestas HTTP.
  - Sesiones con estado persistidas en PostgreSQL (`sesion` con UUID) y resoluciÃ³n de permisos en tiempo real.
- **Estado:** âœ… `tsc --noEmit` y `npm run lint` limpios; 28 pruebas de integraciÃ³n ejecutadas contra PostgreSQL 18.
- ðŸ”— **Walkthrough TÃ©cnico M20:** [walkthrough_v1.5.0_M20_seguridad.md](./walkthroughs/M20/walkthrough_v1.5.0_M20_seguridad.md)
- ðŸ”— **Walkthrough TÃ©cnico BD v2.2:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versiÃ³n-22-2026-09-05)

---

## [v1.4.0] - 2026-09-04
### MÃ³dulo: BD (Base de Datos v2.1) y Core Backend
- **Alcance:** ActualizaciÃ³n a la versiÃ³n 2.1 del esquema relacional (27 tablas) y sincronizaciÃ³n de tipos Kysely en `backend/src/core/db/types.ts`.
- **Hitos Clave:**
  - PatrÃ³n de e-commerce inmutable para ventas (`orden` y `linea_orden`).
  - Desacoplamiento de cotizaciones comerciales B2B/B2C (`cotizacion`).
  - Carrito vivo con soporte para visitantes anÃ³nimos (`token_visitante`) y variantes (`linea_carrito`).
  - ClasificaciÃ³n de tipo de cuenta (`enum_tipo_usuario`).
- **Estado:** âœ… CompilaciÃ³n limpia con `npx tsc --noEmit` en backend; orden topolÃ³gico validado.
- ðŸ”— **Walkthrough TÃ©cnico BD v2.1:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versiÃ³n-21-2026-09-04)

---

## [v1.3.0] - 2026-09-04
### MÃ³dulo: Frontend y Design System (Paleta Oficial de Colores)
- **Alcance:** ImplementaciÃ³n y estandarizaciÃ³n de los tokens de color globales de Pintuclic (`corporate`, `action`, `subaction`, `conversion`, `highlight`, `neutral-*`), integraciÃ³n con Tailwind CSS v4, directiva de diseÃ±o estricta en `AGENTS.md` y documentaciÃ³n tÃ©cnica en `frontend/src/core/theme/`.
- **AÃ±adido:**
  - `frontend/src/core/theme/colors.ts`: Constantes fuertemente tipadas de la paleta oficial (HEX).
  - `frontend/src/core/theme/index.ts`: Punto de exportaciÃ³n centralizado del tema.
  - `frontend/src/core/theme/GUIA_COLORES.md`: Manual de uso de clases Tailwind, tabla de roles y ejemplos de componentes.
- **Ajustado:**
  - `frontend/tailwind.config.ts`: Mapeo oficial de los tokens semÃ¡nticos en el tema extendido.
  - `frontend/src/style.css`: DeclaraciÃ³n de variables CSS nativas `@theme` para Tailwind CSS v4.
  - `frontend/src/App.vue`: Showcase interactivo demostrativo de los roles visuales.
  - `frontend/infraestructura.md`: ActualizaciÃ³n de la arquitectura con el mÃ³dulo `core/theme/` y la tabla oficial de colores.
  - `AGENTS.md`: Directiva crÃ­tica #8 con regla estricta de prohibiciÃ³n de colores arbitrarios.
- **Estado:** âœ… Validado con `npm run lint` y `npm run build` sin errores.

---

## [v1.2.0] - 2026-09-04
### MÃ³dulo: BD (Base de Datos v2.0) y ReorganizaciÃ³n Modular
- **Alcance:** ActualizaciÃ³n a la versiÃ³n 2.0 del esquema relacional (25 tablas), reorganizaciÃ³n de la carpeta `bd/` (`sql/`, `docs/`, `assets/`) y unificaciÃ³n de `docs/`.
- **Hitos Clave:** CatÃ¡logo de 4 niveles (`categoria` $\rightarrow$ `subcategorias` $\rightarrow$ `sub_subcategorias` $\rightarrow$ `linea`), variantes por color/tono, combos y 8 ENUMs nativos.
- **Estado:** âœ… DDL validado, orden topolÃ³gico comprobado y rutas de documentaciÃ³n unificadas.
- ðŸ”— **Walkthrough TÃ©cnico BD v2.0:** [WALKTHROUGH_DATABASE.md](../bd/docs/WALKTHROUGH_DATABASE.md#-versiÃ³n-20-2026-09-03)

---

## [v1.1.1] - 2026-09-04
### MÃ³dulo: 00_SISTEMA y Calidad de CÃ³digo (Linters)
- **Alcance:** ActivaciÃ³n de restricciÃ³n estricta contra tipos `any` explÃ­citos en TypeScript para backend y frontend.
- **AÃ±adido:**
  - `backend/eslint.config.mjs`: ConfiguraciÃ³n ESLint 9 + `typescript-eslint` con regla `@typescript-eslint/no-explicit-any: "error"`.
  - `frontend/eslint.config.js`: ConfiguraciÃ³n ESLint 9 + `typescript-eslint` + `eslint-plugin-vue` con regla `@typescript-eslint/no-explicit-any: "error"`.
  - Scripts `"lint"` y `"lint:fix"` en los `package.json` de backend y frontend.
- **Ajustado:**
  - `backend/src/core/db/connection.ts` y `auth.middleware.ts`: Tipado estricto de variables de error no utilizadas.
- **Estado:** âœ… Regla probada y validada activamente contra violaciones de tipo `any` en ambos entornos.

---

## [v1.1.0] - 2026-09-04
### MÃ³dulo: 00_SISTEMA y Core Backend / Infraestructura Docker
- **Alcance:** ImplementaciÃ³n de la capa transversal `backend/src/core/` y refactorizaciÃ³n de Dockerfiles para compilaciÃ³n limpia a producciÃ³n.
- **AÃ±adido:**
  - `backend/src/core/db/types.ts`: Tipado Kysely centralizado de las 25 tablas de la base de datos y 8 ENUMs nativos a partir de `schema_pintuclic.sql`.
  - `backend/src/core/db/connection.ts`: ConexiÃ³n PostgreSQL con Kysely y fallback de entorno por defecto.
  - `backend/src/core/utils/crypto.ts`: Hashing seguro de contraseÃ±as con BCrypt (costo 12, `HU-SEG-01`).
  - `backend/src/core/utils/jwt.ts` y middleware `auth.middleware.ts`: GestiÃ³n de sesiones y tokens seguros (`HU-SEG-02`).
  - `backend/src/core/middlewares/errorHandler.ts`: Manejador centralizado de excepciones y validaciones Zod con protecciÃ³n contra exposiciÃ³n de datos sensibles (`HU-SEG-06`).
  - `backend/src/core/middlewares/cors.middleware.ts`: CORS restrictivo.
  - `backend/src/app.routes.ts`: Enrutador global con endpoint `/api/health`.
  - `backend/.dockerignore` y `frontend/.dockerignore`: PrevenciÃ³n de filtraciÃ³n de `node_modules` del host a contenedores Linux.
- **Refactorizado:**
  - `backend/Dockerfile` y `Dockerfile.backend`: Multi-stage build con compilaciÃ³n estricta de TypeScript a JavaScript (`tsc` $\rightarrow$ `dist/`) y runtime mÃ­nimo con `node dist/index.js` bajo usuario no-root `USER node`.
  - `frontend/Dockerfile` y `Dockerfile.frontend`: Multi-stage build estandarizado con `npm ci` determinÃ­stico y servidor estÃ¡tico Nginx 1.27.
  - `backend/tsconfig.json`: Habilitados `rootDir` y `outDir` para compilaciÃ³n limpia en `/dist`.
- **Estado:** âœ… CompilaciÃ³n limpia con `tsc` y build verificado en backend y frontend.

---

## [v1.0.0] - 2026-09-01
### MÃ³dulo: 00_SISTEMA y Transversales (LÃ­nea Base del Proyecto)
- **Alcance:** CreaciÃ³n y formalizaciÃ³n de la arquitectura documental, tÃ©cnica y de seguridad de Pintu Clic.
- **AÃ±adido:**
  - DefiniciÃ³n del Stack Oficial: TypeScript, Express.js, Kysely, Zod, JWT, BCrypt, SMTP, CORS.
  - Protocolo y reglas obligatorias para Agentes de IA en `AGENTS.md`.
  - Matriz de trazabilidad y dependencias transversales en `MATRIZ_TRAZABILIDAD.md`.
  - PolÃ­ticas de Unicidad (`HU-CUE-08`), ComprobaciÃ³n en Servidor (`HU-ADM-03`) y Datos Sensibles (`HU-SEG-06`).
  - Plantilla de Reporte de Pruebas QA (`PLANTILLA_REPORTE_QA_MODULO.md` / `.docx`).
  - GuÃ­a y Plantilla de Walkthroughs de ImplementaciÃ³n (`PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md` / `.docx`).
- **Estado:** âœ… LÃ­nea Base Aprobada y Lista para Desarrollo de MÃ³dulos.


