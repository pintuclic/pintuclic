# 📋 Reporte de Revisión Técnica: M18 - Notificaciones y Comunicaciones Transaccionales

| Parámetro | Detalle |
| :--- | :--- |
| **Módulo Auditado:** | `M18 - Notificaciones y Comunicaciones Transaccionales (Backend)` |
| **Versión Entregada:** | `v1.8.0` |
| **Tipo de Revisión:** | Auditoría de Arquitectura, Principio SSOT, Contratos de Tipado y Resiliencia de Despacho |
| **Fecha:** | 2026-09-05 |
| **Dictamen Final:** | **✅ APROBADO TRAS REFACTORIZACIÓN ARQUITECTÓNICA DE SSOT** |

---

## 🎯 1. Resumen de la Evaluación

Se auditó la entrega de backend del módulo transversal **M18 (Notificaciones y Comunicaciones)** correspondiente a las historias de usuario `HU-NOT-01`, `HU-NOT-02`, `HU-NOT-03` y `HU-NOT-04` (Walkthrough oficial: `docs/walkthroughs/M18/walkthrough_v1.8.0_M18_notificaciones_backend.md`).

### Fortalezas de la Implementación Base
1. **Desacoplamiento y Resiliencia (`HU-NOT-01`):**  
   El motor de transporte SMTP implementa una política sólida de reintentos exponenciales ante caídas de red o fallos transitorios de entrega, alternando a modo de simulación seguro si las credenciales SMTP no están presentes en el entorno.
2. **Inviolabilidad de Variables Mandatorias (`HU-NOT-03`):**  
   El motor de plantillas rechaza activamente (`HTTP 422`) cualquier intento de modificar una plantilla de negocio si se eliminan variables obligatorias (por ejemplo, códigos de activación en `registro_cliente` o tokens de recuperación en `recuperacion_password`).
3. **Protección de Datos Sensibles en Bitácora (`HU-SEG-06`):**  
   Los errores de despacho y payloads registrados en `EnvioRepository` sanean tokens, passwords y credenciales antes de ser persistidos y expuestos en los endpoints de auditoría.

---

## 🔍 2. Hallazgos y Acciones Correctivas Aplicadas

Durante la revisión técnica del Líder Técnico, se identificó una deficiencia crítica de mantenibilidad y redundancia de código que fue subsanada inmediatamente:

### ⚠️ Hallazgo #1 (Crítico de Arquitectura): Ruptura de SSOT y Redundancia de Contratos

- **Archivos Auditados:**
  - `backend/src/modules/m18-notificaciones/interfaces/notificaciones.interfaces.ts`
  - `backend/src/modules/m18-notificaciones/dtos/envio.dto.ts`
  - `backend/src/modules/m18-notificaciones/services/notificaciones.service.ts`

- **Diagnóstico del Problema:**  
  El catálogo de los 10 eventos transaccionales (`REGISTRO_CLIENTE`, `CAMBIO_ESTADO_ORDEN`, etc.) y los 4 estados de la bitácora (`pendiente`, `enviado`, `reintentando`, `fallido`) estaban declarados manualmente e independientes en **tres archivos distintos**:
  1. Como *union types* manuales en `notificaciones.interfaces.ts`.
  2. Como arrays literales duplicados dentro de `z.enum([...])` en `envio.dto.ts`.
  3. Como un mapa exhaustivo re-instanciado en cada invocación en `notificaciones.service.ts`.

- **Riesgo Técnico Asociado:**  
  1. **Schema Drift y Desincronización Silenciosa:** Si un desarrollador agregaba un evento en las interfaces pero olvidaba el array de Zod, TypeScript compilaba limpio (`tsc --noEmit` sin errores), pero en runtime la API arrojaba error de validación `422 Unprocessable Entity` al recibir el nuevo evento.
  2. **Violación del Principio DRY:** Mantenimiento triplicado por cada evento nuevo en el dominio.
  3. **Sobrecarga en Runtime:** El diccionario de resolución de plantillas se instanciaba en el heap de Node.js en cada despacho de notificación.

