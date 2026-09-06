# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> Guardado en `docs/walkthroughs/M18/walkthrough_v1.8.1_M18_M17_integracion_backend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v1.8.1`
* **Tipo de Incremento:** `PATCH` (Ajustes de integración, coherencia DRY y contratos inter-módulo)
* **Módulo de Origen:** `M18 Notificaciones` ↔ `M17 Permisos y Administración` ↔ `M20 Seguridad`
* **Fecha de Entrega:** `05/09/2026`
* **Autor / Responsable:** Arquitecto de Integración y Coherencia de Sistemas (Cross-Module Integrator)
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ADM-01** | Gestión de cuentas de empleado (CA-ADM-01-01) | **100% Cumplida** | `POST /api/admin/empleados` (despacho asíncrono de credencial vía M18 y derivación DRY en M20) |
| **HU-NOT-01** | Emisión y despacho de notificaciones transaccionales | **100% Cumplida** | Evento `ALTA_EMPLEADO_CREDENCIAL` y plantilla `alta_empleado_credencial` incorporados al motor M18 |
| **HU-SEG-01** | Almacenamiento seguro de credenciales (DRY) | **100% Cumplida** | Reutilización estricta de `CredencialesService.derivarContrasena` sin duplicar llamadas a `bcrypt` |

### Descripción del Alcance de la Versión
Esta versión materializa los ajustes derivados de la auditoría de coherencia e integración global entre módulos transversales:
1. **Principio DRY en Criptografía:** Se eliminó la dependencia directa de `bcrypt` y el factor de costo duplicado en `EmpleadosService` (`M17`), inyectando en su lugar `CredencialesService` de `M20`.
2. **Cierre de Circuito Transaccional (`CA-ADM-01-01`):** Al crear un empleado desde `POST /api/admin/empleados`, `EmpleadosService` ahora despacha asíncronamente el evento `ALTA_EMPLEADO_CREDENCIAL` a través de `NotificacionesService` (`M18`), enviando al colaborador su contraseña temporal con una plantilla oficial formateada.
3. **Catálogo y Tipado Exhaustivo en M18:** Se incorporó el evento `ALTA_EMPLEADO_CREDENCIAL` en la SSOT inmutable `TIPOS_EVENTOS_NOTIFICACION`, garantizando cobertura total en el mapeo de plantillas con tipado estricto.
4. **Fachadas Públicas de M17:** Se exportaron `serviciosEmpleados` y `serviciosPermisos` en la raíz `m17.routes.ts` para habilitar inyección limpia en futuros módulos consumidores.
5. **Sincronización Fullstack en Frontend:** Se actualizaron los perfiles mock en `frontend/src/core/auth/useAuth.ts` con la nomenclatura oficial de permisos de PostgreSQL y las guardas del backend (`personal.ver`, `personal.editar`, `personal.desactivar`, `seguridad.gestionar_permisos`).

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas
- **CA-ADM-01-01:** La credencial temporal se genera con suficiente entropía y se despacha de forma segura al correo registrado del empleado.
- **RF-NOT-01-02 & RF-NOT-03-01:** Mapeo tipado y exhaustivo en `NotificacionesService` para la plantilla `alta_empleado_credencial`.
- **RF-NOT-03-04:** La plantilla define `['nombre', 'credencial_temporal']` como variables obligatorias inviolables.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Hashing y Credenciales (`HU-SEG-01`):** Derivación centralizada con BCrypt costo 12 a través de `CredencialesService.derivarContrasena`.
- 🛡️ **M17 - Autorización en Servidor (`HU-ADM-03`):** Endpoints administrativos y de notificaciones protegidos con `guardas.sesionVigente()` y `guardas.requierePermiso(...)`.
- 📧 **M18 - Notificaciones Transaccionales (`HU-NOT-01`):** Emisión desacoplada de correo transaccional vía SMTP con política de reintentos y bitácora de auditoría.
- 🆔 **M04 - Unicidad de Identidad (`HU-CUE-08`):** Verificación estricta de unicidad de correo en BD antes de crear el usuario.
- 👁️ **M20 - Mínima Exposición (`HU-SEG-06`):** Ocultamiento estricto de contraseñas y datos sensibles en respuestas HTTP y bitácoras.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 Historia de Usuario: HU-ADM-01 & HU-NOT-01 — Despacho de Credencial de Empleado

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ADM-01-01** | **Dado que** soy administrador y creo una cuenta de empleado...<br>**Cuando** se crea con éxito...<br>**Entonces** el sistema despacha la credencial inicial al correo del empleado. | Invocación de `servicioNotificaciones.procesarEvento` en `crearEmpleado` | ✅ **CUMPLIDO** |
| **CA-SEG-01-02** | **Dado que** se genera una credencial temporal...<br>**Cuando** se persiste en la BD...<br>**Entonces** se deriva mediante BCrypt costo 12 sin duplicar código. | Delegación a `CredencialesService.derivarContrasena` (DRY) | ✅ **CUMPLIDO** |
| **CA-NOT-03-01** | **Dado que** existe una plantilla de credenciales...<br>**Cuando** se procesa el evento...<br>**Entonces** se renderizan las variables obligatorias en el correo. | Plantilla `alta_empleado_credencial` cargada en el repositorio | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Módulo M20 (Seguridad):** Requiere que `CredencialesService` y `SesionService` estén disponibles para derivar hashes y cerrar sesiones.
- **Módulo M18 (Notificaciones):** Requiere transporte SMTP operativo para despachar la credencial por correo en producción.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Módulo M04 (Cuentas y Login):** Los empleados creados por M17 ya cuentan con usuario, rol individual y credencial lista para ser utilizada en el login oficial.
- **Frontend (`useAuth.ts`):** Las pruebas y el alternador de roles simulan con total fidelidad los permisos exactos que evalúan las guardas del backend.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m18-notificaciones/dtos/envio.dto.ts` | Adición del evento `ALTA_EMPLEADO_CREDENCIAL` a `TIPOS_EVENTOS_NOTIFICACION`. |
| **[MODIFICADO]** | `backend/src/modules/m18-notificaciones/services/notificaciones.service.ts` | Mapeo de plantilla para `ALTA_EMPLEADO_CREDENCIAL`. |
| **[MODIFICADO]** | `backend/src/modules/m18-notificaciones/repositories/plantilla.repository.ts` | Incorporación de la plantilla `alta_empleado_credencial`. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/services/empleados.service.ts` | Eliminación de `bcrypt` (DRY), inyección de M20/M18 y despacho de correo. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/m17.routes.ts` | Inyección de dependencias en `EmpleadosService` y exportación de fachadas públicas. |
| **[MODIFICADO]** | `frontend/src/core/auth/useAuth.ts` | Sincronización de permisos en perfiles mock con el seed oficial de PostgreSQL. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Registro de versión `v1.8.1`. |
| **[NUEVO]** | `docs/walkthroughs/M18/walkthrough_v1.8.1_M18_M17_integracion_backend.md` | Este documento de walkthrough oficial. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ (22 tests M18 superados, 0 fallos)`
* **Compilación TypeScript Backend (`tsc --noEmit`):** `✅ 0 errores`
* **Compilación TypeScript Frontend (`vue-tsc && vite build`):** `✅ 0 errores`
* **Apego al Diagrama de Flujo:** `✅ 100% Coincidente`
