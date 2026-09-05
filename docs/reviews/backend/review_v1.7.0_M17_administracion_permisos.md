# 📋 Reporte de Revisión Técnica: M17 - Administración, Empleados y Permisos

| Parámetro | Detalle |
| :--- | :--- |
| **Módulo Auditado:** | `M17 - Administración, Empleados y Permisos (Backend)` |
| **Versión Entregada:** | `v1.7.0` |
| **Tipo de Revisión:** | Auditoría de Arquitectura, Calidad de Código (ESLint), Integración y Sincronización Fullstack |
| **Fecha:** | 2026-09-05 |
| **Dictamen Final:** | **✅ APROBADO CON OBSERVACIONES MENORES (Ajustes de Linter y CHANGELOG Aplicados)** |

---

## 🎯 1. Resumen de la Evaluación

Se llevó a cabo la auditoría técnica de la entrega del backend de **M17 (Administración, Empleados y Permisos)** correspondiente a las historias de usuario `HU-ADM-01`, `HU-ADM-02`, `HU-ADM-04` y `HU-ADM-06`.

### Fortalezas de la Implementación
1. **Decisión Arquitectónica de Permisos (Opción A):**  
   Resolvió con gran elegancia el requerimiento de permisos individuales por empleado sin forzar migraciones en el DDL de base de datos (`schema v2.3`), generando un rol individual `empleado_{id_usuario}` vinculado a `asignacion_permiso`. Esto mantiene 100% la compatibilidad nativa con el motor de autorización en servidor de M20.
2. **Cumplimiento de Políticas Transversales:**  
   - `HU-SEG-01`: Credenciales temporales hasheadas mediante BCrypt con costo de sal 12.
   - `HU-SEG-06`: Anonimización rigurosa de contraseñas y datos sensibles en las respuestas HTTP de empleados y clientes.
   - `HU-CUE-08`: Validación de unicidad global de correo previa a la creación de empleados.
   - `RF-ADM-01-14` y `RF-ADM-02-10`: Protección inviolable del Administrador raíz (`ID: 1`), impidiendo su baja lógica o modificación de permisos.
   - `RF-SEG-02-06`: Invocación a M20 para invalidar sesiones activas tras la baja lógica de un empleado.
3. **Regla de Cascada en Permisos:**  
   Implementación consistente de la bidireccionalidad en dependencias de permisos (revocación y otorgamiento en cascada).

---

## 🔍 2. Hallazgos y Ajustes Realizados

Durante la integración y verificación técnica en la rama `feature/m17-permisos-roles`, se detectaron y subsanaron los siguientes puntos menores:

### ⚠️ Hallazgo #1: Advertencias de Linter por Imports No Utilizados

- **Archivos:**
  - `backend/src/modules/m17-permisos/repositories/empleados.repository.ts`
  - `backend/src/modules/m17-permisos/services/permisos.service.ts`
- **Descripción:**
  - En `empleados.repository.ts` se importaba `EmpleadoDetalle` sin ser utilizado en el archivo.
  - En `permisos.service.ts` se importaba `PermisoDetalle` sin ser utilizado en el archivo.
- **Acción Correctiva:**
  Se purgaron ambos imports redundantes y se eliminó el Byte Order Mark (BOM) UTF-8, logrando que `npm run lint` ejecute con **0 errores y 0 advertencias**.

---

### ⚠️ Hallazgo #2: Desincronización y Mojibake en `docs/CHANGELOG.md`

- **Archivo:** `docs/CHANGELOG.md`
- **Descripción:**
  Al preparar el commit del backend, el archivo central de changelog fue guardado con una codificación local que corrompió caracteres especiales UTF-8 (`Ã³`, `âœ…`, `ðŸ”—`) y además sobrescribió la versión previa `v1.6.0` de M20 (Protección de Datos Personales HU-SEG-05) y la entrada de frontend de M17.
- **Acción Correctiva:**
  1. Se restauró la codificación UTF-8 pura en todo el archivo.
  2. Se consolidó la versión `v1.7.0` como **entrega Fullstack de M17**, documentando de forma estructurada los hitos del backend (empleados, cascada de permisos, clientes, parámetros) junto con los hitos del frontend (simulación de roles, `useAuth.ts`, widget `DevRoleSwitcher.vue`).
  3. Se preservó intacta la sección `v1.6.0` correspondiente a M20 Backend.

---

### ℹ️ Ajuste de Complementariedad: Registro del Permiso de Privacidad en Frontend

