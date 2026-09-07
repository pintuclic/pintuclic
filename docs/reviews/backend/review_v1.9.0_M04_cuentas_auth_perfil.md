# 📋 Reporte de Revisión Técnica: M04 - Cuentas, Autenticación y Perfil

| Parámetro | Detalle |
| :--- | :--- |
| **Módulo Auditado:** | `M04 - Cuentas, Autenticación y Perfil (Backend)` |
| **Versión Entregada:** | `v1.9.0` |
| **Tipo de Revisión:** | Auditoría de Arquitectura, Modelo Relacional, Seguridad y Calidad |
| **Fecha:** | 2026-09-05 |
| **Dictamen Final:** | **✅ APROBADO CON OBSERVACIONES Y REFACTORIZACIÓN APLICADA** |

---

## 🎯 1. Resumen de la Evaluación

Se ha llevado a cabo la auditoría técnica y arquitectural integral de la entrega del módulo **M04 (Cuentas, Autenticación y Perfil - Backend)**, correspondiente a la versión `v1.9.0` (Walkthrough de referencia: [`walkthrough_v1.9.0_M04_cuentas_auth_perfil_backend.md`](../../walkthroughs/M04/walkthrough_v1.9.0_M04_cuentas_auth_perfil_backend.md)).

La implementación cubre la totalidad de las 9 Historias de Usuario asignadas:
- **`HU-CUE-01`**: Registro particular con OTP numérico de 6 dígitos (15 min TTL) y verificación.
- **`HU-CUE-02`**: Autenticación federada mediante Google Identity con sugerencia de vinculación y obligatoriedad de contraseña propia.
- **`HU-CUE-03`**: Registro de clientes empresa B2B con validación de NIT único y estado en revisión.
- **`HU-CUE-04`**: Inicio de sesión con mitigación de fuerza bruta, integración con sesiones UUID en PostgreSQL y emisión de JWT portando claim `sid`.
- **`HU-CUE-05`**: Recuperación de contraseña resistente a enumeración e invalidación de sesiones previas (`cambio_contrasena`).
- **`HU-CUE-06`**: Perfil de usuario con actualización de contacto, solicitud de cambio de correo con confirmación a la dirección activa y trámite de ascenso a empresa.
- **`HU-CUE-07`**: Gestión completa de direcciones de entrega con designación de predeterminada y geolocalización.
- **`HU-CUE-08`**: Garantía de unicidad de cuentas (`lower(correo)`) transversal.
- **`HU-CUE-09`**: Bandeja administrativa para dictamen de empresas y aprobación de NIT con trazabilidad y notificaciones transaccionales.

### Fortalezas Destacadas
1. **Aislamiento y Pureza de Capas:**  
   Cumplimiento riguroso de la Directiva 10: La carpeta `interfaces/` contiene contratos estáticos puros (`0 runtime`, sin esquemas ejecutables de Zod y sin datos hardcodeados). Todos los esquemas Zod se encuentran aislados en `dtos/`.
2. **Integración con Políticas Transversales:**  
   Consumo adecuado de `serviciosSeguridad.credenciales` para BCrypt costo 12 (`HU-SEG-01`), `serviciosSeguridad.sesion` para control de sesiones activas en PostgreSQL (`HU-SEG-02`), guardas en servidor (`HU-ADM-03`) y `servicioNotificaciones.procesarEvento` (`M18`) para SMTP desacoplado.
3. **Mínima Exposición de Datos (`HU-SEG-06`):**  
   Sanitización uniforme de objetos de usuario en todas las salidas HTTP; jamás se exponen hashes de contraseña, sales ni datos confidenciales. Respuestas uniformes ante usuarios no registrados o inactivos para prevenir ataques de enumeración.

---

## 🔍 2. Hallazgos y Análisis Técnico

Durante la auditoría del Líder Técnico se identificaron hallazgos de tipado, concurrencia y modelo de datos, procediendo a subsanar de forma inmediata los problemas a nivel de código:

