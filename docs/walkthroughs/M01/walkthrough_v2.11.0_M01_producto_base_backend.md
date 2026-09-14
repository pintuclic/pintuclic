# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.11.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ FLUJO 2 COMPLETO` (de los 4 flujos de HU-CAT-12)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-12** | Gestión de bases y entonado | **Flujo 2 completo** (asignar bases a un producto entonable) | `GET/POST/DELETE /api/catalogo/productos/:idProducto/bases` |

### Estado de los 4 flujos del diagrama

| Flujo | Estado |
| :--- | :---: |
| 1. Registrar/editar/desactivar base | ✅ v2.6.0 |
| 2. Asignar bases a un producto entonable (RF-CAT-12-02/03) | ✅ **esta versión** |
| 3. Asociar colores a las bases (RF-CAT-12-04) | ⏸️ Diferido — requiere la decisión de negocio RF-CAT-12-12 |
| 4. Retirar de la carta los colores de una base desactivada | ⏸️ Diferido — depende del flujo 3 |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-12-02:** un producto entonable declara qué bases ofrece, sin fijar en el código cuántas son. Solo los productos de clase `entonable` pueden ofrecer bases.
- **RF-CAT-12-03:** la base debe pertenecer a la marca del producto y estar activa. (El "tipo de resina" que menciona el RF no existe en el modelo —excluido por el PO en HU-CAT-12—, por lo que la comparación se limita a la marca.)
- **Integridad de retiro:** no se puede quitar una base declarada si hay variantes del producto que la usan.

### B. Acoplamiento con HU-CAT-03 (Variantes)
Se reforzó la validación de variantes: una variante de un producto entonable ahora exige que su base esté **declarada** en `producto_base` (antes solo se validaba que fuera de la marca). Es la lectura fiel de RF-CAT-12-02: la lista declarada es la fuente autorizada de bases del producto.

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** `catalogo.ver` (GET) y `catalogo.editar` (POST/DELETE) vía `guardas.protegido(...)` de M20.
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-12-01** | Base disponible para asociarla a productos entonables de esa marca. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-12-03** | Un producto no puede recibir una base de otra marca. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-12-04 a 12-08** | Entonado: color↔base y determinación de la base en la compra. | Flujo 3/entonado (RF-CAT-12-12 sin definir; depende de M08) | ⏸️ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Esquema de BD:** `bd/sql/schema_pintuclic.sql` v3.4 (tabla `producto_base`).
- **Producto entonable (HU-CAT-02), Base (HU-CAT-12 flujo 1):** ambos referenciados y validados.

### B. Dependencias Hacia Adelante
- **HU-CAT-05 / flujo 3 (color↔base):** la carta de colores por base se apoyará en las bases declaradas; requiere resolver RF-CAT-12-12 (quién determina la base de un color).
- **M08 (Órdenes) / entonado:** la determinación de la base consumida al comprar un color (RF-CAT-12-05) se integrará con la orden.

### ⚠️ Limitaciones Conocidas
1. **Flujo 3 y 4 diferidos:** la asociación color↔base y el retiro de colores por base desactivada dependen de la decisión de negocio RF-CAT-12-12, aún sin definir en la especificación.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.4: tabla `producto_base` + índice. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `ProductoBaseTable` + helpers + registro. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/producto-bases.dto.ts` | Esquema Zod para asignar una base. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/producto-bases.repository.ts` | Acceso Kysely a `producto_base` (asignar/quitar/listar/uso por variantes). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/producto-bases.service.ts` | Reglas de negocio del flujo 2. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/producto-bases.controller.ts` | Controlador HTTP. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/variantes.service.ts` | Acoplamiento: la base de una variante entonable debe estar declarada. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección y rutas de `producto_base`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +8 pruebas de flujo 2 y acoplamiento (102/102 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.11.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 102/102 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (reset de esquema + seed en `pintuclic-db`: `producto_base` con PK compuesta y FKs; 42 tablas)
* **Apego al Alcance:** `✅ HU-CAT-12 flujo 2 (RF-CAT-12-02/03); flujos 3 y 4 diferidos por RF-CAT-12-12`