- **Archivos:**
  - `frontend/src/core/auth/useAuth.ts`
  - `frontend/src/core/components/DevRoleSwitcher.vue`
- **Descripción:**
  En el walkthrough de M20 (`walkthrough_v1.6.0_M20_privacidad_backend.md`), el equipo de seguridad solicitó formalmente a M17 registrar el permiso `seguridad.gestionar_privacidad` para habilitar la cola administrativa de solicitudes de supresión de datos.
- **Acción Aplicada:**
  Se añadió `seguridad.gestionar_privacidad` a los permisos de administrador en `useAuth.ts` y se agregó su chip reactivo en `DevRoleSwitcher.vue`.

---

### ⚠️ Hallazgo #3: Auto-siembra de Catálogo en Código y Violación de Pureza en `interfaces/`

- **Archivos Originales:**
  - `backend/src/modules/m17-permisos/interfaces/m17.interfaces.ts` (`PERMISOS_SISTEMA`)
  - `backend/src/modules/m17-permisos/repositories/permisos.repository.ts` (`sembrarPermisosDelSistema()`)
  - `backend/src/modules/m17-permisos/services/permisos.service.ts` (`sembrarPermisosSistema()`)
  - `backend/src/modules/m17-permisos/m17.routes.ts` (`void permisosService.sembrarPermisosSistema()`)
- **Descripción:**
  El backend declaró una constante en memoria `PERMISOS_SISTEMA` con 14 objetos dentro del archivo de interfaces y disparaba una inserción automática a PostgreSQL cada vez que Express importaba las rutas (`m17.routes.ts`).
- **Problemas Identificados:**
  1. **Violación de Pureza:** `interfaces/` debe contener exclusivamente contratos de compilación (`interface`, `type`), con cero datos estáticos y cero runtime.
  2. **Violación del Origen Único de Datos:** La única fuente de la verdad para datos iniciales, mocks y catálogos maestros es `bd/sql/seed_pintuclic.sql` (`npm run db:seed`). Los servidores HTTP no deben inyectar datos silenciosamente al arrancar.
  3. **Disparidad de Nombres:** Existían discrepancias entre los permisos preexistentes en la BD (`productos.crear`, `ordenes.ver`, `usuarios.gestionar`) y los hardcodeados en el array (`catalogo.crear`, `ventas.ver`, `personal.ver`).
- **Acción Correctiva:**
  1. **Consolidación en el Seed Oficial:** Se incorporaron los 14 permisos oficiales y el permiso de privacidad de M20 directamente en `bd/sql/seed_pintuclic.sql` (IDs 1 al 19), asignados al rol administrador.
  2. **Eliminación de la Auto-siembra:** Se eliminaron las funciones `sembrarPermisosDelSistema` del repositorio, servicio y la invocación en `m17.routes.ts`. La API consulta de forma pura y reactiva la tabla `permisos` de PostgreSQL.
  3. **Purificación de `m17.interfaces.ts`:** Se removió `PERMISOS_SISTEMA`, dejando el archivo 100% libre de runtime, conservando únicamente `DEPENDENCIAS_PERMISOS` como regla de negocio tipada para la cascada.
  4. **Directiva 10 en `AGENTS.md`:** Se formalizó la prohibición expresa de auto-siembras y arrays de datos en código para todos los desarrolladores y agentes de IA.

---

## 🛡️ 3. Matriz de Verificación de Calidad

| Validación | Comando | Resultado |
| :--- | :--- | :---: |
| Compilación TypeScript Backend | `npx tsc --noEmit` | ✅ Código 0 (Limpio) |
| Linter Backend (ESLint) | `npm run lint` | ✅ Código 0 (0 warnings, 0 errors) |
| Compilación Frontend | `npm run build` | ✅ Código 0 (Limpio) |
| Linter Frontend (ESLint) | `npm run lint` | ✅ Código 0 (0 warnings, 0 errors) |
| Aislamiento de Módulo | `backend/src/modules/m17-permisos/` | ✅ Estricto y respetado |
| Montaje de Rutas HTTP | `backend/src/app.routes.ts` (`/api/admin`) | ✅ Correcto |
| Walkthrough Backend | `walkthrough_v1.7.0_M17_administracion_permisos_backend.md` | ✅ Presente y con sufijo oficial |

---

## 🏁 4. Dictamen del Líder Técnico

La implementación backend del módulo **M17** cumple a cabalidad con los Criterios de Aceptación funcionales y las políticas de arquitectura y seguridad. Con los ajustes menores de linter y sincronización documental aplicados, el módulo queda **formalmente APROBADO**.