### ⚠️ Hallazgo #1: Invocación de Tipos Laxos (`any`) y Falla de Linter Estricto
- **Archivos Afectados:**
  - `backend/src/modules/m04-cuentas/controllers/cuentas.controller.ts`
  - `backend/src/modules/m04-cuentas/controllers/empresa-admin.controller.ts`
  - `backend/src/modules/m04-cuentas/controllers/perfil.controller.ts`
  - `backend/src/modules/m04-cuentas/services/auth.service.ts`
  - `backend/src/modules/m04-cuentas/services/cuentas.service.ts`
  - `backend/src/modules/m04-cuentas/__tests__/m04.test.ts`
- **Descripción Técnica:**  
  La ejecución de `npm run lint` arrojó 13 errores `@typescript-eslint/no-explicit-any`. En los controladores se utilizaban casteos innecesarios `(req.user as any)?.id` y `(req.user as any)?.sid`, obviando que `req.user` ya se encuentra tipado fuertemente como `AuthenticatedUser` en `src/core/types/api.types.ts`. Asimismo, en `cuentas.service.ts` y `auth.service.ts` el método `sanitizarUsuario` aceptaba propiedades con tipo `any`.
- **Impacto:** Rompía el gate de calidad de ESLint y degradaba la seguridad de tipos en tiempo de compilación.
- **Acción Aplicada por el Tech Lead:**  
  Se tiparon adecuadamente `req.user?.id` y `req.user?.sid`, se emplearon los ENUMs nativos `EnumEstadoUsuario` y `EnumTipoUsuario`, y se refactorizaron los mocks de la suite de pruebas a contratos tipados (`Usuario`, `NewUsuario`, `UsuarioUpdate`). Resultado: `npm run lint` pasa con **0 errores y 0 advertencias**.

---

### ⚠️ Hallazgo #2: Falta de Transaccionalidad Atómica en Asignación de Roles (`usuario_rol` y `usuario`)
- **Archivos Afectados:**
  - `backend/src/modules/m04-cuentas/repositories/cuentas.repository.ts`
- **Descripción Técnica:**  
  El método `asignarRolUsuario` ejecutaba de manera secuencial un upsert sobre `usuario_rol` y un update sobre la tabla `usuario` sin estar encapsulados en una transacción Kysely (`this.db.transaction().execute`).
- **Impacto:** Si la segunda sentencia fallaba por caída de conexión o restricción, la tabla `usuario` quedaba desincronizada con respecto a `usuario_rol`, rompiendo la integridad del control de acceso.
- **Acción Aplicada por el Tech Lead:**  
  Se envolvió la operación completa dentro de `await this.db.transaction().execute(async (trx) => { ... })`, garantizando atomicidad ACID absoluta.

---

### ⚠️ Hallazgo #3: Protección Inviolable del Administrador Raíz ID=1 (`RF-ADM-01-14`, `RF-ADM-02-10`)
- **Archivos Afectados:**
  - `backend/src/modules/m04-cuentas/services/empresa-admin.service.ts`
- **Descripción Técnica:**  
  En el flujo de dictamen administrativo de solicitudes empresa (`dictaminarSolicitudEmpresa`), al aprobarse una solicitud no se verificaba si el `id_usuario` correspondía al SuperAdmin raíz (`id_usuario = 1`). En tal caso, la línea 86 asignaba `id_rol: 3` (`empresa_vip`), lo que degradaría los privilegios del administrador principal de Pintu Clic.
- **Impacto:** Vulnerabilidad de escalado/degradación de privilegios sobre la identidad raíz del sistema.
- **Acción Aplicada por el Tech Lead:**  
  Se incorporó una cláusula de protección explícita que bloquea con `HTTP 403 (ROOT_ADMIN_PROTECTED)` cualquier intento de dictaminar a cuenta empresa al usuario ID=1.

---

