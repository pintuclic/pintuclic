# WALKTHROUGH DE IMPLEMENTACIÓN

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.7.0`
* **Módulo de Origen:** `M17 - Permisos y Roles (administración de empleados)`
* **Fecha de Entrega:** `08/10/2026`
* **Autor / Responsable:** `brayan (con apoyo de Agente de IA)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ADM-01** | Gestión de cuentas de empleado (alta y edición de contacto) | **100% Cumplida** | `EmployeeForm.vue`, `dtos/empleado.dto.ts` |
| **HU-ADM-02** | Asignación de permisos individuales por empleado | **100% Cumplida** | `Permissions.vue` (casilla "Seleccionar todos"), `PersonDetail.vue` (permisos asignados en la ficha) |

### Descripción del Alcance de la Versión
El formulario de alta y edición de empleados mostraba un solo mensaje genérico (o la ayuda nativa del navegador, "Completa este campo") y permitía crear empleados con números en el nombre. Ahora cada campo se valida con su propio mensaje específico, que aparece debajo del campo y desaparece al corregirlo. Los campos de teléfono y documento solo admiten dígitos: las letras y símbolos se descartan al escribir o pegar, y la longitud máxima queda limitada en el propio campo.

En **Roles y permisos**, tras elegir un empleado aparece la casilla **"Seleccionar todos"**, que marca o desmarca de una vez todos los permisos asignables, con un contador `N de M asignados`. Con un texto en el buscador, la casilla pasa a llamarse "Seleccionar todos los resultados" y solo afecta a los permisos visibles.

En la **ficha del empleado** (`/admin/empleados/:id`) se agrega la sección **"Permisos asignados"**: contador, permisos agrupados por área con su descripción y código, estado vacío cuando no tiene permisos y enlace "Asignar / Modificar permisos" a Roles y permisos (reemplaza el enlace "Administrar permisos" del panel de estado).

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Nombre completo:** obligatorio, 2 a 150 caracteres, solo letras (con tildes y ñ), espacios, apóstrofo, punto y guion. Sin números.
- **Documento de identidad:** obligatorio en el alta, solo dígitos, entre 5 y 10 (cédula de ciudadanía colombiana).
- **Teléfono:** obligatorio, exactamente 10 dígitos (formato nacional de celulares y fijos en Colombia).
- **Correo:** regla transversal `correoSchema` de `core/dtos` (sin cambios).
- **Errores del servidor:** los errores de validación del backend (`400 VALIDATION_ERROR` con `details`) y el correo duplicado (`409`) se muestran en el campo correspondiente; cualquier otro error conserva la alerta general.
- **Seleccionar todos:** omite los permisos exclusivos del administrador (`reserved()`) y aplica `togglePermission` a cada permiso, por lo que agrega automáticamente el permiso `.ver` del área y, al desmarcar, retira también los que dependen de él. Los cambios no se guardan hasta pulsar "Guardar permisos".
- **Ficha del empleado:** los permisos se consultan siempre frescos (`permissions(id, true)`) y la sección solo se muestra a administradores, que son quienes cargan el catálogo y pueden consultar permisos ajenos. Los nombres de área se centralizan en `areaNames` (`services/permission-rules.ts`), compartido con `Permissions.vue`.
- Al editar un empleado existente, el teléfono guardado se normaliza a solo dígitos antes de calcular si hay cambios sin guardar.

