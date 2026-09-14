# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **Archivo:** `docs/walkthroughs/M05/walkthrough_v3.29.0_M05_carrito_backend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.29.0`
* **Tipo de Incremento:** `MINOR` — implementación completa de nuevas HUs en un módulo nuevo (`M05`).
* **Módulo de Origen:** `M05 — Carrito de Compras`
* **Fecha de Entrega:** `14/09/2026`
* **Autor / Responsable:** `Agente de IA (Antigravity)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAR-01** | Carrito persistente para visitante anónimo | **100% Cumplida** | `GET /api/v1/carrito/visitante/:token` · `POST /api/v1/carrito/visitante/:token/items` · `PATCH /api/v1/carrito/visitante/:token/items/:id_variante` · `DELETE /api/v1/carrito/visitante/:token/items/:id_variante` |
| **HU-CAR-02** | Gestión de ítems del carrito (acumulación y límites) | **100% Cumplida** | Lógica interna del servicio: acumulación de cantidades, eliminación al llegar a 0, límite máximo de 999 unidades por variante |
| **HU-CAR-04** | Fusión del carrito visitante al autenticarse | **100% Cumplida** | `POST /api/v1/carrito/cliente/fusionar` |
| **HU-CAR-05** | Revalidación de stock y precios antes del checkout | **100% Cumplida** | `GET /api/v1/carrito/cliente/revalidar` |

### Descripción del Alcance de la Versión

Se implementó la capa completa de backend para el módulo `M05 — Carrito de Compras`, cubriendo la experiencia de carrito tanto para visitantes anónimos (identificados por `token_visitante` UUID) como para clientes autenticados (identificados por `id_usuario` extraído del JWT de M20). La implementación incluye la arquitectura completa en capas: interfaces de dominio, DTOs de validación Zod v4, repositorios Kysely tipados, servicio de negocio con lógica de acumulación y fusión inteligente, controlador HTTP y enrutador Express con protección de sesión de M20.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo

- **Carrito único por identidad:** Existe como máximo un carrito activo por `token_visitante` (visitante) o por `id_usuario` (cliente). Si ya existe, se retorna el existente en lugar de crear uno duplicado.
- **Acumulación de cantidades (no duplicación de líneas):** Al agregar una variante que ya existe en el carrito, la cantidad se acumula (suma), sin crear una línea nueva duplicada.
- **Eliminación implícita por cantidad cero:** Al actualizar una línea con `cantidad: 0`, el servicio interpreta la operación como una eliminación de esa línea del carrito.
- **Límite máximo de 999 unidades por variante:** El DTO valida que la cantidad nunca supere 999, y el servicio verifica que la acumulación no exceda este límite.
- **Fusión inteligente al autenticarse (HU-CAR-04):** Se recuperan las líneas del carrito del visitante; por cada una se intenta sumar al carrito del cliente (respetando el límite de 999). Después de la transferencia, el carrito del visitante se elimina para evitar duplicidades.
- **Revalidación de stock y precio real (HU-CAR-05):** Antes del checkout, cada línea es revisada contra el stock real y el precio vigente de la variante. El servicio devuelve un `boolean` de validez y, para líneas con problema, el detalle del conflicto (stock insuficiente, variante inactiva, cambio de precio).

### B. Políticas Transversales Validadas

- 🔒 **M20 - Sesiones y Tokens (`HU-SEG-02`):** Las rutas de carrito del cliente autenticado están protegidas por `guardas.sesionVigente()` de `m20-seguridad`. El `id_usuario` se extrae exclusivamente de `res.locals.usuario` (establecido por el middleware JWT de M20), nunca de `req.body` ni `req.query`.
- 🛡️ **M20 - Autorización en Servidor (`HU-SEG-03`):** Toda operación sobre el carrito del cliente valida identidad en el backend; el frontend nunca envía el `id_usuario` directamente.
- 👁️ **M20 - Mínima Exposición (`HU-SEG-06`):** Las respuestas JSON del carrito nunca exponen contraseñas, hashes ni datos sensibles internos de otras tablas.
- 📦 **M05 - Integridad de Datos:** Prohibición total de datos hardcodeados en el módulo. Todos los datos operan sobre PostgreSQL vía Kysely.

---

## 4. CRITERIOS DE ACEPTACIÓN CUMPLIDOS (MATRIZ DE VERIFICACIÓN)

| # | Criterio de Aceptación (Gherkin) | Resultado |
| :---: | :--- | :---: |
| CA-01 | **Dado** un token de visitante nuevo, **Cuando** se solicita el carrito, **Entonces** se crea automáticamente un carrito vacío y se retorna con sus líneas (vacías). | ✅ Superado |
| CA-02 | **Dado** un carrito existente, **Cuando** se agrega una variante nueva, **Entonces** se crea una línea y se retorna el carrito actualizado. | ✅ Superado |
| CA-03 | **Dado** un carrito con una variante ya existente, **Cuando** se agrega la misma variante, **Entonces** la cantidad se acumula (no se crea una línea duplicada). | ✅ Superado |
| CA-04 | **Dado** una línea en el carrito, **Cuando** se actualiza con `cantidad: 0`, **Entonces** la línea es eliminada. | ✅ Superado |
| CA-05 | **Dado** una línea en el carrito, **Cuando** se actualiza con una cantidad válida (1–999), **Entonces** la cantidad queda registrada correctamente. | ✅ Superado |
| CA-06 | **Dado** una línea en el carrito, **Cuando** se elimina explícitamente, **Entonces** desaparece del carrito y no afecta otras líneas. | ✅ Superado |
| CA-07 | **Dado** un cliente autenticado con un `token_visitante`, **Cuando** solicita la fusión, **Entonces** las líneas del visitante se transfieren al carrito del cliente, respetando acumulación y el límite de 999. | ✅ Superado |
| CA-08 | **Dado** un carrito de cliente para revalidar, **Cuando** todas las líneas tienen stock suficiente y precio sin cambios, **Entonces** `esValido: true` y sin alertas. | ✅ Superado |
| CA-09 | **Dado** un carrito de cliente para revalidar, **Cuando** alguna línea tiene stock insuficiente o variante inactiva, **Entonces** `esValido: false` con detalle de la línea problemática. | ✅ Superado |

**Suite de pruebas unitarias:** `backend/src/modules/m05-carritodecompras/__tests__/m05.test.ts`
- **Resultado:** 21/21 pruebas superadas ✅

**TypeScript:** `npx tsc --noEmit` → **0 errores ✅**

**ESLint:** `npm run lint` → **0 errores, 0 advertencias ✅**

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS

### ¿Qué necesita este código para operar al 100% en producción?

1. **Módulo M20 - Seguridad (`m20-seguridad`):** El enrutador importa `guardas.sesionVigente()` de `../m20-seguridad/seguridad.routes`. M20 debe estar operativo y sus middlewares JWT activos para proteger las rutas del carrito del cliente autenticado.
2. **Registro del router en el archivo central de rutas del backend:** El router de M05 (`m05.routes.ts`) debe montarse en el enrutador central del backend para que los endpoints queden expuestos. **Este paso no fue ejecutado por aislamiento de módulo** (requiere modificar un archivo fuera de `m05-carritodecompras/`) — se reporta como dependencia pendiente al equipo. La línea a agregar es:
   ```typescript
   // En el archivo central de rutas del backend:
   import carritoRoutes from '../modules/m05-carritodecompras/m05.routes';
   app.use('/api/v1/carrito', carritoRoutes);
   ```
3. **Base de datos PostgreSQL con tablas `carrito` y `linea_carrito`:** Las tablas deben existir en la base de datos (creadas mediante el script SQL y `npm run db:seed`) y estar registradas en `backend/src/core/db/types.ts` (ya lo están, validado previamente).
4. **Variables de entorno:** Conexión a PostgreSQL configurada con las variables estándar del proyecto (sin cambios requeridos específicos de M05).

### ¿A qué módulos habilita?

- **M07 — Checkout:** El carrito validado (`revalidar`) es el input directo del proceso de pago. M07 puede asumir que al llamar al endpoint de revalidación, el carrito está limpio y verificado con precios y stock actualizados.
- **M08 — Órdenes:** Una vez M07 confirma el pago, M08 puede consumir las líneas del carrito para crear la orden y posteriormente vaciar el carrito del cliente.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS / CREADOS

> ✅ **Confirmación de Aislamiento:** Todos los archivos listados pertenecen exclusivamente a `backend/src/modules/m05-carritodecompras/`. No se modificó ningún archivo de otro módulo ni archivo compartido.

| Estado | Archivo |
| :---: | :--- |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/interfaces/m05.interfaces.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/dtos/agregar-item.dto.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/dtos/actualizar-item.dto.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/dtos/fusionar-carrito.dto.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/dtos/index.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/repositories/carrito.repository.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/repositories/linea-carrito.repository.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/services/carrito.service.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/controllers/carrito.controller.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/m05.routes.ts` |
| ✅ CREADO | `backend/src/modules/m05-carritodecompras/__tests__/m05.test.ts` |

**Total:** 11 archivos nuevos · 0 archivos modificados de otros módulos · 0 archivos eliminados.

---

> ⚠️ **Nota de Dependencia Pendiente (Protocolo de Parada — AGENTS.md §3):**
> El montaje del router `m05.routes.ts` en el archivo central de enrutamiento del backend requiere modificar un archivo **fuera del módulo asignado**. Conforme al protocolo de parada e informe de inconsistencias, este cambio no fue ejecutado y se reporta al equipo para su aprobación y ejecución por parte del desarrollador responsable del archivo central de rutas.
