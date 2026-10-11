# WALKTHROUGH DE IMPLEMENTACIÓN

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.7.3`
* **Módulo de Origen:** `M17 - Permisos y Roles (Frontend)`
* **Fecha de Entrega:** `10/10/2026`
* **Autor / Responsable:** `Agente de IA (Frontend Engineer)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ADM-01** | Gestión de cuentas de empleado y perfiles | **100% Cumplida** | `useM17.ts` (desenmascaramiento de errores de servidor en formularios) |
| **HU-ADM-02** | Asignación y administración de permisos individuales | **100% Cumplida** | `useM17.ts`, `Permissions.vue` (despliegue de errores al intentar asignar permisos restringidos) |
| **HU-ADM-04** | Consulta y bloqueo administrativo de clientes | **100% Cumplida** | `StatusModal.vue`, `useM17.ts` (muestra de mensajes 403 específicos como protección del admin raíz) |
| **RF-ADM-06** | Configuración operativa de parámetros del sistema | **100% Cumplida** | `parametro.dto.ts` (sincronización de límite de inactividad de clientes a 30 días / 2.592.000 s) |

### Descripción del Alcance de la Versión
Resolución integral de las inconsistencias del Frontend de M17 detectadas en la auditoría de calidad QA (Hallazgo 4 y Hallazgo 7 de sincronización). Corrige el enmascaramiento genérico de errores en el composable global `useM17.ts`, permitiendo que la interfaz presente los mensajes semánticos y estructurados generados por el backend (tales como la prohibición de auto-bloqueo del administrador raíz y el rechazo de permisos reservados). Asimismo, alinea los metadatos y esquemas Zod de parámetros del sistema (`parametro.dto.ts`) para que el rango máximo y el valor por defecto de inactividad de clientes sean de 30 días (`2592000` segundos), garantizando paridad total con la base de datos y la capa de backend.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
1. **Extracción y Despliegue Semántico de Errores de API (`useM17.ts`):**
   - La función `message(error: unknown)` ahora extrae jerárquicamente `error.response.data.error.message`, `error.response.data.error` (cuando es string) y `error.response.data.message`.
   - Ante respuestas `403 FORBIDDEN` con mensaje de negocio del servidor (ej: *"No se puede bloquear al Administrador raíz del sistema (RF-ADM-04-12)"* o intentos de alterar cuentas protegidas), se presenta dicho mensaje en lugar de limpiar agresivamente el estado del panel o arrojar un mensaje genérico.
   - Ante errores `400 BAD_REQUEST`, `404 NOT_FOUND` o `409 CONFLICT`, se presenta la causa raíz reportada por el servidor en lugar de `"No se pudo guardar el cambio."`.
2. **Sincronización de Parámetros Globales (`parametro.dto.ts`):**
   - El límite máximo (`max`) y el valor por defecto (`default`) de `inactividad_cliente_segundos` se ajustan de `7776000` (90 días) a `2592000` (30 días).
   - El esquema Zod `parametroSchema` valida que cualquier valor ingresado por el administrador se mantenga dentro de `[300, 2592000]` segundos.
3. **Mantenimiento y Aislamiento de Suite de Pruebas:**
   - Se actualiza el mock de prueba en `integration.test.mjs` con un documento numérico válido (`1023456789`) para cumplir con la regla estricta de solo dígitos de `empleado.dto.ts`.

### B. Políticas Transversales Validadas
- 🛡️ **M17 - Autorización en Servidor (`HU-ADM-03`):** El cliente despliega con fidelidad las respuestas emitidas por las guardas del servidor.
- 📐 **Directiva 12 - Esquemas Zod en `dtos/`:** Los esquemas de validación de parámetros residen en `dtos/parametro.dto.ts` sin validaciones inline en los componentes `.vue`.
- 🎨 **Directiva 8 - Tokens Oficiales de Color:** Los componentes reutilizan exclusivamente los tokens del Design System de Pintuclic (`danger`, `neutral`, `action`, `corporate`).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :--- :---: |
| **CA-FE-M17-01** | **Dado que** el backend retorna un error estructurado `{ error: { message: "Texto de error" } }`<br>**Cuando** ocurre un fallo en una operación de M17<br>**Entonces** `message(e)` retorna `"Texto de error"` y la vista lo muestra visiblemente. | Prueba unitaria y verificación en `useM17.ts` | ✅ **CUMPLIDO** |
| **CA-FE-M17-02** | **Dado que** el administrador intenta bloquear al usuario raíz (`id=1`) desde el modal de estado<br>**Cuando** el backend responde `403 FORBIDDEN`<br>**Entonces** el modal muestra el mensaje exacto de protección del administrador sin caer en fallback genérico. | Prueba en `StatusModal.vue` y `useM17.ts` | ✅ **CUMPLIDO** |
| **CA-FE-M17-03** | **Dado que** el administrador asigna un permiso reservado que el backend rechaza con 400<br>**Cuando** se pulsa "Guardar permisos"<br>**Entonces** la vista de Permisos despliega la lista de permisos no asignables reportada por el servidor. | Validación en `Permissions.vue` | ✅ **CUMPLIDO** |
| **CA-FE-M17-04** | **Dado que** el administrador consulta la vista de configuración de parámetros<br>**Entonces** el rango de inactividad de clientes indica 300–2.592.000 segundos (30 días) y valida valores mayores a 2.592.000 con error de formulario. | Validación de esquema Zod en `parametro.dto.ts` | ✅ **CUMPLIDO** |
| **CA-FE-M17-05** | **Dado** el comando `npm run test:m17`<br>**Entonces** el 100% de las 8 pruebas unitarias y de integración del módulo pasan exitosamente. | Ejecución de `test:m17` con `node --test` | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Backend M17:** Protocolo estandarizado de respuesta de error `{ success: false, error: { code, message } }`.
- **Core HTTP:** Cliente Axios compartido (`@/core/api/axios`).

### B. Dependencias Hacia Adelante
- **Experiencia de Usuario (UX):** Los administradores y operadores del panel reciben retroalimentación clara e inmediata sobre rechazos de autorización y validaciones de negocio en lugar de mensajes genéricos confusos.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Límites de Módulo:** Modificaciones restringidas estrictamente al módulo `frontend/src/modules/m17-permisos/` y archivos de versionamiento.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/store/useM17.ts` | Extracción de `data.error.message` y preservación de mensajes en respuestas 403. |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/dtos/parametro.dto.ts` | Sincronización de límite y valor por defecto de inactividad de cliente a 30 días. |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/tests/integration.test.mjs` | Actualización de mock con cédula numérica válida para pasar la suite de pruebas. |
| **[CREADO]** | `docs/walkthroughs/M17/walkthrough_v0.4.7.3_M17_resolucion_inconsistencias_qa_frontend.md` | Walkthrough técnico oficial de la entrega frontend. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `npm run test:m17`: **8 pruebas superadas, 0 fallidas (100% PASS)**.
  * `npx eslint src/modules/m17-permisos`: **0 errores, 0 advertencias**.
* **Apego a las Directivas de Gobernanza:** `✅ CUMPLIDO AL 100%` (Aislamiento de módulo y DTOs dedicados sin validaciones inline).
