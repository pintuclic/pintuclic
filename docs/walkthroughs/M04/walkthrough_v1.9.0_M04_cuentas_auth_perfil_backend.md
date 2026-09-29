# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> `docs/walkthroughs/M04/walkthrough_v1.9.0_M04_cuentas_auth_perfil_backend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v1.9.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M04 - Cuentas, Autenticación y Perfil`
* **Fecha de Entrega:** `05/09/2026`
* **Autor / Responsable:** `Equipo de Desarrollo Backend (Agente Antigravity)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CUE-01** | Registro particular con verificación por correo | **100% Cumplida** | `POST /api/cuentas/registro/particular`<br>`POST /api/cuentas/verificar-codigo`<br>`POST /api/cuentas/reenviar-codigo` |
| **HU-CUE-02** | Registro y acceso mediante Google Identity | **100% Cumplida** | `POST /api/cuentas/google`<br>`POST /api/cuentas/google/vincular`<br>`POST /api/cuentas/google/completar-password` |
| **HU-CUE-03** | Registro de cliente empresa sujeto a aprobación | **100% Cumplida** | `POST /api/cuentas/registro/empresa`<br>`GET /api/cuentas/empresa/estado-solicitud` |
| **HU-CUE-04** | Inicio y cierre de sesión seguro | **100% Cumplida** | `POST /api/cuentas/login`<br>`POST /api/cuentas/logout` |
| **HU-CUE-05** | Recuperación de contraseña | **100% Cumplida** | `POST /api/cuentas/recuperar-password/solicitar`<br>`POST /api/cuentas/recuperar-password/confirmar` |
| **HU-CUE-06** | Gestión del perfil de usuario | **100% Cumplida** | `GET /api/cuentas/perfil`<br>`PUT /api/cuentas/perfil`<br>`POST /api/cuentas/perfil/cambiar-correo/solicitar`<br>`POST /api/cuentas/perfil/cambiar-correo/confirmar`<br>`POST /api/cuentas/perfil/solicitar-empresa` |
| **HU-CUE-07** | Gestión de direcciones del cliente | **100% Cumplida** | `GET /api/cuentas/direcciones`<br>`POST /api/cuentas/direcciones`<br>`GET /api/cuentas/direcciones/:id`<br>`PUT /api/cuentas/direcciones/:id`<br>`DELETE /api/cuentas/direcciones/:id`<br>`PATCH /api/cuentas/direcciones/:id/predeterminada` |
| **HU-CUE-08** | Identidad y unicidad de la cuenta | **100% Cumplida** | Validador transversal en registros, actualizaciones y vínculos |
| **HU-CUE-09** | Verificación y aprobación de cuentas empresa | **100% Cumplida** | `GET /api/cuentas/admin/solicitudes-empresa`<br>`GET /api/cuentas/admin/solicitudes-empresa/:id`<br>`POST /api/cuentas/admin/solicitudes-empresa/:id/dictamen`<br>`GET /api/cuentas/admin/solicitudes-nit`<br>`POST /api/cuentas/admin/solicitudes-nit/:id/dictamen` |

### Descripción del Alcance de la Versión
Esta versión entrega la totalidad de la capa lógica y de datos del módulo **M04 (Cuentas, Autenticación y Perfil)** para el backend de Pintuclic. Implementa la arquitectura modular vertical estricta (`dtos/`, `interfaces/`, `repositories/`, `services/`, `controllers/`), el respeto a los contratos de los 5 diagramas de flujo oficiales, el soporte integral a clientes particulares y corporativos, la gestión de múltiples direcciones de entrega, la autenticación híbrida (contraseña + Google Identity), la emisión de tokens JWT portando el claim `sid` vinculado a sesiones en PostgreSQL, y la bandeja administrativa para revisión y dictamen de cuentas empresa con control de acceso y notificaciones transaccionales.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Código OTP Efímero:** Los códigos de confirmación para activación de cuentas, cambio de correo y reseteo de contraseñas constan de 6 dígitos numéricos criptográficamente aleatorios, con vigencia máxima de 15 minutos y límite de 3 intentos consecutivos antes de su invalidación automática.
- **Ciclo de Vida Empresarial B2B:** Las empresas se registran con NIT/RUT y datos corporativos, quedando en estado `pendiente`. No se habilitan condiciones ni descuentos de empresa hasta la aprobación explícita por parte del administrador en `HU-CUE-09`.
- **Inmutabilidad de NIT en Perfil:** Un cliente empresa tiene restringida la edición directa de su NIT desde el perfil (`RF-CUE-06-06`); cualquier ajuste requiere radicar una solicitud de renovación de NIT adjuntando soporte documental (RUT).
- **Direcciones Predeterminadas:** Al registrar la primera dirección se marca automáticamente como predeterminada; marcar una dirección posterior como predeterminada desmarca de inmediato la anterior (`CA-CUE-07-02`). Si se elimina la dirección predeterminada, se transfiere automáticamente la condición a la siguiente disponible.
- **Sugerencia de Vinculación Google Identity:** Si el correo recibido por Google coincide con una cuenta ya existente creada por formulario, el sistema no la sobreescribe ni la vincula a ciegas; sugiere la vinculación al usuario (`RF-CUE-02-03`). Tras registrarse por Google, se exige crear contraseña propia para garantizar ambas vías de acceso (`RF-CUE-02-04`).

### B. Políticas Transversales Validadas
- 🔒 **M20 - Hashing y Credenciales (`HU-SEG-01`):** Las contraseñas se hashean mediante BCrypt con costo de sal 12 a través de `serviciosSeguridad.credenciales`. Las respuestas HTTP omiten cualquier hash o sal.
- ⏱️ **M20 - Gestión de Sesión Segura (`HU-SEG-02`):** Cada login genera una fila persistida en la tabla `sesion` de PostgreSQL con UUID no enumerable, y emite un JWT que porta el claim `sid`.
- 🛡️ **M17 - Control de Acceso en Servidor (`HU-ADM-03`):** Las rutas de aprobación de empresa (`HU-CUE-09`) exigen sesión activa y permisos administrativos en vivo (`personal.ver`, `personal.editar`).
- 📧 **M18 - Notificaciones Transaccionales (`HU-NOT-01`):** Emisión desacoplada de eventos de correo (`REGISTRO_CLIENTE`, `RECUPERACION_PASSWORD`, `SOLICITUD_EMPRESA_RECIBIDA`, `SOLICITUD_EMPRESA_DECISION`) a través de `servicioNotificaciones`.
- 🆔 **M04 - Unicidad de Cuentas (`HU-CUE-08`):** Comparación insensible a mayúsculas (`lower(correo)`) para asegurar que ningún correo pertenezca a más de una cuenta en el sistema.
- 👁️ **M20 - Mínima Exposición de Datos (`HU-SEG-06`):** Respuestas de login, recuperación de contraseña y perfiles sanitizadas para no revelar existencia de cuentas a terceros ni credenciales.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CUE-01-01** | Registro particular crea cuenta en estado no verificado y envía OTP | Prueba unitaria e integración | ✅ **CUMPLIDO** |
| **CA-CUE-01-02** | Código correcto activa la cuenta y habilita inicio de sesión | Validación de transición de estado en BD | ✅ **CUMPLIDO** |
| **CA-CUE-01-03** | Código incorrecto se rechaza e incrementa intentos | Prueba de caso borde de código erróneo | ✅ **CUMPLIDO** |
| **CA-CUE-01-04** | Correo duplicado se rechaza con 409 Conflict | Prueba de unicidad `HU-CUE-08` | ✅ **CUMPLIDO** |
| **CA-CUE-02-02** | Si correo coincide con cuenta existente, sugiere vinculación Google | Test unitario flujo Google Auth | ✅ **CUMPLIDO** |
| **CA-CUE-02-05** | Cuenta vinculada inicia sesión indistintamente por Google o formulario | Test de autenticación con proveedor | ✅ **CUMPLIDO** |
| **CA-CUE-03-01** | Empresa se registra con NIT y queda en estado pendiente | Verificación de solicitud y usuario | ✅ **CUMPLIDO** |
| **CA-CUE-03-03** | Rechazo de nuevo registro si el NIT ya tiene solicitud | Prueba de duplicidad de NIT | ✅ **CUMPLIDO** |
| **CA-CUE-04-01** | Credenciales correctas abren sesión con JWT y UUID | Verificación de claims y sesión | ✅ **CUMPLIDO** |
| **CA-CUE-04-02** | Credenciales incorrectas responden 401 uniforme sin enumeración | Prueba de seguridad `HU-SEG-06` | ✅ **CUMPLIDO** |
| **CA-CUE-04-04** | Logout explícito invalida la sesión de inmediato | Validación de revocación de sesión | ✅ **CUMPLIDO** |
| **CA-CUE-05-01** | Solicitud de recuperación despacha código OTP de un solo uso | Test de emisión de código | ✅ **CUMPLIDO** |
| **CA-CUE-05-02** | Correo inexistente responde idéntico a existente | Prueba de no enumeración | ✅ **CUMPLIDO** |
| **CA-CUE-05-04** | Cambio de contraseña invalida todas las sesiones activas | Verificación de revocación masiva | ✅ **CUMPLIDO** |
| **CA-CUE-06-01** | Cliente consulta datos personales sin exponer contraseñas | Test de serialización segura | ✅ **CUMPLIDO** |
| **CA-CUE-06-02** | Cambio de correo exige verificación en dirección actual y alerta | Flujo de OTP y doble notificación | ✅ **CUMPLIDO** |
| **CA-CUE-06-05** | Cliente empresa tiene prohibido editar campo NIT desde perfil | Validación de DTO y reglas de negocio | ✅ **CUMPLIDO** |
| **CA-CUE-07-01** | Registro de dirección disponible en la cuenta del cliente | CRUD de direcciones | ✅ **CUMPLIDO** |
| **CA-CUE-07-02** | Nueva dirección predeterminada desmarca la anterior | Test de conmutación de estado | ✅ **CUMPLIDO** |
| **CA-CUE-07-03** | Eliminación de dirección y reasignación de predeterminada | Prueba de integridad de direcciones | ✅ **CUMPLIDO** |
| **CA-CUE-09-01** | Administrador lista solicitudes de empresas pendientes | Endpoint administrativo protegido | ✅ **CUMPLIDO** |
| **CA-CUE-09-02** | Aprobación administrativa activa cuenta y asigna rol empresa VIP | Transición de estado y rol 3 | ✅ **CUMPLIDO** |
| **CA-CUE-09-03** | Rechazo administrativo registra motivo y notifica a la empresa | Test de dictamen con motivo | ✅ **CUMPLIDO** |
| **CA-CUE-09-04** | Solicitud ya decidida no permite re-dictamen | Validación de idempotencia | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (Requerimientos para operar en producción)
- **Módulo M20 (Seguridad y Auditoría):** Consume `serviciosSeguridad.credenciales` para derivación y comparación BCrypt costo 12 (`HU-SEG-01`), `serviciosSeguridad.sesion` para control de sesiones activas en PostgreSQL (`HU-SEG-02`) y `guardas` de autorización para rutas protegidas (`HU-SEG-03`).
- **Módulo M18 (Notificaciones):** Consume `servicioNotificaciones.procesarEvento` para despacho SMTP de códigos OTP y decisiones corporativas.
- **Módulo M17 (Permisos):** Requiere que el personal administrativo cuente con el permiso `personal.ver` y `personal.editar` para acceder a la bandeja de solicitudes empresa (`HU-CUE-09`).
- **Base de Datos:** PostgreSQL con esquema oficial v2.3 (`usuario`, `usuario_rol`, `rol`, `sesion`).

### B. Dependencias Hacia Adelante (A quién habilita este desarrollo)
- **Frontend M04:** Habilita el consumo de todos los flujos de registro, login, perfil, direcciones y panel de revisión de empresas.
- **Módulo M05/M07/M08 (Carrito, Checkout y Órdenes):** Permite a los clientes autenticados recuperar sus direcciones de despacho guardadas (`HU-CUE-07`) para asociarlas directamente al checkout inmutable.
- **Módulo M02 (Catálogo):** Permite identificar clientes corporativos aprobados (rol `empresa_vip`) para aplicarles automáticamente las políticas de descuento mayorista.

### C. Dependencias y Librerías de Software Backend (Stack Kysely / Express)
El backend de M04 se apoya en las siguientes librerías del entorno Node.js/TypeScript:

| Paquete NPM | Propósito en el Módulo M04 |
| :--- | :--- |
| **`kysely`** | Query builder con tipado estricto en PostgreSQL para consultas sobre `usuario`, `direccion_cliente`, `solicitud_empresa`, etc. |
| **`zod`** | Validación estricta en runtime de todos los DTOs de entrada (`req.body`, `req.params`, `req.query`). |
| **`bcrypt`** | Delegado a través de M20 para hashing y comparación en tiempo constante (factor de coste 12). |
| **`jsonwebtoken`** | Emisión y validación de tokens JWT con claim `sid` vinculado a sesiones activas. |
| **`nodemailer`** | Despacho SMTP desacoplado a través del bus de eventos de M18. |

---

## 6. REGISTRO DE ARCHIVOS CREADOS Y MODIFICADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/interfaces/cuentas.interfaces.ts` | Contratos estáticos TypeScript (UsuarioSeguro, DireccionCliente, SolicitudEmpresa, etc.). |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/interfaces/index.ts` | Exportación central de interfaces. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/registro.dto.ts` | Schemas Zod de registro particular, empresa, código OTP y reenvío. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/login.dto.ts` | Schemas Zod de login tradicional, Google Identity y vinculación. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/password.dto.ts` | Schemas Zod de solicitud y confirmación de recuperación de contraseña. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/perfil.dto.ts` | Schemas Zod de actualización de perfil, cambio de correo y solicitud de empresa. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/direccion.dto.ts` | Schemas Zod de alta y actualización de direcciones del cliente. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/admin-empresa.dto.ts` | Schemas Zod de dictamen administrativo de empresas y actualización de NIT. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/dtos/index.ts` | Exportación central de DTOs. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/repositories/cuentas.repository.ts` | Consultas tipadas con Kysely para PostgreSQL sobre `usuario`, `usuario_rol` y `rol`. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/repositories/verificacion.repository.ts` | Almacén de códigos OTP efímeros con TTL de 15 min y conteo de intentos. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/repositories/direccion.repository.ts` | Almacén y gestión de direcciones de clientes con soporte de predeterminadas. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/repositories/empresa.repository.ts` | Almacén y trazabilidad de solicitudes de cuenta empresa y actualización de NIT. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/repositories/index.ts` | Exportación central de repositorios. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/services/cuentas.service.ts` | Lógica de registro particular y empresa, validación OTP y unicidad. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/services/auth.service.ts` | Lógica de login, mitigación de fuerza bruta, Google Auth y recuperación. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/services/perfil.service.ts` | Gestión de perfil de usuario, cambio de correo y solicitud de ascenso. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/services/direccion.service.ts` | CRUD y reglas de negocio de direcciones del cliente. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/services/empresa-admin.service.ts` | Lógica de aprobación/rechazo administrativo de solicitudes corporativas. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/services/index.ts` | Exportación central de servicios. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/controllers/cuentas.controller.ts` | Controlador HTTP para registro, verificación, login, Google y recuperación. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/controllers/perfil.controller.ts` | Controlador HTTP para perfil del usuario y direcciones. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/controllers/empresa-admin.controller.ts` | Controlador HTTP para aprobación administrativa de empresas y NIT. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/controllers/index.ts` | Exportación central de controladores. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/cuentas.routes.ts` | Ensamblado del módulo, inyección de dependencias y rutas públicas y protegidas. |
| **[NUEVO]** | `backend/src/modules/m04-cuentas/__tests__/m04.test.ts` | Suite de 30 pruebas unitarias y de integración que cubren las 9 HUs. |
| **[MODIFICADO]** | `backend/src/app.routes.ts` | Montaje de `cuentasRoutes` en el enrutador central bajo `/cuentas`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ (v1.9.0)`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ (30/30 pruebas superadas)`
* **Compilación TypeScript Limpia:** `✅ SÍ (tsc --noEmit con 0 errores)`
* **Apego a los 5 Diagramas de Flujo:** `✅ 100% Coincidente con Diagramas Oficiales`
