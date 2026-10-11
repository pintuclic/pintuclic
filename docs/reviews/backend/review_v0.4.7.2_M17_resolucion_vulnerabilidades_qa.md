# 📋 Reporte de Revisión Técnica: M17 - Permisos y Roles (Backend)

| Parámetro | Detalle |
| :--- | :--- |
| **Módulo Auditado:** | `M17 - Permisos y Roles (Administración, Empleados y Permisos)` |
| **Versión Entregada:** | `v0.4.7.2` |
| **Tipo de Revisión:** | Auditoría de Arquitectura, Modelo Relacional, Seguridad y Calidad |
| **Fecha:** | 2026-10-10 |
| **Dictamen Final:** | **✅ APROBADO CON OBSERVACIONES** |

---

## 🎯 1. Resumen de la Evaluación

Se evaluó la entrega técnica correspondiente a la versión `v0.4.7.2` del Backend del módulo **M17 (Permisos y Roles)**, desarrollada en respuesta a los hallazgos críticos y observaciones de la auditoría de calidad QA sobre el panel de administración.

### Fortalezas Destacadas de la Entrega:
1. **Neutralización del Auto-Bloqueo del Administrador Raíz (`RF-ADM-04-12`, `RF-ADM-02-10`):** Se implementó un esquema de doble capa en `clientes.repository.ts` (exclusión estricta de `r.nombre != 'administrador'`, roles de empleado y filtro explícito `u.id_usuario != 1`), respaldado por guardas defensivas en `clientes.service.ts` y mapeo semántico de error a `403 FORBIDDEN` en `clientes.controller.ts`.
2. **Cierre de Brecha de Escalamiento de Privilegios (`HU-SEG-03` / `HU-ADM-03`):** Se elevó el nivel de autorización en la ruta `POST /api/admin/empleados` de `personal.ver` a `personal.editar`, impidiendo que usuarios con acceso de solo lectura generen cuentas operativas.
3. **Erradicación de Fuga de Credenciales (`HU-SEG-06`):** Se eliminó por completo la propiedad `contrasena_temporal` del payload HTTP retornado por `empleados.service.ts` y de la interfaz `EmpleadoCreadoRespuesta`, garantizando que las credenciales temporales viajen única y exclusivamente a través del canal seguro de correo SMTP desacoplado (M18).
4. **Protección Contra Asignación de Permisos de Superadmin (`HU-ADM-02`):** Implementación de una lista negra inmutable (`PERMISOS_RESERVADOS_ADMIN`) en `permisos.service.ts` que valida tanto en asignación unitaria como en reemplazo en lote, respondiendo con `400 BAD_REQUEST` ante cualquier intento de otorgar capacidades reservadas a empleados regulares.
5. **Sincronización de Parámetros Globales (`RF-ADM-06`):** Corrección del valor por defecto de inactividad de clientes de 90 días a 30 días (`2592000` s) y ajuste de su rango admitido, alineándolo con las políticas de M20 y la tabla `sesion`.
6. **Aislamiento de Módulo Riguroso (Directiva 1):** El 100% de los cambios se mantuvo dentro del límite de `backend/src/modules/m17-permisos/` y la documentación técnica de versionado, sin intervenir código de otros módulos.

---

## 🔍 2. Hallazgos y Análisis Técnico

### ℹ️ Observación Técnica #1: Deuda Técnica de Pureza de Capas en `interfaces/` (Directiva 10)
- **Archivos Afectados:** `backend/src/modules/m17-permisos/interfaces/m17.interfaces.ts` (líneas 42-52)
- **Descripción Técnica:** El archivo define la constante ejecutable `export const DEPENDENCIAS_PERMISOS = { ... }`. La directiva de arquitectura 10 establece que la carpeta `interfaces/` debe contener exclusivamente contratos estáticos (`interface`, `type`) con **cero runtime**.
- **Impacto:** Bajo. La constante viene de versiones anteriores del módulo y no genera fallos de ejecución, pero representa una leve desviación del estándar de pureza de capas.
- **Causa Raíz:** Declaración de mapas de configuración estática dentro de archivos de tipos.
- **Acción Requerida para Futuras Versiones:** Mover `DEPENDENCIAS_PERMISOS` a un archivo de constantes o directamente a `services/permisos.service.ts` durante la próxima refactorización programada.

