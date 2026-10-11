# WALKTHROUGH DE IMPLEMENTACIÓN

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.7.2`
* **Módulo de Origen:** `M17 - Permisos y Roles (Backend)`
* **Fecha de Entrega:** `10/10/2026`
* **Autor / Responsable:** `Santiago (con apoyo de Agente de IA)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ADM-01** | Gestión de cuentas de empleado y credenciales temporales | **100% Cumplida** | `POST /api/admin/empleados` (guarda `personal.editar`, eliminación de credencial en payload) |
| **HU-ADM-02** | Asignación y control de permisos por empleado | **100% Cumplida** | `PUT /api/admin/empleados/:id/permisos` (bloqueo de permisos reservados de superadmin) |
| **HU-ADM-03** | Autorización estricta en servidor | **100% Cumplida** | Control de acceso en endpoints administrativos y guardas defensivas |
| **HU-ADM-04** | Consulta y bloqueo administrativo de clientes | **100% Cumplida** | `GET /api/admin/clientes`, `PATCH /api/admin/clientes/:id/bloquear` (exclusión y protección de ID raíz) |
| **RF-ADM-06** | Configuración operativa de parámetros del sistema | **100% Cumplida** | `parametros.repository.ts` (ajuste a 30 días de inactividad de cliente) |

### Descripción del Alcance de la Versión
Resolución integral y blindaje de seguridad para las vulnerabilidades e inconsistencias identificadas durante la auditoría de calidad técnica QA sobre el backend de M17. Corrige fallos de auto-bloqueo del administrador raíz, fugas de credenciales en respuestas HTTP, escalamiento de privilegios por asignación indebida de permisos de superadministrador a empleados y desincronización de tiempos en parámetros del sistema.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
1. **Protección Absoluta del Administrador Raíz (`RF-ADM-02-10`, `RF-ADM-04-12`):**
   - El Administrador raíz (`id_usuario = 1`) y las cuentas con rol `'administrador'` son excluidos estrictamente de las consultas de clientes (`listarClientes` y `obtenerClientePorId`).
   - Se implementan guardas en servicio y controlador para rechazar intentos de bloqueo o desbloqueo sobre el ID 1, respondiendo `403 FORBIDDEN`.
2. **Guarda de Autorización en Creación de Personal (`HU-SEG-03`):**
   - La ruta `POST /api/admin/empleados` requiere el permiso de escritura `personal.editar`. Un usuario con únicamente permisos de lectura (`personal.ver`) es denegado en el servidor.
3. **No Exposición de Credenciales (`HU-SEG-06`):**
   - Se suprime la propiedad `contrasena_temporal` del DTO de respuesta en creación de empleados. La credencial inicial de un solo uso viaja exclusivamente a través del servicio transaccional de notificaciones por correo (M18).
4. **Lista Negra de Permisos Reservados (`HU-ADM-02`, `HU-ADM-03`):**
   - Ningún empleado puede recibir permisos exclusivos del superadministrador (`seguridad.configurar_sesion`, `seguridad.gestionar_permisos`, `seguridad.gestionar_privacidad`, `configuracion.ver`, `configuracion.editar`). Todo intento se rechaza en el servidor con código `400 BAD_REQUEST`.
5. **Alineación de Parámetros Globales (`RF-ADM-06`):**
   - El parámetro `inactividad_cliente_segundos` se corrige por defecto a `2592000` segundos (30 días), alineándose con el esquema de base de datos y la política transversal de sesiones de M20.
6. **Inferencia Robusta de Áreas en Catálogo:**
   - Inclusión de mapeo para alias legados (`ordenes` → `ventas`, `usuarios` → `personal`, `productos` → `catalogo`, `estadisticas` → `catalogo`) evitando clasificaciones erróneas en el fallback `'configuracion'`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-QA-M17-01** | **Dado** un intento de listar o consultar al usuario raíz (`id=1`) desde la API de clientes<br>**Entonces** la API retorna `null` / no lo lista, y cualquier intento de bloqueo responde `403 FORBIDDEN`. | Pruebas de integración de repositorio y servicio | ✅ **CUMPLIDO** |
