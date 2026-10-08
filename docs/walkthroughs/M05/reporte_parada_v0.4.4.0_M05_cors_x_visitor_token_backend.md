# REPORTE DE PARADA — MODIFICACIÓN DE ARCHIVO DEL CORE (CORS)

> Protocolo de Parada Obligatoria (`AGENTS.md` directiva 3 y `ARQUITECTURA_BACKEND.md` §3). Este reporte documenta por qué la entrega del backend de M05 necesita cambiar un archivo compartido del core, qué cambio se propone y quién lo aprobó.

## 1. METADATOS

* **Versión asociada:** `v0.4.4.0` (integración del backend de M05)
* **Módulo solicitante:** `M05 - Carrito de compras`
* **Archivo afectado (fuera del módulo):** `backend/src/core/middlewares/cors.middleware.ts`
* **Rama:** `feature/m05-integracion-backend`
* **Fecha:** `02/10/2026`
* **Responsable:** Ibsen Alexis Soto Artunduaga (líder de M05/M08), con apoyo de Agente de IA (backend)
* **Estado:** `✅ APROBADO Y APLICADO`

---

## 2. INCONSISTENCIA DETECTADA

El carrito de visitante (HU-CAR-01) identifica el dispositivo con un token opaco que viaja en el header personalizado `x-visitor-token` (ADR-01, RNF-CAR-01-01). Lo usan las cuatro rutas `/api/carrito/visitante*`, y el frontend de M05 ya en `develop` lo envía (`frontend/src/modules/m05-carrito-compras/services/cart.service.ts`).

La configuración global de CORS solo admite `Content-Type`, `Authorization` y `X-Requested-With`. Cuando el frontend y la API están en orígenes distintos, el navegador manda primero un *preflight* (`OPTIONS`) y bloquea la petición real porque el servidor no autoriza ese header.

### Evidencia (backend de esta rama, PostgreSQL de prueba)

```text
$ curl -i -X OPTIONS http://127.0.0.1:3999/api/carrito/visitante \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: x-visitor-token"
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With   ← falta X-Visitor-Token
```

La misma petición sin preflight (`curl` directo con el header) responde `200` con el carrito: el problema es exclusivamente de CORS.

### Alcance del impacto

| Entorno | ¿Mismo origen? | ¿Se bloquea el carrito de visitante? |
| :--- | :--- | :--- |
| Docker / producción (`nginx` sirve `/api` y `VITE_API_URL=/api`) | Sí | No: no hay preflight |
| Desarrollo local (`vite` en `:5173` → API en `:3000`, sin proxy en `vite.config`) | No | **Sí: las 4 rutas de visitante fallan en el navegador** |
| Cualquier despliegue futuro con API en otro dominio | No | **Sí** |

---

## 3. CAMBIO PROPUESTO

Aditivo, de una sola línea funcional. No quita ni reordena ningún header, origen ni método existente.

```diff
--- a/backend/src/core/middlewares/cors.middleware.ts
+++ b/backend/src/core/middlewares/cors.middleware.ts
@@ -14,7 +14,8 @@
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
-  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
+  // X-Visitor-Token: token opaco del carrito de visitante de M05 (ADR-01, RNF-CAR-01-01).
+  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Visitor-Token'],
   credentials: true,
```

### Alternativas descartadas

| Alternativa | Por qué se descarta |
| :--- | :--- |
| Enviar el token en el body o en la URL | Cambia el contrato ya consumido por el frontend de M05 y expone el token en logs de acceso (URL). |
| Proxy en `vite.config` del frontend | Toca otro archivo compartido, solo arregla el desarrollo local y deja abierto cualquier despliegue en otro origen. |
| Configurar CORS dentro del router de M05 | Duplica la política global (RNF-SEG-03-01 pide controles centralizados) y el preflight lo responde el middleware global antes de llegar al módulo. |

---

## 4. ANÁLISIS DE SEGURIDAD

- **No amplía orígenes:** la lista `ALLOWED_ORIGINS` y la función `origin` no cambian; solo los orígenes ya autorizados pueden enviar el header.
- **No es una credencial:** el token de visitante no autentica a ninguna cuenta ni da acceso a datos personales (RNF-CAR-01-01). Las rutas de cliente siguen exigiendo `Authorization` y la guarda `sesionVigente()` de M20.
- **Validación en servidor:** desde esta misma entrega el backend valida el header como UUID con Zod (`fix(M05): validar el token de visitante como UUID con Zod`), así que habilitarlo en CORS no abre una entrada sin validar.
- **Políticas de cierre:** HU-ADM-03 (control en servidor) y HU-SEG-06 (mínima exposición) no se ven afectadas.

---

## 5. VERIFICACIÓN POSTERIOR AL CAMBIO

Backend de la rama en el puerto `3999`, contra PostgreSQL de prueba (schema y seed de `bd/sql/`).

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| El preflight autoriza `x-visitor-token` | `OPTIONS /api/carrito/visitante`, `Origin: http://localhost:5173`, `Access-Control-Request-Headers: x-visitor-token` → `204`, `Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,X-Visitor-Token` | ✅ **CUMPLIDO** |
| Los demás headers siguen autorizados | Mismo preflight con `authorization, content-type` → `204` y la misma lista | ✅ **CUMPLIDO** |
| Un origen no permitido sigue bloqueado | Preflight con `Origin: http://evil.example` → sin `Access-Control-Allow-Origin`; mensaje genérico sin detalles internos | ✅ **CUMPLIDO** (ver hallazgo) |
| Compilación y lint | `npx tsc --noEmit` → 0 errores · `npm run lint -- --max-warnings=0` → 0 errores, 0 advertencias | ✅ **CUMPLIDO** |
| Pruebas de M05 | `m05.test.ts` 72/72 · `m05.integracion-escritura.test.ts` 19/19 | ✅ **CUMPLIDO** |

> **Hallazgo previo, fuera de alcance (no se corrige aquí):** un origen no permitido responde `500 INTERNAL_SERVER_ERROR` en lugar de `403`, porque la función `origin` hace `callback(new Error(...))` y `errorHandler` lo trata como error no controlado. El comportamiento es idéntico en `develop` (la función `origin` no se modificó). El bloqueo se cumple y el mensaje es genérico (HU-SEG-06), pero cada intento queda en el log como `[CORE][ERROR_NO_CONTROLADO]`. Se sugiere al dueño del core responder `403` en un PR aparte.

---

## 6. APROBACIÓN

| Rol | Nombre | Decisión | Fecha |
| :--- | :--- | :--- | :--- |
| Líder de M05/M08 | Ibsen Alexis Soto Artunduaga | ✅ Aprobado | 02/10/2026 |
| Líder técnico (dueño del core) | — | _a confirmar en la revisión del PR_ | — |
