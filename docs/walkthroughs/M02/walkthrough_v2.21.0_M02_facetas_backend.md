# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.21.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M02 - Búsqueda y navegación`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ NÚCLEO COMPLETO` (conteo disyuntivo y color entonable diferidos)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-BUS-02** | Filtros del catálogo (facetas, RF-BUS-02-02) | **Cierre de RF-BUS-02-02** | `GET /api/busqueda/facetas` |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-BUS-02-02 — ofrecer en cada filtro únicamente los valores que producen resultados | ✅ Implementado (con conteo por dimensión) |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-BUS-02-02:** por cada dimensión (`categorias`, `subcategorias`, `marcas`, `lineas`, `resinas`, `colores`, `presentaciones`) se devuelven solo los valores presentes en el resultado actual, con `cantidad` de productos. Al derivarse de `GROUP BY`, nunca aparece un valor con 0 resultados.
- **Conteo conjuntivo:** se aplican todos los filtros vigentes (misma base que la búsqueda) antes de agregar; el conteo refleja lo que quedaría con la selección actual.
- **Producto, no variante:** las dimensiones que pasan por variantes o subcategorías usan `COUNT(DISTINCT producto)` para no inflar el conteo cuando un producto tiene varias variantes/subcategorías (coherente con RF-BUS-02-03).
- **Orden:** por `cantidad` desc con desempate estable por nombre.

### B. Decisión de Diseño
- **Mismo contrato de entrada que la búsqueda:** el endpoint de facetas acepta los mismos parámetros (término + filtros), de modo que el frontend recalcula facetas con el estado de filtros actual.
- **Armado de filtros compartido:** se extrajo `filtrosDesde(dto)` en el controlador, reutilizado por `buscar` y `facetas` (evita duplicar el mapeo query → dominio).
- **Público sin guardas:** mismo alcance anónimo que la búsqueda.

### C. Políticas Transversales Validadas
- 🔒 **M20 (HU-SEG-06):** solo lectura; sin datos sensibles.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

RF-BUS-02-02 es un requisito funcional sin CA Gherkin propio; se valida por su comportamiento:

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Solo valores con resultados (cantidad ≥ 1) | `GROUP BY` (SQL real) | ✅ **CUMPLIDO** |
| Conteo por producto distinto (no variante) | `COUNT(DISTINCT p.id_producto)` (SQL real: Galón 2) | ✅ **CUMPLIDO** |
| Respeta término y filtros vigentes | misma base filtrada + `m02.test.ts` | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M01 Catálogo:** `producto`, `marca`, `linea`, `tipo_resina`, `producto_subcategoria`, `subcategorias`, `categoria`, `variante`, `presentacion`, `color`.
- **HU-BUS-01/02:** la base filtrada sobre la que se agregan las facetas.

### B. Dependencias Hacia Adelante
- **Frontend:** consume `GET /api/busqueda/facetas` para pintar el panel de filtros con valores disponibles y contadores.

### ⚠️ Limitaciones Conocidas
1. **Conteo conjuntivo, no disyuntivo:** una dimensión con filtro activo se cuenta a sí misma; el estándar de e-commerce (disyuntivo) requiere excluir el propio filtro por dimensión — pendiente como mejora.
2. **Color solo preparados:** la faceta de color cuenta productos con variante de ese color; los entonables (carta de la marca) no se expanden en el conteo.
3. **Familia cromática:** sin dato (diferida en HU-CAT-05).
4. **Rendimiento:** 7 agregaciones por petición; con catálogos grandes conviene un índice GIN de trigramas (para el término) y evaluar materialización/caché de facetas.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/interfaces/m02.interfaces.ts` | `FacetaValor`, `FacetasBusqueda`. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/repositories/busqueda.repository.ts` | Método `facetas` (7 agregaciones) + `ordenarFaceta`. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/services/busqueda.service.ts` | Método `facetas`. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/controllers/busqueda.controller.ts` | Handler `facetas` + helper `filtrosDesde`. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/m02.routes.ts` | Ruta pública `/facetas`. |
| **[MODIFICADO]** | `backend/src/modules/m02-busqueda/__tests__/m02.test.ts` | +1 prueba de facetas (26/26 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.21.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 26/26 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (agregaciones de marca, presentación y subcategoría verificadas con `COUNT(DISTINCT)`)
* **Apego al Alcance:** `✅ RF-BUS-02-02 cubierto; conteo disyuntivo y color entonable diferidos. M02 backend con todas sus HU funcionales.`
