# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.7.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `08/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (alcance aprobado por el PO, ver sección 2 y 5)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-05** | Gestión de colores | **Parcial — registro por marca + CIELAB** | `POST/GET/PATCH /api/catalogo/colores` (+`/desactivar`, `/reactivar`), `GET /api/catalogo/marcas/:idMarca/colores?q=` |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-CAT-05-01 — CRUD + búsqueda + cambio de estado de colores por marca | ✅ Implementado |
| RF-CAT-05-02 — valor CIELAB obligatorio + muestra visual derivada sin imagen | ✅ Implementado |
| RF-CAT-05-03 — familias cromáticas administrables + derivación + carga masiva | ❌ Excluido en esta versión por decisión del PO |
| RF-CAT-05-04/05/06 — uso del color en carta/variantes de producto | ⏸️ Diferido — requiere producto (HU-CAT-02) y variante (HU-CAT-03) |
| RF-CAT-05-20 — origen del valor CIELAB (fabricante/SAMIT/medición) | ⏸️ Pendiente de negocio — no bloquea: el valor se exige como entrada |
| RF-CAT-12-04 — asociación color↔base (flujo 3 de HU-CAT-12) | ⏸️ Diferido — depende de esta HU **y** de RF-CAT-12-12 (sin definir) |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-05-01:** nombre comercial obligatorio, código opcional, marca obligatoria y existente; nombre único dentro de la misma marca (se admite el mismo nombre entre marcas distintas — CA-CAT-05-01). Búsqueda por nombre o código dentro de la marca (CA-CAT-05-05).
- **RF-CAT-05-02:** valor CIELAB (`L*`, `a*`, `b*`) obligatorio y validado por rango (`L*∈[0,100]`, `a*,b*∈[-128,128]`) tanto en Zod como con `CHECK` en la BD. La muestra visual (`muestra_hex`, sRGB) se **calcula** a partir del CIELAB (algoritmo LAB→XYZ→sRGB D65), sin requerir imagen (CA-CAT-05-04).
- **RF-CAT-09-04:** no se puede reactivar un color cuya marca siga inactiva.

### B. Extensión de la Cascada de HU-CAT-04 (Marca)
`MarcasService.desactivar` ahora también desactiva los colores de la marca (RF-CAT-04-03), sumándose a la cascada ya existente sobre líneas y bases. Se inyectó `ColoresRepository` en `MarcasService`.

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** rutas protegidas por `catalogo.ver` / `catalogo.crear` / `catalogo.editar` / `catalogo.eliminar` vía `guardas.protegido(...)` de M20.
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-05-01** | Color registrado con nombre y marca queda disponible; mismo nombre en otra marca se admite; duplicado en la misma marca se rechaza. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-05-02** | Color sin marca se rechaza; color sin código se permite. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-05-04** | Color sin imagen se registra y genera su muestra desde el CIELAB. | `m01.test.ts` (muestra derivada) | ✅ **CUMPLIDO** |
| **CA-CAT-05-05** | Filtrado de colores (búsqueda por nombre/código). | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-05-03** | Agrupación/filtrado por familia cromática. | Familias excluidas por el PO (RF-CAT-05-03) | ❌ **NO APLICA (excluido)** |
| **CA-CAT-05-06** | Carga masiva de miles de colores. | Excluido con las familias | ❌ **NO APLICA (excluido)** |
| **CA-CAT-05-07 a 05-10** | Uso del color en carta/variantes de producto. | Diferido a HU-CAT-02/03 | ⏸️ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Esquema de Base de Datos:** requiere `bd/sql/schema_pintuclic.sql` v3.0 (tabla `color` enriquecida).
- **Marca (HU-CAT-04):** todo color pertenece a una marca existente.

### B. Dependencias Hacia Adelante
- **HU-CAT-02/03 (Productos/Variantes):** consumirán `color` para la carta de entonables y las variantes de colores fijos (RF-CAT-05-04/05/06), y aplicarán la cascada RF-CAT-05-05 sobre variantes al desactivar un color.
- **HU-CAT-12 (flujo 3):** la asociación color↔base (RF-CAT-12-04) podrá construirse una vez el negocio resuelva RF-CAT-12-12 (quién determina la base de un color).

### ⚠️ Limitaciones Conocidas y Aprobadas por el Product Owner
1. **Sin familias cromáticas:** RF-CAT-05-03 (familias administrables, derivación y carga masiva) se excluyó por decisión explícita del PO en esta conversación.
2. **Sin uso en producto:** los flujos que ligan el color a carta/variantes no se implementaron por falta de las entidades de las que dependen (HU-CAT-02/03).
3. **Validación contra PostgreSQL real pendiente:** la tabla `color` cambió de forma (nuevas columnas y nueva unicidad). Como el DDL usa `CREATE TABLE IF NOT EXISTS`, sobre una BD ya creada **no** se recrea automáticamente; requiere un reset de esquema (destructivo) para verificar el DDL/seed nuevos contra PostgreSQL.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.0: tabla `color` con `id_marca`, `codigo`, `cie_l/cie_a/cie_b`, `estado`, `UNIQUE(id_marca, nombre)` y CHECKs de rango CIELAB. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | Colores de siembra con marca + código + valor CIELAB. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `ColorTable` ampliada + helpers (`Color`, `NewColor`, `ColorUpdate`). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/colores.dto.ts` | Esquemas Zod: crear y actualizar color (CIELAB obligatorio y validado). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/colores.repository.ts` | Acceso Kysely a `color`, con búsqueda y `desactivarColoresDeMarca`. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/colores.service.ts` | Reglas de negocio + derivación `cielabAHex` (muestra sRGB). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/colores.controller.ts` | Controlador HTTP de colores (incluye búsqueda `?q=`). |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | Nuevo contrato `ColorDetalle`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/marcas.service.ts` | Cascada de desactivación de marca ahora alcanza `color` (RF-CAT-04-03). |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección de `Colores*` y rutas `/colores`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +14 pruebas de HU-CAT-05 y de la cascada de marca→color (57/57 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.7.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 57/57 pruebas en memoria)
* **Validación contra PostgreSQL real:** `⚠️ Pendiente de reset de esquema (destructivo)`
* **Apego al Alcance Aprobado:** `✅ RF-CAT-05-01/02; RF-CAT-05-03 excluido por el PO; resto diferido por dependencias`
