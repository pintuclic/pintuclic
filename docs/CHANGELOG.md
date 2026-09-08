# Registro de Cambios y Versiones (CHANGELOG) - PINTU CLIC

Todas las modificaciones, nuevas funcionalidades y refactorizaciones del proyecto deben registrarse en este archivo siguiendo el estándar [SemVer](https://semver.org/lang/es/) y la [Guía de Versionado y Walkthroughs](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md).

> Formato de Versiones: `[vMAJOR.MINOR.PATCH] - AAAA-MM-DD`

## [v2.6.0] - 2026-09-08
### Módulo: M01 Catálogo de Productos (Backend)
- **Alcance:** Cuarta entrega del módulo M01: registro de bases (HU-CAT-12), la entidad sobre la que se preparan los colores de un producto entonable. Solo cubre el flujo 1 del diagrama oficial (registrar/editar/consultar/desactivar bases); los otros 3 flujos (asignar bases a un producto, asociar colores a bases, retirar colores al desactivar una base) quedan documentados como pendientes por depender de HU-CAT-02/HU-CAT-05, que aún no existen.
- **Hitos Clave:** Nueva tabla `base` (marca + nombre/código, sin tipo de resina — excluido a petición explícita del Product Owner). Endpoints `POST/GET/PATCH /api/catalogo/bases` (+`/desactivar`, `/reactivar`) y `GET /api/catalogo/marcas/:idMarca/bases`. Se corrigió además un hueco real encontrado en la cascada de HU-CAT-04: `MarcasService.desactivar` no tocaba bases (bases no existía cuando se implementó); ahora la desactivación de una marca cascada correctamente a líneas **y** bases.
- **Estado de Calidad:** ✅ `tsc --noEmit` y `npm run lint` sin errores ni advertencias. Suite `m01.test.ts`: 43/43 pruebas superadas. Probado end-to-end contra PostgreSQL real (crear, duplicado, cascada de desactivación de marca verificada en `base`, reactivar).
- 🔗 **Walkthrough Técnico Oficial:** [walkthroughs/M01/walkthrough_v2.6.0_M01_bases_backend.md](./walkthroughs/M01/walkthrough_v2.6.0_M01_bases_backend.md)

---

## [v2.5.0] - 2026-09-08
### Módulo: M01 Catálogo de Productos (Backend)
- **Alcance:** Tercera entrega del módulo M01: gestión administrativa de marcas (HU-CAT-04), con logotipo almacenado en base de datos y desactivación en cascada hacia líneas.
- **Hitos Clave:** `marca` gana `logotipo` (BYTEA) y `logotipo_mime_type`, ambos obligatorios. Endpoints `POST/GET/PATCH /api/catalogo/marcas` (+`/desactivar`, `/reactivar`) y `GET /api/catalogo/marcas/:id/logotipo` (imagen cruda, fuera del listado JSON). El logotipo viaja como data URL base64 (sin dependencias nuevas de subida de archivos), formato jpeg/png/webp y máximo 5MB (supuesto aprobado por el Product Owner mientras no exista el "Anexo B de la Tanda 2" referenciado en la especificación).
- **Estado de Calidad:** ✅ `tsc --noEmit` y `npm run lint` sin errores ni advertencias. Suite `m01.test.ts`: 35/35 pruebas superadas. Probado end-to-end contra PostgreSQL real (crear, duplicado, logotipo servido aparte, cascada de desactivación verificada en `linea`, reactivar).
- 🔗 **Walkthrough Técnico Oficial:** [walkthroughs/M01/walkthrough_v2.5.0_M01_marcas_backend.md](./walkthroughs/M01/walkthrough_v2.5.0_M01_marcas_backend.md)

---

## [v2.4.0] - 2026-09-08
### Módulo: M01 Catálogo de Productos (Backend)
- **Alcance:** Segunda entrega del módulo M01: gestión administrativa de líneas comerciales (HU-CAT-11), asociadas a una marca.
- **Hitos Clave:** Nueva tabla `marca` (mínima: nombre, estado) y endpoints `POST/GET/PATCH /api/catalogo/lineas` y `/api/catalogo/marcas/:idMarca/lineas`, protegidos por el permiso «Gestión del catálogo». `linea` ahora referencia `marca` (`id_marca`); `id_sub_subcategoria` se volvió opcional (columna remanente, no se usa en esta HU).
- **Estado de Calidad:** ✅ `tsc --noEmit` y `npm run lint` sin errores ni advertencias. Suite `m01.test.ts`: 27/27 pruebas superadas.
- 🔗 **Walkthrough Técnico Oficial:** [walkthroughs/M01/walkthrough_v2.4.0_M01_lineas_comerciales_backend.md](./walkthroughs/M01/walkthrough_v2.4.0_M01_lineas_comerciales_backend.md)

---

## [v2.3.0] - 2026-09-08
### Módulo: M01 Catálogo de Productos (Backend)
- **Alcance:** Primera entrega del módulo M01: gestión administrativa de categorías y subcategorías (HU-CAT-01), con baja lógica en cascada y advertencia previa de productos afectados.
- **Hitos Clave:** Nuevo módulo `backend/src/modules/m01-catalogo/` con endpoints `POST/GET/PATCH /api/catalogo/categorias` y `/api/catalogo/subcategorias`, protegidos por el permiso «Gestión del catálogo» (M17). Se agregaron las columnas `estado` y `orden` a `categoria` y `subcategorias` (BD v2.5), requisito bloqueante detectado y aprobado por el Product Owner antes de codificar (RF-CAT-01-04, CA-CAT-01-04).
- **Estado de Calidad:** ✅ `tsc --noEmit` y `npm run lint` sin errores ni advertencias. Suite `m01.test.ts`: 17/17 pruebas superadas.
- 🔗 **Walkthrough Técnico Oficial:** [walkthroughs/M01/walkthrough_v2.3.0_M01_categorias_subcategorias_backend.md](./walkthroughs/M01/walkthrough_v2.3.0_M01_categorias_subcategorias_backend.md)

---

## [v2.2.0] - 2026-09-07
### Arquitectura Global: Estandarización de DTOs en Frontend (Globales vs Locales y Erradicación Inline)
- **Alcance General:** Salto a versión **MINOR (v2.2.0)** que formaliza la arquitectura de **DTOs (Data Transfer Objects) en el Frontend**, documentándola en `frontend/infraestructura.md` y `AGENTS.md` (Directiva 12). Se define la separación estricta entre **DTOs Globales (`src/core/dtos/`)**, **DTOs Locales de Módulo (`src/modules/m[xx]/dtos/`)** y **Contratos Estáticos (`interfaces/`)**, eliminando al 100% las declaraciones de esquemas Zod inline en componentes `.vue`.
- **Hitos Clave de Arquitectura e Implementación:**
  - **Documentación y Normativa Oficial:** Actualización de `frontend/infraestructura.md` (Sección 5: Gestión de DTOs y Validación de Formularios) y de `AGENTS.md` (Directiva 12 y Paso 5) prohibiendo validaciones inline en vistas.
  - **Capa Global de DTOs (`src/core/dtos/`):** Creación de `seguridad.dto.ts` centralizando `contrasenaSchema` (`HU-SEG-01`), `contrasenaConConfirmacionSchema`, `telefonoSchema`, `correoSchema` y utilidades de validación atómica (`validarContrasena`, `validarContrasenaConConfirmacion`).
  - **Capa de DTOs Locales M04 (`src/modules/m04-cuentas/dtos/`):** Estructuración de `login.dto.ts` (`loginSchema`), `registro.dto.ts` (`registroNaturalSchema`, `registroEmpresaSchema`) y `password.dto.ts` mediante composición limpia.
  - **Introspección y Limpieza de Componentes Vue:** Refactorización de `ModalLogin.vue` y `PasoDatos.vue`, removiendo todos los esquemas `z.object` del cuerpo del componente y delegando exclusivamente en `toTypedSchema(dtoImportado)`.
  - 🔗 **Walkthrough Técnico:** [walkthrough_v2.2.0_M04_arquitectura_dtos_frontend.md](./walkthroughs/M04/walkthrough_v2.2.0_M04_arquitectura_dtos_frontend.md)
- **Estado:** ✅ Validado con compilación TypeScript limpia en frontend (`vue-tsc -b`), linter en 0 advertencias (`npm run lint`), build de producción generado con éxito y backend en 0 errores.

---

## [v2.1.3] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - DTO Centralizado y Validador DRY de Contraseñas Frontend)
- **Alcance General:** Incremento **PATCH (v2.1.3)** que unifica y centraliza la validación de contraseñas en el frontend bajo el principio DRY mediante un nuevo módulo de DTOs (`dtos/password.dto.ts`). Aplica idénticas reglas de seguridad y robustez criptográfica (`HU-SEG-01`) tanto en el registro de particulares y empresas (`HU-CUE-01`, `HU-CUE-03`), como en el establecimiento de contraseñas federadas (`HU-CUE-02`) en modales y wizards.
- **Hitos Clave Frontend (HU-SEG-01 / HU-CUE-01 / HU-CUE-02 / HU-CUE-03):**
  - **Nuevo Módulo DTO Frontend (`password.dto.ts`):** Definición de `contrasenaSchema`, `contrasenaConConfirmacionSchema`, y funciones utilitarias puras `validarContrasena` y `validarContrasenaConConfirmacion` como única fuente de la verdad para reglas de seguridad de contraseñas.
  - **Erradicación de Duplicidad (Principio DRY):** Reemplazo de expresiones regulares y bloques repetitivos de comprobación en `ModalLogin.vue` y `PasoDatos.vue` por llamadas atómicas al DTO centralizado.
  - **Validación Homogénea en Registros Natural y Empresa:** Integración directa de `contrasenaSchema` en los esquemas Zod/Vee-Validate `naturalZod` y `empresaZod` de `PasoDatos.vue`, garantizando que ningún usuario cree una cuenta con una contraseña débil.
  - **Guía Visual y Usabilidad:** Adición de textos explicativos de asistencia debajo del campo de contraseña en ambos formularios de registro indicando los requisitos de seguridad antes del envío.
  - 🔗 **Walkthrough Técnico:** [walkthrough_v2.1.3_M04_dto_validador_contrasena_dry_frontend.md](./walkthroughs/M04/walkthrough_v2.1.3_M04_dto_validador_contrasena_dry_frontend.md)
- **Estado:** ✅ Validado con compilación TypeScript limpia en frontend (`vue-tsc -b`), linter en 0 advertencias (`npm run lint`), build de producción exitoso y backend sin afectaciones.

---

## [v2.1.2] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - Corrección Validación Contraseña Propia con Google)
- **Alcance General:** Incremento **PATCH (v2.1.2)** que soluciona el fallo de validación de seguridad al registrarse con Google e intentar establecer la contraseña propia (`RF-CUE-02-04` / `CA-CUE-02-04`), corrigiendo la exigencia innecesaria de un `tokenTemporal` en el DTO de backend y sincronizando las reglas de complejidad de contraseña (`HU-SEG-01`) y detalle de mensajes de error en los componentes frontend.
- **Hitos Clave Fullstack (HU-CUE-02 / HU-SEG-01):**
  - **Backend DTO Desacoplado:** Marcado de `tokenTemporal` como opcional (`z.string().optional()`) en `completarPasswordGoogleSchema` de `login.dto.ts`, evitando rechazos 400 Bad Request en peticiones estándar `{ correo, contrasena }`.
  - **Frontend Validación Pre-Envío:** Implementación de validaciones explícitas de robustez (`/[a-z]/`, `/[A-Z]/`, `/[0-9]/`, longitud mínima de 8) en `guardarPasswordInicial` tanto en `ModalLogin.vue` como en `PasoDatos.vue`.
  - **Claridad de Requisitos y Textos de Ayuda:** Actualización de placeholders y textos de ayuda en pantalla informando al usuario la necesidad de mayúsculas, minúsculas y números antes de someter el formulario.
  - **Propagación Precisa de Errores de Validación:** Mejora en el parser reactivo `procesarErrorApi` de `useCuentas.ts` para extraer y proyectar directamente el mensaje específico reportado por el backend en `error.details`.
  - 🔗 **Walkthrough Técnico:** [walkthrough_v2.1.2_M04_fix_password_google_validation.md](./walkthroughs/M04/walkthrough_v2.1.2_M04_fix_password_google_validation.md)
- **Estado:** ✅ Validado con compilación TypeScript limpia en backend (`npx tsc --noEmit`) y frontend (`vue-tsc -b`), linter en 0 advertencias (`npm run lint`) en ambos entornos y build de producción generado con éxito.

---

## [v2.1.1] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - Registro con Google en Wizard de Creación de Cuenta)
- **Alcance General:** Incremento **PATCH (v2.1.1)** que extiende la autenticación federada con Google Identity Services (`HU-CUE-02`) directamente al wizard de registro de clientes (`RegistroWizard.vue` / `PasoDatos.vue`), permitiendo a nuevos usuarios registrarse con un solo clic con Google en el tab Natural, ingresar su contraseña de respaldo y avanzar directamente al estado de bienvenida sin requerir verificación por OTP por correo.
- **Hitos Clave Frontend (HU-CUE-02 / HU-CUE-01):**
  - **Botón y Flujo de Google en Wizard:** Integración de Google Identity en el tab de cliente particular de `PasoDatos.vue` con separador de diseño `"O con tu correo"`.
  - **Soporte de Flujos de Negocio:** Manejo nativo de sugerencia de vinculación si el correo ya existe, y captura inmediata de la contraseña de respaldo (`RF-CUE-02-04`).
  - **Transición Fluida en Wizard:** Conexión del evento `registroGoogleExitoso` en `RegistroWizard.vue` para avanzar directamente al paso 3 (`PasoListo.vue`), conservando la franja de marca y consistencia del Design System (Directiva 8).
  - 🔗 **Walkthrough Técnico:** [walkthrough_v2.1.1_M04_google_identity_registro_wizard_frontend.md](./walkthroughs/M04/walkthrough_v2.1.1_M04_google_identity_registro_wizard_frontend.md)
- **Estado:** ✅ Validado con compilación TypeScript limpia (`npx tsc --noEmit` y `vue-tsc -b`), linter en 0 advertencias (`npm run lint`) y build de producción en frontend generado con éxito.

---

## [v2.1.0] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - Google Identity OAuth2 Fullstack)
- **Alcance General:** Incremento **MINOR (v2.1.0)** con la implementación e integración de extremo a extremo (E2E) de **Google Identity Services (HU-CUE-02)**. Se conecta la autenticación federada con validación criptográfica en backend (`google-auth-library`), persistencia nativa en PostgreSQL (`usuario_identidad_externa`), y flujo reactivo en frontend con gestión de sugerencia de vinculación y registro de contraseña de respaldo, protegiendo al 100% las credenciales mediante variables de entorno en el host.
- **Hitos Clave Fullstack (HU-CUE-02):**
  - **Verificación Criptográfica en Backend:** Incorporación de `OAuth2Client.verifyIdToken()` para comprobar la firma, expiración y audiencia (`GOOGLE_CLIENT_ID`) del ID Token emitido por Google.
  - **Persistencia en Base de Datos (PostgreSQL):** Conexión de la tabla `usuario_identidad_externa` mediante Kysely en `CuentasRepository` para almacenamiento duradero de vinculaciones federadas (`google`, `id_proveedor`, `correo_proveedor`).
  - **Flujo Completo de Negocio (HU-CUE-02):**
    - *Login Directo (CA-CUE-02-05):* Emisión de sesión JWT y tokens cuando la cuenta ya está vinculada.
    - *Sugerencia de Vinculación (RF-CUE-02-03 / CA-CUE-02-02):* Presentación de diálogo al usuario cuando el correo coincide con una cuenta previa creada por formulario, requiriendo confirmación explícita antes de vincular.
    - *Contraseña Propia de Respaldo (RF-CUE-02-04 / CA-CUE-02-04):* Solicitud de contraseña propia tras registro con Google para garantizar acceso indistinto por ambas vías.
  - **Frontend Reactivo y Design System (Directiva 8):** Integración de Google Identity Services en `ModalLogin.vue`, `useCuentas.ts` y `cuentas.service.ts` utilizando exclusivamente tokens oficiales (`corporate`, `action`, `subaction`, `neutral-*`).
  - **Protección de Credenciales (Cero Secretos en Git):** Lectura desacoplada de `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID` desde `.env` en el host, inyectadas mediante `env_file` y build args en Docker.
  - 🔗 **Walkthrough Técnico M04 Google Identity:** [walkthrough_v2.1.0_M04_google_identity_oauth_fullstack.md](./walkthroughs/M04/walkthrough_v2.1.0_M04_google_identity_oauth_fullstack.md)
- **Estado:** ✅ Validado con compilación limpia en backend (`npx tsc --noEmit`), linter backend en 0 advertencias (`npm run lint`), 30/30 tests aprobados (`m04.test.ts`) y build de producción en frontend (`vue-tsc -b && vite build`) con 0 errores.

---

## [v2.0.0] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - Integración Fullstack E2E)
- **Alcance General:** Salto a versión **MAJOR (v2.0.0)** con la primera integración simétrica y desacoplada de extremo a extremo (E2E) entre el backend (Express + Kysely) y frontend (Vue 3 + Pinia + Composables), resolviendo el contrato de datos del Universal API Envelope y orquestando el manejo reactivo de errores y estados de carga.
- **Hitos Clave Fullstack (HU-CUE-01, HU-CUE-03, HU-CUE-04):**
  - **Universal API Envelope (`ApiResponse<T>` y `ApiErrorResponse`):** Estandarización de contratos de respuesta HTTP alineando el cliente de frontend para interpretar respuestas con `success: true` / `data` y capturar errores estructurados (`error.code`, `error.message`, `error.details`).
  - **Capa de Composables Reactivos (`useCuentas`):** Desacoplamiento de la lógica de red y estado (`cargando`, `errorMensaje`, `codigoError`, `erroresValidacion`) fuera de los componentes Vue (`ModalLogin.vue`, `PasoDatos.vue`, `PasoVerificacion.vue`).
  - **Sincronización de Sesión Segura (M20):** Actualización de `auth.store.ts` para persistir `accessToken`, `idSesion` y el usuario sanitizado sin exposición de datos sensibles.
  - **Limpieza de Tipos (Zero Any):** Interfaces TypeScript de integración pura en `registro.interface.ts` con 0 bytes de runtime y 100% simétricas con los DTOs de backend.
  - 🔗 **Walkthrough Técnico M04 Fullstack:** [walkthrough_v2.0.0_M04_integracion_fullstack.md](./walkthroughs/M04/walkthrough_v2.0.0_M04_integracion_fullstack.md)
- **Estado:** ✅ Validado con compilación limpia en backend (`npx tsc --noEmit`), linter backend en 0 advertencias (`npm run lint`) y build de producción en frontend (`vue-tsc -b && vite build`) con 0 errores.

---

## [v1.10.1] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - Frontend Tech Lead Fixes)
- **Alcance General:** Subsanación técnica integral de la capa frontend de M04 tras auditoría de Tech Lead, alcanzando 100% de cumplimiento en compilación TypeScript limpia (`vue-tsc`), linter en cero errores/advertencias (`npm run lint`), erradicación absoluta de tipos laxos (`any`) y alineación total con los tokens semánticos oficiales del Design System Pintuclic (Directiva 8).
- **Hitos Clave Frontend:**
  - **Resolución de Error Crítico TS2339:** Type narrowing estricto en el submit reactivo de `PasoDatos.vue` para uniones de esquemas Vee-Validate/Zod (`RegistroNaturalPayload` vs `RegistroEmpresaPayload`).
  - **Alineación con Design System (Directiva 8):** Purga total de colores hexadecimales arbitrarios (`#E63946`) en `ModalLogin.vue`, `PasoDatos.vue` y `PasoVerificacion.vue`, reemplazados por tokens institucionales (`bg-subaction`, `text-corporate`, `border-action/30`).
  - **Calidad de Tipos (Zero-Any):** Tipado fuerte de argumentos y retornos en `CuentasService` y en el almacén de Pinia (`useAuthStore`) con la nueva interfaz `UsuarioSesion` sin runtime en `registro.interface.ts`.
  - **Gestión Segura de Ciclo de Vida:** Prevención de fugas de memoria en `PasoVerificacion.vue` mediante `onUnmounted` con `clearInterval` sobre el cooldown de 60s de reenvío OTP.
  - **Limpieza de Linter:** Corrección de globals en `eslint.config.js` y remoción de `props` no utilizados en `Boton.vue`.
  - 🔗 **Walkthrough Técnico M04 Frontend:** [walkthrough_v1.10.1_M04_cuentas_auth_perfil_frontend.md](./walkthroughs/M04/walkthrough_v1.10.1_M04_cuentas_auth_perfil_frontend.md)
  - 🔗 **Reporte de Revisión Técnica M04 Frontend:** [review_v1.10.0_M04_cuentas_auth_perfil.md](./reviews/frontend/review_v1.10.0_M04_cuentas_auth_perfil.md)
- **Estado:** ✅ Compilación limpia con `npx vue-tsc -b` (código 0), linter con 0 errores y 0 advertencias (`npm run lint`), y build de producción generado con éxito (`npm run build`).

---

## [v1.10.0] - 2026-09-07
### Módulo: M04 (Cuentas, Autenticación y Perfil - Frontend)
- **Alcance General:** Integración funcional, estructuración arquitectónica y conexión de la interfaz de usuario (Vue) con la API REST del backend para las funcionalidades de autenticación (Login y Registro B2C/B2B).
- **Hitos Clave Frontend (HU-CUE-01 a HU-CUE-03):**
  - **Refactorización Arquitectónica:** Migración estricta de componentes modales específicos (Login, Stepper) de la carpeta global `core` hacia `modules/m04-cuentas/components/`.
  - **Single Source of Truth (Zod):** Unificación de reglas de validación en cliente (VeeValidate + Zod) para coincidir 1:1 con las restricciones del backend. Resolución de colisión de contextos de formulario en Vue.
  - **Estado y Persistencia:** Inyección global de Pinia (`main.ts`) y creación del store de autenticación (`auth.store.ts`) conectado al JWT de localStorage.
  - **Comunicación HTTP y Manejo de Errores:** Implementación de `cuentas.service.ts` con Axios. Inserción de UI responsiva (Loading States) y renderizado de errores directos desde el servidor.
  - **Identidad Externa (HU-CUE-02):** Preparación del framework e interfaz para Google Identity (`vue3-google-login`), a la espera de credenciales Cloud por parte de DevOps.
  - 🔗 **Walkthrough Técnico M04 Frontend:** [walkthrough_v1.10.0_M04_cuentas_auth_perfil_frontend.md](./walkthroughs/M04/walkthrough_v1.10.0_M04_cuentas_auth_perfil_frontend.md)
- **Estado:** ✅ Validado con compilación limpia (`npm run build`).

---

## [v1.9.0] - 2026-09-05
### Módulo: M04 (Cuentas, Autenticación y Perfil - Backend)
- **Alcance General:** Implementación completa del backend para el módulo M04 (HU-CUE-01 a HU-CUE-09), abarcando registro particular y empresa, autenticación por formulario y Google Identity, ciclo de vida de sesiones seguras con JWT portando `sid`, recuperación de contraseña, administración de perfiles, gestión de direcciones y panel administrativo de revisión de empresas.
- **Hitos Clave Backend (HU-CUE-01 a HU-CUE-09):**
  - **Registro de Particular y OTP (`HU-CUE-01`):** Alta de clientes particulares en estado `pendiente`, emisión de código OTP criptográfico de 6 dígitos con vigencia de 15 minutos, verificación, expiración y reenvío con notificación SMTP.
  - **Identidad y Acceso con Google (`HU-CUE-02`):** Autenticación mediante Google Identity con sugerencia de vinculación cuando el correo coincide con una cuenta previa, e incorporación de contraseña propia obligatoria para doble vía de acceso.
  - **Registro de Empresas B2B (`HU-CUE-03`):** Registro corporativo con NIT/RUT y representante legal en estado `pendiente`, prevención de NIT duplicado y consulta del estado de trámite.
  - **Inicio y Cierre de Sesión Seguro (`HU-CUE-04`):** Login con mitigación contra fuerza bruta, verificación de credenciales en tiempo constante (`HU-SEG-06`), emisión de JWT portando claim `sid` persistido en PostgreSQL (`HU-SEG-02`) y logout explícito.
  - **Recuperación de Contraseña (`HU-CUE-05`):** Solicitud uniforme para evitar enumeración de correos, reseteo mediante código OTP e invalidación inmediata de todas las sesiones activas del usuario.
  - **Gestión de Perfil (`HU-CUE-06`):** Consulta segura sin datos sensibles (`HU-SEG-06`), actualización de datos personales, cambio de correo protegido con código enviado al correo actual y solicitud de ascenso a cuenta empresa.
  - **Gestión de Direcciones (`HU-CUE-07`):** CRUD completo de direcciones con soporte de geolocalización, designación automática de predeterminada y comprobación estricta de titularidad en backend (`HU-SEG-03`).
  - **Unicidad de Cuentas (`HU-CUE-08`):** Garantía de correo único en minúsculas en todo el sistema sin distinción de rol.
  - **Aprobación Administrativa de Empresas (`HU-CUE-09`):** Bandeja protegida por permisos `personal.ver` y `personal.editar` para aprobar (activando cuenta y rol `empresa_vip`) o rechazar solicitudes corporativas y actualizaciones de NIT con motivo y notificación.
  - 🔗 **Walkthrough Técnico M04 Backend:** [walkthrough_v1.9.0_M04_cuentas_auth_perfil_backend.md](./walkthroughs/M04/walkthrough_v1.9.0_M04_cuentas_auth_perfil_backend.md)
  - 🔗 **Reporte de Revisión Técnica M04 Backend:** [review_v1.9.0_M04_cuentas_auth_perfil.md](./reviews/backend/review_v1.9.0_M04_cuentas_auth_perfil.md)
- **Estado:** ✅ Validado con 30 pruebas automatizadas superadas al 100%; compilación TypeScript limpia (`tsc --noEmit`) con 0 errores y linter con 0 advertencias tras refactorización del Tech Lead.

---

## [v1.8.1] - 2026-09-05
### Módulos: M18 (Notificaciones) ↔ M17 (Permisos y Administración) ↔ M20 (Seguridad) - Integración Fullstack
- **Alcance General:** Implementación de ajustes de integración, resolución de contratos inter-módulo y coherencia global derivados de la auditoría arquitectural.
- **Hitos Clave de Integración:**
  - **Principio DRY en Criptografía (`HU-SEG-01`):** `EmpleadosService` (`M17`) ahora delega la derivación de contraseñas seguras a `CredencialesService.derivarContrasena` de `M20`, eliminando el uso redundante de `bcrypt` y centralizando políticas criptográficas.
  - **Despacho Automático de Credenciales (`CA-ADM-01-01` / `HU-NOT-01`):** Al crear una cuenta de empleado, `M17` dispara el evento `ALTA_EMPLEADO_CREDENCIAL` vía `servicioNotificaciones` (`M18`), enviando un correo formateado con plantilla oficial y credencial temporal.
  - **Catálogo y Contratos en M18:** Adición de la plantilla `alta_empleado_credencial` con variables obligatorias `['nombre', 'credencial_temporal']` y tipado exhaustivo en la SSOT inmutable `TIPOS_EVENTOS_NOTIFICACION`.
  - **Fachadas Públicas de M17:** Exportación de `serviciosEmpleados` y `serviciosPermisos` en `m17.routes.ts` para habilitar inyecciones directas en el backend.
  - **Sincronización Fullstack en Frontend:** Alineación de los permisos en los perfiles mock de `useAuth.ts` con el catálogo maestro de PostgreSQL (`seed_pintuclic.sql`) y las guardas del backend (`personal.ver`, `personal.editar`, `personal.desactivar`, `seguridad.gestionar_permisos`).
  - 🔗 **Walkthrough Técnico de Integración:** [walkthrough_v1.8.1_M18_M17_integracion_backend.md](./walkthroughs/M18/walkthrough_v1.8.1_M18_M17_integracion_backend.md)
- **Estado:** ✅ Compilación limpia con `tsc --noEmit` y `npm run build` en frontend; 22 pruebas de integración automatizadas superadas con 0 errores.

---

## [v1.8.0] - 2026-09-05
### Módulo: M18 (Notificaciones y Comunicaciones Transaccionales - Backend)
- **Alcance General:** Implementación completa de la infraestructura y lógica de backend para el módulo transversal M18 (HU-NOT-01 a HU-NOT-04), permitiendo el despacho asíncrono de correos transaccionales por SMTP, gestión de plantillas administrables y trazabilidad auditable sin datos sensibles.
- **Hitos Clave Backend (HU-NOT-01 a HU-NOT-04):**
  - **Motor de Envío Transaccional y Reintentos (`HU-NOT-01`):** Despacho SMTP (Nodemailer) con política de reintentos configurable (hasta 3 intentos con retroceso exponencial) y modo de simulación seguro para desarrollo y testing.
  - **Suscripción a Eventos de Negocio (`HU-NOT-02`):** Orquestación de notificaciones ante cambios de estado de órdenes de compra (`M08`), alertas preventivas de demora por falta de stock y actualizaciones sobre cotizaciones comerciales (`M21`).
  - **Plantillas Administrables e Inviolabilidad de Variables (`HU-NOT-03`):** Endpoints administrativos protegidos para listar, previsualizar en vivo con datos mock y actualizar plantillas, aplicando la regla de negocio crítica que bloquea con `422` cualquier intento de eliminar variables obligatorias (ej. enlaces o códigos de verificación).
  - **Entregabilidad y Diagnóstico de Bitácora (`HU-NOT-04`):** Historial paginado de despachos, detección de rebotes y cálculo automático de métricas de entregabilidad cumpliendo la política de confidencialidad `HU-SEG-06`.
  - **Seguridad en Servidor:** Rutas de administración protegidas con guardas `sesionVigente` y `requierePermiso` de `M20`/`M17`.
  - **Arquitectura SSOT en Contratos y Eventos:** Catálogo inmutable de eventos y estados unificado en `dtos/envio.dto.ts` con inferencia estática en interfaces (`0 bytes runtime`) y protección en tiempo de compilación para el mapeo exhaustivo de plantillas en el servicio.
  - 🔗 **Walkthrough Técnico M18 Backend:** [walkthrough_v1.8.0_M18_notificaciones_backend.md](./walkthroughs/M18/walkthrough_v1.8.0_M18_notificaciones_backend.md)
  - 🔗 **Reporte de Revisión Técnica M18 Backend:** [review_v1.8.0_M18_notificaciones.md](./reviews/backend/review_v1.8.0_M18_notificaciones.md)
- **Estado:** ✅ Validado con 22 pruebas de integración automatizadas; compilación limpia con `tsc --noEmit` y linters con 0 errores.


---

## [v1.7.0] - 2026-09-05
### Módulo: M17 (Administración, Empleados y Permisos - Fullstack)
- **Alcance General:** Implementación completa del backend operativo de M17 (HU-ADM-01 a HU-ADM-06) e infraestructura desacoplada de simulación y testing de permisos en frontend, permitiendo la gestión integral de empleados, permisos atómicos en cascada, clientes y parámetros de sistema.
- **Hitos Clave Backend (HU-ADM-01 a HU-ADM-06):**
  - **Gestión de Empleados (`HU-ADM-01`):** Alta de empleados con credencial temporal hasheada en BCrypt (costo 12, `HU-SEG-01`), baja lógica con invalidación inmediata de sesiones activas en M20 (`RF-SEG-02-06`), reactivación y protección inviolable del Administrador raíz ID=1 (`RF-ADM-01-14`, `RF-ADM-02-10`).
  - **Catálogo y Cascada de Permisos (`HU-ADM-02`):** 14 permisos atómicos agrupados por área funcional con regla de cascada (al revocar un permiso base se revocan los dependientes; al otorgar uno dependiente se confiere el base).
  - **Arquitectura de Permisos Individuales (Opción A):** Sin migraciones de BD, se genera un rol individual `empleado_{id_usuario}` vinculado a `asignacion_permiso`, siendo 100% compatible con la lectura de permisos de M20.
  - **Gestión de Clientes (`HU-ADM-04`):** Consulta y fichas de clientes con anonimización estricta de datos sensibles (`HU-SEG-06`).
  - **Parámetros del Sistema (`HU-ADM-06`):** Configuración tipada y validación de rangos.
  - **Seguridad en Servidor:** Rutas `/api/admin/*` protegidas mediante guardas `requierePermiso` de M20 (`RNF-SEG-03-01`).
  - 🔗 **Walkthrough Técnico M17 Backend:** [walkthrough_v1.7.0_M17_administracion_permisos_backend.md](./walkthroughs/M17/walkthrough_v1.7.0_M17_administracion_permisos_backend.md)
- **Hitos Clave Frontend Core & Testbench:**
  - Composable `useAuth.ts` con persistencia en `localStorage`, roles tipados y catálogo de perfiles mock basado en el seed central.
  - Componente flotante `DevRoleSwitcher.vue` con alternador de identidades en 1 clic (Admin, Empleado Parcial, Cliente, Empresa).
  - Soporte de testing para subdominio (`adsoproject.dev`) y despliegue desacoplado en `docker-compose.dev.yml`.
  - Guía oficial de implementación y estándares visuales en `frontend/src/modules/m17-permisos/README.md`.
  - 🔗 **Walkthrough Técnico M17 Frontend:** [walkthrough_v1.7.0_M17_auth_simulation_frontend.md](./walkthroughs/M17/walkthrough_v1.7.0_M17_auth_simulation_frontend.md)
- **Estado:** ✅ Compilación limpia con `tsc --noEmit` en backend y `npm run build` en frontend; linters en 0 errores.

---

## [v1.6.0] - 2026-09-05
### Módulo: M20 (Seguridad) - Protección de Datos Personales y Habeas Data (HU-SEG-05)
- **Alcance:** Implementación de **HU-SEG-05**, que estuvo bloqueada desde la v1.4.0 por ausencia de modelo de datos. Consume las tablas `aviso_privacidad`, `consentimiento_usuario` y `solicitud_supresion` incorporadas en el esquema v2.3. **Sin cambios en el DDL.**
- **Añadido:**
  - `m20-seguridad/dtos/privacidad.dto.ts`: schemas Zod de consentimiento, resolución de solicitudes y parámetro de URL.
  - `m20-seguridad/interfaces/privacidad.interfaces.ts`: contratos de dominio sin runtime.
  - `m20-seguridad/repositories/privacidad.repository.ts`: consultas Kysely de las 3 tablas de privacidad y conteo de órdenes asociadas.
  - `m20-seguridad/services/privacidad.service.ts`: reglas de consentimiento y circuito de supresión.
  - `m20-seguridad/controllers/privacidad.controller.ts`: transporte HTTP.
  - Endpoints: `GET /api/seguridad/privacidad/aviso` (**público**), `GET|POST /privacidad/consentimiento`, `GET|POST /privacidad/supresion`, `GET /privacidad/supresion/pendientes` y `PUT /privacidad/supresion/:id` (ambos con permiso).
  - `docs/walkthroughs/M20/walkthrough_v1.6.0_M20_privacidad_backend.md`.
- **Decisiones de diseño:**
  - **El consentimiento es histórico, no un estado:** cada aceptación crea una fila y nunca se sobrescribe una anterior. Es lo que permite responder qué versión aceptó cada titular y cuándo, y hace posible avisar cuando el aviso cambia de versión (CA-SEG-05-06).
  - **La versión se acepta explícitamente:** si el aviso cambia entre que el usuario lo lee y lo acepta, la operación falla con `409` en lugar de registrar consentimiento sobre un texto que nunca vio.
  - **El aviso vigente es público:** debe poder leerse antes de registrarse, porque nadie puede consentir lo que no ha visto.
  - **La supresión se registra con la verdad:** cuando hay órdenes asociadas, la respuesta informa que la información comercial exigida por la ley se conservará desvinculada de la identidad, en vez de prometer un borrado total que la ley no permite.
- **Ajustado:**
  - `m20-seguridad/dtos/index.ts` y `seguridad.routes.ts`: composición y cableado de las rutas nuevas.
  - Renombrado `walkthrough_v1.5.0_M20_seguridad.md` → `..._backend.md` para cumplir la normativa de sufijo de capa.
- **Pendiente:**
  - **M17** debe registrar el permiso `seguridad.gestionar_privacidad` en el catálogo; no está en el seed oficial y sin él la cola administrativa responde `403` a todos.
  - **M04** debe invocar `serviciosSeguridad.privacidad.exigirConsentimientoVigente(idUsuario)` al completar un registro, y es el dueño de la consulta y rectificación del perfil (CA-SEG-05-03).
  - **CA-SEG-05-05 parcial — requiere decisión del líder técnico / PO:** el sistema identifica y comunica qué información comercial debe conservarse, pero **no ejecuta la desvinculación de la identidad**, que es estructuralmente imposible hoy (`orden.id_usuario` es `NOT NULL` y su FK usa `ON DELETE RESTRICT`). El walkthrough plantea tres opciones con su contrapartida y recomienda anonimizar la fila de `usuario` en lugar de la orden, por no requerir cambios de DDL. Queda además una colisión legal por resolver: la normativa tributaria exige que la factura identifique al comprador, mientras que la de protección de datos exige suprimir esa identidad. Ver [walkthrough v1.6.0](./walkthroughs/M20/walkthrough_v1.6.0_M20_privacidad_backend.md).
  - **RF-SEG-05-08/09 bloqueados:** la rama de transferencia de datos a terceros depende de la postura sobre retención de imágenes del simulador y conversaciones de chatbot, aún sin definir.
  - **HU-SEG-04 (auditoría)** sigue EN PAUSA por decisión del Lider general.
- **Estado:** ✅ `tsc --noEmit` y `npm run lint` sin errores, y 16 pruebas de integración contra PostgreSQL 18.4 con el esquema v2.3 y el seed oficial (aviso público, cambio de versión del aviso, aceptación de versión retirada, histórico no sobrescrito, bifurcación de órdenes asociadas, no duplicación de solicitudes, control de permisos en la cola administrativa y ausencia de datos sensibles en las respuestas).

---

## [v1.5.5] - 2026-09-05
### Módulo: Base de Datos y Calidad de Desarrollo (Mocks y Fixtures Centralizados)
- **Alcance:** Unificación del sistema de mocks de prueba en una única fuente centralizada ([`bd/sql/seed_pintuclic.sql`](../bd/sql/seed_pintuclic.sql)), eliminación definitiva de la carpeta aislada `backend/src/modules/m20-seguridad/__fixtures__`, creación del ejecutor `npm run db:seed` y publicación de la [Guía de Mocks y Datos de Prueba](../bd/docs/GUIA_MOCKS_Y_DATOS_PRUEBA.md).
- **Hitos Clave:**
  - Siembra integral e idempotente de datos en las **31 tablas** del esquema relacional (79 registros de prueba vinculados).
  - Eliminación de dependencias dispersas en `m20-seguridad/__fixtures__` concentrando toda la data en la capa `bd/`.
  - Inclusión de comandos `db:seed` y `db:reset` en `backend/package.json`.
  - Publicación de [`GUIA_MOCKS_Y_DATOS_PRUEBA.md`](../bd/docs/GUIA_MOCKS_Y_DATOS_PRUEBA.md) con roles, credenciales (`Pintuclic2026`) y catálogo de testing.
- **Estado:** ✅ Validado contra PostgreSQL local con 31 tablas verificadas; `tsc --noEmit` y `eslint` limpios.

---

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
- 🔗 **Walkthrough Técnico M20:** [walkthrough_v1.5.0_M20_seguridad_backend.md](./walkthroughs/M20/walkthrough_v1.5.0_M20_seguridad_backend.md)
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
