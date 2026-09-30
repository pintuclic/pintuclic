# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.3.41.1`
* **Módulo de Origen:** `Core / Infraestructura (despliegue, CORS)`
* **Fecha de Entrega:** `30/09/2026`
* **Autor / Responsable:** `Agente de IA`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **N/A (fix de despliegue)** | Restauración de `ALLOWED_ORIGINS` para habilitar las peticiones del navegador (CORS) | **100% Cumplida** | `.github/workflows/deploy.yml`, `.env.example` |

### Descripción del Alcance de la Versión
Se restaura la variable `ALLOWED_ORIGINS` en el `.env` que genera el pipeline `Deploy`. El navegador envía la
cabecera `Origin` en las peticiones `POST` (login, registro, carrito, checkout), y el middleware CORS del backend
(`backend/src/core/middlewares/cors.middleware.ts:13`) rechaza cualquier origen fuera de la lista. Al no existir la
variable en producción, se aplicaba el default `localhost` y **toda** petición del navegador terminaba en 500. Con
el dominio real en la lista, las operaciones vuelven a responder correctamente.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas
- `ALLOWED_ORIGINS` se toma de una **Repository variable** (`vars.ALLOWED_ORIGINS`) y se escribe en el `.env`
  generado en cada despliegue.
- El pipeline valida que la variable no venga vacía y falla antes de levantar contenedores, evitando publicar una
  web con CORS roto.
- El valor de producción es `https://www.pintuclic.com,https://pintuclic.com` (apex y `www`).
- Las peticiones sin `Origin` (cURL, healthchecks internos) siguen permitidas por el middleware.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Control de Acceso:** se mantiene la política CORS restrictiva; no se usa `*`.
- 🧱 **Origen Único de Configuración:** el valor vive en GitHub Actions Variables y se documenta en
  `.env.example`; no se hardcodea en el código ni en `docker-compose.yml`.
- 🛡️ **Configuración de Producción:** la validación temprana evita desplegar con el default inseguro de
  `localhost`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-INF-01** | **Dado** el `.env` generado, **Cuando** se inspecciona, **Entonces** contiene `ALLOWED_ORIGINS` con el dominio real. | Prueba local del generador | ✅ **CUMPLIDO** |
| **CA-INF-02** | **Dado** que la Variable falta, **Cuando** corre el job, **Entonces** falla con mensaje claro. | Revisión del bloque de validación | ✅ **CUMPLIDO** |
| **CA-INF-03** | **Dado** el backend desplegado, **Cuando** se hace login con `Origin: https://www.pintuclic.com`, **Entonces** responde 200 (antes 500). | ⏳ PENDIENTE (validar tras el deploy) | ⏳ **PENDIENTE** |
| **CA-INF-04** | **Dado** el navegador, **Cuando** un usuario inicia sesión, **Entonces** no aparece "Ocurrió un error interno en el servidor". | ⏳ PENDIENTE (validar tras el deploy) | ⏳ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **GitHub Actions Variables:** `ALLOWED_ORIGINS` debe existir con los dominios de producción.
- **Dominio real:** si cambia el dominio público, hay que actualizar la Variable (sin tocar código).
- **DNS/Proxy:** el frontend y la API se sirven bajo el mismo dominio; aun así el navegador envía `Origin` en
  `POST`.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Todos los módulos con interacción del navegador (M01, M02, M04, M05, M08, M17, M20):** sin este fix, cualquier
  `POST` desde la web fallaba con 500; con él, login, carrito, checkout y administración quedan operativos.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** no se modificó código de `backend/src` ni `frontend/src`; el alcance es
> de infraestructura y documentación.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `.github/workflows/deploy.yml` | Mapeo, escritura y validación de `ALLOWED_ORIGINS` en el `.env` generado. |
| **[MODIFICADO]** | `.env.example` | Sección 5 con `ALLOWED_ORIGINS`. |
| **[MODIFICADO]** | `.github/version.txt` | Bump a `0.3.41.1`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada de la versión `v0.3.41.1`. |
| **[NUEVO]** | `docs/walkthroughs/core/walkthrough_v0.3.41.1_core_restauracion_allowed_origins.md` | Este documento. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `⏳ PENDIENTE` — validar en producción con login desde navegador tras el deploy.
* **Apego al Diagrama de Flujo:** `N/A — cambio de infraestructura, sin diagrama funcional asociado`
