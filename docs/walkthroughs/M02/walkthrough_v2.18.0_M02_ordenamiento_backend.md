# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.18.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M02 - Búsqueda y navegación`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL POR DEPENDENCIAS` (precio real por M06 y novedad sin fecha)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-BUS-03** | Ordenamiento de resultados | **Núcleo completo** | `GET /api/busqueda/productos` (parámetro `orden`) |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-BUS-03-01 — cambiar entre relevancia, precio asc, precio desc y novedad; por defecto el criterio configurable | ✅ Implementado (default `relevancia`, fijo por ahora) |
| RF-BUS-03-02 — relevancia ponderada nombre>marca>línea>color>descripción; exacto sobre aproximado | ✅ Implementado (pesos 5/4/3/2/1 + bonus exacto) |
| RF-BUS-03-03 — desempate estable por nombre entre resultados de igual relevancia | ✅ Implementado (nombre asc como último criterio) |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-BUS-03-01:** parámetro `orden ∈ {relevancia, precio_asc, precio_desc, novedad}`. Ausente ⇒ `relevancia` (por defecto).
- **RF-BUS-03-02:** relevancia = `100·(exacto nombre) + 5·sim(nombre) + 4·sim(marca) + 3·sim(línea) + 2·sim(color) + 1·sim(descripción)`, con `sim = word_similarity` sobre texto normalizado (`unaccent` + `lower`). El bonus por coincidencia exacta del nombre garantiza el resultado exacto por encima del aproximado.
- **RF-BUS-03-03 / CA-BUS-03-03:** todos los criterios terminan en `nombre asc`, de modo que consultas idénticas devuelven el mismo orden entre páginas (determinismo).
- **CA-BUS-03-04:** los productos sin coincidencia obtienen relevancia 0 y no se elevan por patrocinio (garantizado desde HU-BUS-01: el patrocinio no inyecta resultados no coincidentes).
- **Precio del producto:** para `precio_asc`/`precio_desc` se usa el **mínimo de las variantes activas** (`min(variante.precio_vigente)`).

### B. Decisión de Diseño
- **Se extiende el endpoint** en lugar de crear uno nuevo: término, filtros, orden y paginación operan sobre la misma lista.
- **Ordenamiento inline en el repositorio** con expresiones `sql` para la relevancia ponderada y el precio mínimo; se evita anotar el tipo del builder para no romper la inferencia de Kysely.

### C. Políticas Transversales Validadas
- 🔒 **M20 (HU-SEG-06):** endpoint público de solo lectura; sin datos sensibles ni credenciales.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-BUS-03-01** | Selecciono criterio → reordena; avanzo página → sigue aplicado. | Endpoint sin estado + `orden` por query (`m02.test.ts`) | ✅ **CUMPLIDO** |
| **CA-BUS-03-02** | Sin criterio → orden por defecto configurado. | Default `relevancia` en el servicio (`m02.test.ts`) | ✅ **CUMPLIDO** |
| **CA-BUS-03-03** | Igual relevancia → orden no varía entre consultas idénticas. | Desempate estable `nombre asc` | ✅ **CUMPLIDO** |
| **CA-BUS-03-04** | Producto sin el término y marca patrocinada → no aparece. | Relevancia 0 no elevada por patrocinio (HU-BUS-01) | ✅ **CUMPLIDO** |
| **CA-BUS-03-05** | Empresa ordena por precio asc → según sus precios. | Precio por empresa = M06 | ⏸️ **PENDIENTE (M06)** |

> Nota de validación: la lógica del servicio (default y propagación del criterio) y del DTO (enum) se cubren con `m02.test.ts` (18/18). La relevancia ponderada y el precio mínimo se validaron contra PostgreSQL real (`vinil` → *Viniltex* encabezando con relevancia 6.667).

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M01 Catálogo:** `producto`, `marca`, `linea`, `variante`, `color` (para relevancia y precio).

### B. Dependencias Hacia Adelante
- **M06 Reglas y Descuentos:** habilitará el orden por precio sobre el **precio final tras descuentos + IVA** y por condiciones de empresa (CA-BUS-03-05).
- **Esquema (M01):** una fecha de alta en `producto` permitiría un orden por novedad exacto (hoy proxy por `id_producto`).

### ⚠️ Limitaciones Conocidas
1. **Precio base, no final** (`min(variante.precio_vigente)`): pendiente de M06.
2. **Novedad por proxy** (`id_producto desc`): `producto` no tiene fecha de alta.
3. **Default fijo** (`relevancia`): RF-BUS-03-01 lo llama "configurable"; pendiente de un módulo de configuración.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/interfaces/m02.interfaces.ts` | Nuevo tipo `OrdenBusqueda`. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/dtos/busqueda.dto.ts` | Parámetro `orden` (enum). |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/repositories/busqueda.repository.ts` | Switch de ordenamiento, relevancia ponderada y precio mínimo. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/services/busqueda.service.ts` | Default de criterio y propagación al repositorio. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/controllers/busqueda.controller.ts` | Pasa `orden` al servicio. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/__tests__/m02.test.ts` | +3 pruebas de HU-BUS-03 (18/18 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.18.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 18/18 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (relevancia ponderada y precio mínimo ejecutados sin errores; orden por relevancia verificado con `vinil` → *Viniltex*)
* **Apego al Alcance:** `✅ RF-BUS-03-01/02/03; precio real (M06) y novedad con fecha diferidos`