- **Acción Correctiva Aplicada (Arquitectura SSOT):**
  1. **Tuplas Inmutables como Única Fuente de Verdad:** En `envio.dto.ts` se definieron y exportaron las tuplas `as const`:
     - `TIPOS_EVENTOS_NOTIFICACION` (10 eventos de negocio).
     - `ESTADOS_ENVIO_NOTIFICACION` (4 estados de ciclo de vida).
  2. **Esquemas Zod Parametrizados:** `DispararEventoSchema` y `FiltrosBitacoraSchema` ahora consumen directamente las tuplas SSOT (`z.enum(TIPOS_EVENTOS_NOTIFICACION)`).
  3. **Inferencia Estática Pura (Directiva 10):** En `notificaciones.interfaces.ts`, los tipos `TipoEventoNotificacion` y `EstadoEnvioNotificacion` se derivan automáticamente mediante `(typeof TIPOS_EVENTOS_NOTIFICACION)[number]`. Al utilizar `import type`, se garantiza **cero bytes en runtime** y cero datos estáticos en la capa de interfaces.
  4. **Optimización en Servicio:** Se convirtió el mapa de plantillas en una constante estática inmutable (`Readonly<Record<TipoEventoNotificacion, string>>`), garantizando verificación exhaustiva en tiempo de compilación: si se añade un evento en el DTO, TypeScript fuerza inmediatamente a asociar su plantilla correspondiente.

---

### ⚠️ Hallazgo #2: Dependencia de Transporte SMTP en Entorno Local

- **Archivos:** `backend/package.json`
- **Diagnóstico:**  
  La entrega incorporó `nodemailer` en `package.json`, pero los módulos no habían sido instalados en el árbol local (`node_modules`), lo que impedía la ejecución directa de la suite de pruebas unitarias/integración (`MODULE_NOT_FOUND`).
- **Acción Correctiva:**  
  Se ejecutó la sincronización con `npm install` y se ejecutaron las 22 pruebas de integración automatizadas.

---

## 🛡️ 3. Matriz de Verificación de Calidad

| Validación | Comando | Resultado |
| :--- | :--- | :---: |
| Compilación TypeScript Backend | `npx tsc --noEmit` | ✅ Código 0 (Limpio, 0 errores) |
| Linter Backend (ESLint) | `npm run lint` | ✅ Código 0 (0 warnings, 0 errors) |
| Suite de Pruebas de Integración M18 | `npx tsx src/modules/m18-notificaciones/__tests__/m18.test.ts` | ✅ 22/22 superadas (0 fallidas) |
| Compilación Frontend Fullstack | `npm run build` | ✅ Código 0 (Limpio) |

---

## 📌 4. Lineamientos de Integración para Otros Módulos

Con la refactorización a SSOT, los módulos que consumen notificaciones deben adherirse a los siguientes estándares:

1. **M04 (Cuentas y Perfil):** Al emitir `REGISTRO_CLIENTE` o `RECUPERACION_PASSWORD`, usar directamente `servicioNotificaciones.procesarEvento()` o el endpoint `POST /api/notificaciones/disparar` pasando los campos exigidos por las plantillas (`codigo`, `enlace_verificacion`).
2. **M08 (Órdenes) y M21 (Cotizaciones):** Utilizar preferentemente los métodos fachada fuertemente tipados (`notificarCambioEstadoOrden`, `notificarDemoraStock`, `notificarEventoCotizacion`) expuestos en `NotificacionesService`.
3. **Nuevos Eventos:** Para registrar un nuevo evento en el sistema, **solo se debe agregar el identificador en `TIPOS_EVENTOS_NOTIFICACION` (`envio.dto.ts`)**; el tipado de TypeScript se actualizará automáticamente en cascada en todo el backend.
