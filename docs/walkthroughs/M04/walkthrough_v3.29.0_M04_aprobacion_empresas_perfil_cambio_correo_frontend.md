# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> `docs/walkthroughs/M04/walkthrough_v3.29.0_M04_aprobacion_empresas_perfil_cambio_correo_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.29.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M04 - Cuentas, Autenticación y Perfil (Frontend)`
* **Fecha de Entrega:** `16/09/2026`
* **Autor / Responsable:** `Equipo de Desarrollo Frontend / Antigravity AI`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CUE-09** | **Verificación y aprobación de cuentas empresa** | **100% Cumplida** | `VistaAprobacionEmpresas.vue`, integración con `Table.vue`, `Badge.vue`, `Modal.vue`, `PageHeader.vue` y `Button.vue`. |
| **HU-CUE-06** | **Perfil de usuario y cambio seguro de correo** | **100% Cumplida** | `VistaPerfil.vue`, modal de confirmación con contraseña (`contrasenaActual`), verificación OTP con `PasoVerificacion.vue`, edición de contacto y dirección. |
| **HU-CUE-01** | **Verificación de correo mediante código OTP** | **100% Cumplida** | `PasoVerificacion.vue` adaptado para reutilización tanto en registro como en cambio de correo (`isCambioCorreo`). |

### Descripción del Alcance de la Versión
Esta versión `v3.29.0` formaliza la adopción integral de los componentes globales del Design System en el módulo `M04` Frontend, asegurando paridad visual y estructural con el módulo `M17`:
1. **Aprobación Administrativa de Empresas (`VistaAprobacionEmpresas.vue`):** Erradicación de tablas y botones HTML nativos. Implementación de `<Table>` con soporte responsivo automático (`mobile-cards`), columnas tipadas (`TableColumn`), badges semánticos (`Badge`) y modal de dictamen con motivo de rechazo (`Modal`, `Button`).
2. **Perfil de Usuario y Cambio Seguro de Correo (`VistaPerfil.vue`):** Reestructuración de la vista con CSS Grid responsivo (`order-1`, `order-2`, `order-3`). Implementación del flujo de cambio de correo que exige contraseña actual para solicitar el código, consume `POST /cuentas/perfil/cambiar-correo/solicitar` y valida el OTP con `POST /cuentas/perfil/cambiar-correo/confirmar` actualizando Pinia.
3. **Sincronización de Enrutador Central:** Montaje de la ruta `/admin/empresas` en `src/core/routes/index.ts` bajo `LayoutAdmin`.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Regla RF-CUE-06-03:** El cambio de correo electrónico exige validar la contraseña actual del usuario antes de emitir cualquier código de confirmación.
- **Regla CA-CUE-06-02:** El código de verificación para cambio de correo se envía al correo actual vigente y cuenta con caducidad de 15 minutos.
- **Regla RF-CUE-09-05:** Al rechazar una solicitud de empresa, el motivo del rechazo es obligatorio para notificar formalmente al cliente.
- **Regla RF-CUE-06-06:** El NIT de una empresa no es editable directamente desde el perfil estándar de usuario.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Credenciales y Autorización (`HU-SEG-01` / `HU-SEG-03`):** No se manejan contraseñas en texto claro ni variables expuestas en el cliente.
- 🛡️ **M20 - Prevención de Secuestro de Cuenta (ATO):** La modificación del correo electrónico está blindada mediante re-autenticación y OTP.
- 👁️ **M20 - Mínima Exposición de Datos Sensibles (`HU-SEG-06`):** Documento de identidad no editable con tooltip informativo. Tipos estáticos limpios sin campos sensibles.
- 🎨 **Design System Pintuclic (Regla 8):** Uso estricto de tokens oficiales (`corporate`, `action`, `subaction`, `conversion`, `highlight`, `neutral-*`) definidos en `frontend/src/core/theme/colors.ts`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 Historia de Usuario: HU-CUE-09 — Aprobación de Empresas

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CUE-09-01** | **Dado que** existen solicitudes de empresa pendientes,<br>**Cuando** el administrador accede a la vista,<br>**Entonces** visualiza el listado con empresa, NIT, representante y tipo en una tabla oficial. | Inspección de `VistaAprobacionEmpresas.vue` y contrato de datos `SolicitudEmpresa`. | ✅ **CUMPLIDO** |
| **CA-CUE-09-02** | **Dado que** el administrador aprueba una solicitud,<br>**Cuando** confirma la decisión,<br>**Entonces** se envía el dictamen aprobatorio y se refresca el listado. | Flujo de modal y llamada a `dictaminarSolicitudEmpresa` con decisión `'aprobar'`. | ✅ **CUMPLIDO** |
| **CA-CUE-09-03** | **Dado que** el administrador rechaza una solicitud,<br>**Cuando** ingresa el motivo obligatorio y confirma,<br>**Entonces** se registra el dictamen de rechazo. | Validación reactiva de campo `motivoRechazo` en el modal. | ✅ **CUMPLIDO** |