### ℹ️ Observación Técnica #2: Persistencia de Parámetros en Memoria Volátil (`RF-ADM-06`)
- **Archivos Afectados:** `backend/src/modules/m17-permisos/repositories/parametros.repository.ts`
- **Descripción Técnica:** La actualización de parámetros se realiza sobre el mapa en memoria `estadoParametros`. Aunque los rangos y valores por defecto quedaron corregidos a 30 días, las modificaciones no se persisten en base de datos.
- **Impacto:** Medio. Si el contenedor o proceso de NodeJS se reinicia, las modificaciones a los parámetros del sistema vuelven a los valores por defecto.
- **Causa Raíz:** El esquema relacional oficial actual (`schema_pintuclic.sql v2.1`) no cuenta aún con una tabla dedicada `parametros_sistema`.
- **Acción Requerida para Futuras Versiones:** Coordinar con el equipo de base de datos la creación de la tabla en una migración futura para desacoplar el repositorio de la memoria RAM.

---

## 🛡️ 3. Matriz de Verificación de Calidad

| Validación | Comando / Criterio | Resultado |
| :--- | :--- | :---: |
| Compilación TypeScript | `npx tsc --noEmit` en módulo M17 | ✅ Código 0 (Tipado estricto sin `any`) |
| Linter Estricto | `npm run lint` / ESLint en M17 | ✅ 0 errores, 0 advertencias |
| Integridad con Esquema BD | `bd/sql/schema_pintuclic.sql` | ✅ Totalmente alineado con tipos Kysely |
| Origen de Datos (Sin Auto-Siembra) | `bd/sql/seed_pintuclic.sql` | ✅ Respeta Directiva 10 (Cero auto-inserts al arrancar) |
| Políticas de Seguridad | `HU-SEG-01`, `HU-SEG-06`, `HU-ADM-03` | ✅ Cumple al 100% (Sin fuga de claves, control en servidor) |
| Protección Administrador Raíz | `RF-ADM-02-10`, `RF-ADM-04-12` | ✅ Blindado (Doble filtro y rechazo 403 FORBIDDEN) |
| Aislamiento de Módulo | Directiva 1 de Gobernanza | ✅ 0 archivos modificados fuera de M17 |
| Nomenclatura de Walkthrough | Sufijo `_[backend|frontend].md` | ✅ Cumple (`..._qa_backend.md`) |
| Control de Versiones | `.github/version.txt` y `CHANGELOG.md` | ✅ `0.4.7.2` sincronizado en ambos archivos |

---

## 🏁 4. Dictamen del Líder Técnico

### Dictamen: **✅ APROBADO CON OBSERVACIONES**

La entrega de la versión **`v0.4.7.2`** del Backend de **M17 (Permisos y Roles)** cumple con los más altos estándares de calidad, seguridad y arquitectura definidos para la plataforma Pintu Clic.

Las tres vulnerabilidades críticas reportadas en la auditoría de QA fueron resueltas de raíz con un enfoque de defensa en profundidad:
1. El Administrador raíz queda completamente protegido contra auto-bloqueo y exposición en la API de clientes.
2. Se eliminó la brecha de fuga de credenciales temporales en las respuestas HTTP.
3. Se blindó la creación de empleados y la asignación de permisos contra escalamiento de privilegios.

Las dos observaciones técnicas registradas corresponden a deuda técnica previa que no compromete la estabilidad ni la seguridad del sistema y serán abordadas en el ciclo de refactorización posterior.

**Autorización:** Se autoriza la integración y promoción del código de la rama `feature/m17-permisos-roles` hacia el flujo principal de `develop`.