### ⚠️ Hallazgo #4 (Observación de Arquitectura y Base de Datos): Almacén en Memoria (`Map`) para Direcciones, Solicitudes Empresa y Vínculos Google
- **Archivos Afectados:**
  - `backend/src/modules/m04-cuentas/repositories/direccion.repository.ts`
  - `backend/src/modules/m04-cuentas/repositories/empresa.repository.ts`
  - `backend/src/modules/m04-cuentas/repositories/verificacion.repository.ts`
  - `backend/src/modules/m04-cuentas/services/auth.service.ts` (`vinculacionesGoogle`)
- **Descripción Técnica:**  
  El esquema oficial actual de PostgreSQL (`bd/sql/schema_pintuclic.sql` v2.3, 31 tablas) no contiene tablas dedicadas para `direccion_cliente`, `solicitud_empresa`, `solicitud_actualizacion_nit` ni identificadores federados OAuth. El desarrollador, en apego estricto a las **Directivas 1 y 2** (no modificar el DDL global sin autorización), implementó repositorios modulares respaldados por `Map`s en memoria con contratos tipados completos.
- **Impacto en Producción:**  
  Aunque funcional para el desarrollo local y suites de prueba, un reinicio del servidor o un despliegue multi-instancia ocasionará la pérdida de direcciones de entrega, solicitudes corporativas y vinculaciones de Google.
- **Hoja de Ruta Arquitectónica para el Equipo de Base de Datos:**  
  En la siguiente versión del DDL (`v2.4`), se deben estructurar las tablas:
  1. `direccion_cliente` (vinculada a `usuario` con flag `es_predeterminada`).
  2. `solicitud_empresa` y `solicitud_actualizacion_nit` (con auditoría del revisor).
  3. Columna `google_id` o tabla `usuario_identidad_externa`.
  4. Migrar los códigos efímeros OTP de `verificacion.repository.ts` hacia Redis con TTL nativo o tabla temporal PostgreSQL.

---

## 🛡️ 3. Matriz de Verificación de Calidad

| Validación | Comando / Criterio | Resultado |
| :--- | :--- | :---: |
| Compilación TypeScript | `npx tsc --noEmit` | ✅ Código 0 (Limpio, sin errores de tipos) |
| Linter Estricto | `npm run lint` | ✅ Código 0 (0 errores, 0 advertencias tras refactorización) |
| Integridad con Esquema BD | `bd/sql/schema_pintuclic.sql` | ✅ Alineado con las 31 tablas (usuario, usuario_rol, rol, sesion) |
| Origen de Datos (Sin Auto-Siembra) | `bd/sql/seed_pintuclic.sql` | ✅ Respeta Directiva 10 (Cero auto-inserts al arrancar el servidor) |
| Políticas de Seguridad | `HU-SEG-01`, `HU-SEG-06`, `HU-ADM-03`, `HU-CUE-08` | ✅ Cumple al 100% |
| Suite de Pruebas Automatizadas | `npx tsx src/modules/m04-cuentas/__tests__/m04.test.ts` | ✅ 30/30 superadas (0 fallidas) |
| Nomenclatura de Walkthrough | Sufijo `_[backend|frontend].md` | ✅ Cumple (`walkthrough_v1.9.0_M04_cuentas_auth_perfil_backend.md`) |

---

## 🏁 4. Dictamen del Líder Técnico

**DICTAMEN FINAL: ✅ APROBADO CON OBSERVACIONES Y REFACTORIZACIÓN APLICADA**

1. **Estado del Código:**  
   El módulo **M04 (Cuentas, Autenticación y Perfil - Backend)** ha sido saneado de tipos laxos (`any`), cuenta con transaccionalidad atómica en la manipulación de roles, protege la identidad del Administrador raíz ID=1 y cumple al 100% los criterios de aceptación funcionales de las 9 historias de usuario.
2. **Autorización:**  
   Se aprueba la incorporación de la versión `v1.9.0` en la rama de desarrollo y se da por completada la capa de backend de cuentas.
3. **Paso Siguiente:**  
   Proceder con el desarrollo de la interfaz de usuario en frontend (`frontend/src/modules/m04-cuentas/`) consumiendo los endpoints estandarizados en este módulo y aplicando la paleta oficial del Design System Pintuclic.