| **CA-QA-M17-02** | **Dado** un empleado con solo permiso `personal.ver` intentando crear un empleado vía `POST /empleados`<br>**Entonces** el middleware de autorización lo rechaza con `403 FORBIDDEN`. | Verificación de guarda de ruta en `m17.routes.ts` | ✅ **CUMPLIDO** |
| **CA-QA-M17-03** | **Dado** un alta exitosa de empleado por un usuario autorizado<br>**Entonces** el payload JSON devuelto contiene solo `{ id_usuario, correo }` sin exponer la contraseña temporal. | Inspección de DTO y prueba de `crearEmpleado` | ✅ **CUMPLIDO** |
| **CA-QA-M17-04** | **Dado** un intento de asignar `seguridad.gestionar_permisos` o `configuracion.editar` a un empleado<br>**Entonces** la API rechaza la petición con `400 BAD_REQUEST` sin persistir cambios. | Validación de lista negra en `permisos.service.ts` | ✅ **CUMPLIDO** |
| **CA-QA-M17-05** | **Dado** el parámetro `inactividad_cliente_segundos`<br>**Entonces** su valor por defecto es `2592000` (30 días) y su rango máximo es `2592000`. | Validación en `parametros.repository.ts` | ✅ **CUMPLIDO** |
| **CA-QA-M17-06** | **Dado** permisos con prefijos legados en la base de datos<br>**Entonces** se agrupan en su área funcional correspondiente sin caer en `configuracion`. | Validación de inferencia en `permisos.repository.ts` | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M20 (Seguridad):** Guardas de autorización (`guardas.requierePermiso`) y esquema de políticas de sesión (30 días cliente).
- **M18 (Notificaciones):** Despacho asíncrono y seguro de la credencial temporal de empleado vía evento `ALTA_EMPLEADO_CREDENCIAL`.

### B. Dependencias Hacia Adelante
- **Panel Administrativo (Frontend):** Recibe respuestas estandarizadas (`400 BAD_REQUEST`, `403 FORBIDDEN`, `404 NOT_FOUND`) y no depende de contraseñas expuestas en el payload de creación de empleados.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Límites de Módulo:** Todas las modificaciones se circunscriben estrictamente a `backend/src/modules/m17-permisos/` y la documentación técnica oficial.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/repositories/clientes.repository.ts` | Exclusión estricta de rol `administrador`, empleados y ID 1 en listado y ficha. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/services/clientes.service.ts` | Guarda defensiva contra bloqueo y desbloqueo del Administrador raíz. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/controllers/clientes.controller.ts` | Respuestas semánticas `403 FORBIDDEN` y `404 NOT_FOUND` en bloqueo/desbloqueo. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/m17.routes.ts` | Actualización de guarda a `personal.editar` en `POST /empleados`. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/services/empleados.service.ts` | Supresión de credencial temporal del retorno de `crearEmpleado`. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/interfaces/m17.interfaces.ts` | Ajuste de interfaz `EmpleadoCreadoRespuesta` sin campo sensible. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/services/permisos.service.ts` | Definición de `PERMISOS_RESERVADOS_ADMIN` y validación en asignación y reemplazo. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/controllers/permisos.controller.ts` | Mapeo de errores a `400 BAD_REQUEST` para permisos reservados. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/repositories/parametros.repository.ts` | Corrección de valor por defecto a 30 días (`2592000` s) y límite de rango. |
| **[MODIFICADO]** | `backend/src/modules/m17-permisos/repositories/permisos.repository.ts` | Mapeo de alias legados en `inferirArea`. |
| **[CREADO]** | `docs/walkthroughs/M17/walkthrough_v0.4.7.2_M17_resolucion_vulnerabilidades_qa_backend.md` | Walkthrough técnico oficial de la versión `v0.4.7.2`. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `npx eslint src/modules/m17-permisos`: **0 errores, 0 advertencias**.
  * `npx tsc --noEmit`: compila limpio sin errores en el módulo.
* **Apego a Estándares de Seguridad:** `✅ CUMPLIDO AL 100%` (`HU-SEG-03`, `HU-SEG-06`, `HU-ADM-03`, `RF-ADM-02-10`, `RF-ADM-04-12`).