### 🔹 Historia de Usuario: HU-CUE-06 — Perfil de Usuario y Cambio de Correo

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CUE-06-01** | **Dado que** un usuario consulta su perfil,<br>**Cuando** ingresa a la vista,<br>**Entonces** observa sus datos en tarjetas responsivas ordenadas ergonómicamente. | Inspección de layout en `VistaPerfil.vue` con Tailwind CSS Grid. | ✅ **CUMPLIDO** |
| **CA-CUE-06-02** | **Dado que** el usuario modifica su correo,<br>**Cuando** pulsa Guardar,<br>**Entonces** el sistema exige contraseña actual, envía OTP al correo actual y solicita el código para confirmar. | Flujo completo de modales `showConfirmPasswordModal` y `PasoVerificacion.vue`. | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Backend M04 (`/api/cuentas`):** Consume los endpoints existentes de `/cuentas/perfil`, `/cuentas/perfil/cambiar-correo/solicitar`, `/cuentas/perfil/cambiar-correo/confirmar` y `/cuentas/admin/solicitudes-empresa`.
- **Backend M18 (Notificaciones):** Requiere que el backend despache las plantillas `registro_cliente` y `solicitud_empresa_decision` vía SMTP.
- **Core Frontend Layouts:** Montado bajo `LayoutAdmin` (`/admin/empresas`) y `LayoutHome` (vistas públicas y de cliente).

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **M17 (Administración):** Conecta el panel administrativo con la revisión y resolución de empresas.
- **M07 / M08 (Checkout y Órdenes):** Permite a las empresas aprobadas operar bajo condiciones comerciales mayoristas.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Aislamiento Estricto de Módulo:** Modificaciones restringidas exclusivamente a Frontend. Backend 100% intacto.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `frontend/src/modules/m04-cuentas/views/admin/VistaAprobacionEmpresas.vue` | Vista administrativa de aprobación de empresas con componentes core (`Table`, `Badge`, `Modal`, `Button`, `PageHeader`). |
| **[NUEVO]** | `frontend/src/modules/m04-cuentas/interfaces/admin.interface.ts` | Tipos TypeScript estáticos para solicitudes y dictámenes de empresa. |
| **[MODIFICADO]** | `frontend/src/modules/m04-cuentas/views/VistaPerfil.vue` | Perfil responsivo, protección de identidad y flujo de cambio seguro de correo. |
| **[MODIFICADO]** | `frontend/src/modules/m04-cuentas/components/PasoVerificacion.vue` | Soporte para prop `isCambioCorreo` y emisión del código OTP digitado. |
| **[MODIFICADO]** | `frontend/src/modules/m04-cuentas/services/cuentas.service.ts` | Métodos cliente para cambio de correo (`solicitarCambioCorreo`, `confirmarCambioCorreo`) y administración de empresas. |
| **[MODIFICADO]** | `frontend/src/modules/m04-cuentas/dtos/perfil.dto.ts` | Esquema DTO con soporte para campos opcionales de contacto y dirección. |
| **[MODIFICADO]** | `frontend/src/modules/m04-cuentas/interfaces/registro.interface.ts` | Inclusión de `foto_url` en `UsuarioSeguro`. |
| **[MODIFICADO]** | `frontend/src/core/routes/index.ts` | Declaración de la ruta administrativa `/admin/empresas`. |
| **[MODIFICADO]** | `frontend/src/core/components/index.ts` | Re-exportación de tipo `TableColumn` en el barril central de componentes. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ (v3.29.0)`
* **Pruebas de Calidad Superadas (TypeScript & Lint):** `✅ SÍ`
* **Apego al Diagrama de Flujo:** `✅ 100% Coincidente con Diagrama`