### B. Políticas Transversales Validadas
- 🛡️ **M17 - Autorización en Servidor (`HU-ADM-03`):** sin cambios; las mismas reglas se aplican también en el backend (ver walkthrough de backend de esta versión).
- 🆔 **M04 - Unicidad de Identidad (`HU-CUE-08`):** el `409` de correo duplicado ahora se señala en el campo de correo.
- 🎨 **Design System Pintuclic:** se reutiliza el estado de error del componente `Input` de core; no se añadieron colores.
- 📐 **DTOs sin validación inline (directiva 12):** los esquemas Zod viven en `m17-permisos/dtos/empleado.dto.ts`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 Historia de Usuario: HU-ADM-01 — Gestión de cuentas de empleado

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-VAL-01** | **Dado que** el administrador escribe `Juan123` como nombre<br>**Cuando** pulsa "Crear empleado"<br>**Entonces** el campo nombre indica que solo admite letras y espacios y no se envía la solicitud. | Prueba manual en navegador (`/admin/empleados/nuevo`) | ✅ **CUMPLIDO** |
| **CA-VAL-02** | **Dado que** el administrador escribe `12ab3` en documento y `300abc123` en teléfono<br>**Cuando** escribe<br>**Entonces** los campos solo conservan `123` y `300123`. | Prueba manual en navegador | ✅ **CUMPLIDO** |
| **CA-VAL-03** | **Dado que** documento tiene 3 dígitos, teléfono 6 y correo es inválido<br>**Cuando** pulsa "Crear empleado"<br>**Entonces** cada campo muestra su error específico (mínimo 5 dígitos, exactamente 10 dígitos, correo inválido). | Prueba manual en navegador | ✅ **CUMPLIDO** |
| **CA-PER-01** | **Dado que** el administrador eligió un empleado sin permisos<br>**Cuando** marca "Seleccionar todos"<br>**Entonces** se marcan los 13 permisos asignables y ninguno de los 6 exclusivos del administrador. | Prueba manual en navegador (`/admin/permisos`) | ✅ **CUMPLIDO** |
| **CA-PER-02** | **Dado que** están todos marcados<br>**Cuando** desmarca la casilla<br>**Entonces** el contador vuelve a `0 de 13 asignados`. | Prueba manual en navegador | ✅ **CUMPLIDO** |
| **CA-PER-03** | **Dado que** filtra por `editar`<br>**Cuando** marca "Seleccionar todos los resultados"<br>**Entonces** solo se marca el permiso visible asignable junto con su permiso `.ver` requerido. | Prueba manual en navegador | ✅ **CUMPLIDO** |
| **CA-PER-04** | **Dado que** el administrador abre la ficha de un empleado con permisos<br>**Entonces** ve la sección "Permisos asignados" con el total y los permisos agrupados por área. | Prueba manual en navegador (`/admin/empleados/5` y `/admin/empleados/9`) | ✅ **CUMPLIDO** |
| **CA-VAL-04** | **Dado que** un campo muestra un error<br>**Cuando** el administrador lo corrige<br>**Entonces** su mensaje desaparece y los demás se mantienen. | Prueba manual en navegador | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Core frontend:** componente `Input` (prop `error`) y `correoSchema` de `core/dtos/seguridad.dto.ts`. No se modificaron.
- **Backend M17:** formato de error `{ error: { message, details[{ field, message }] } }` del `errorHandler` de core.

### B. Dependencias Hacia Adelante
- Los empleados creados quedan con nombre, documento y teléfono consistentes, lo que facilita búsquedas y la notificación de credenciales (M18).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** solo se modificaron archivos de `frontend/src/modules/m17-permisos/`.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/dtos/empleado.dto.ts` | Reglas de nombre, documento y teléfono con mensajes específicos; constantes de longitud. |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/views/Permissions.vue` | Casilla "Seleccionar todos" con contador; respeta filtro, permisos reservados y dependencias. |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/views/PersonDetail.vue` | Sección "Permisos asignados" en la ficha del empleado. |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/services/permission-rules.ts` | `areaNames` compartido entre vistas. |
| **[MODIFICADO]** | `frontend/src/modules/m17-permisos/views/EmployeeForm.vue` | Errores por campo, `novalidate`, filtro de dígitos, mapeo de errores del backend. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`vue-tsc -b` y ESLint del módulo sin errores; prueba manual en navegador)
* **Apego al Diagrama de Flujo:** `✅ Sin cambios en el flujo de alta; solo se endurece la validación de entrada`
