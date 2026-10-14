# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.0` (base de datos `v2.9`, esquema 4.1)
* **Módulo de Origen:** `M01 Catálogo de productos` y `M02 Búsqueda` (Backend + Base de datos)
* **Fecha de Entrega:** `14/10/2026`
* **Autor / Responsable:** `Ingri Julieth (@TU_USUARIO_GITHUB)`, con apoyo de un agente de IA (Claude Code)
* **Fuentes:** `Informe_M01_revision_backend_b19d552.pdf` (revisión del líder técnico) y `Pintu_Clic_Analisis_Requisitos_Tanda1` v9.0 (M01)
* **Base de código:** rama `feature/m01-backend-catalogo-publico` sincronizada con `develop` `eb22342`
* **Estado de la Implementación:** `✅ COMPLETO` (con los pendientes de la sección 6)

---

## 2. HALLAZGOS Y REQUISITOS CUBIERTOS

| Hallazgo / Requisito | Problema | Corrección |
| :--- | :--- | :--- |
| **M01-02** (RF-CAT-01-04, CA-CAT-01-05/06) | El aviso al desactivar categorías y subcategorías contaba productos no visibles | `contarProductosAfectados` usa la regla única `dejaDeVerse`: producto elegible hoy, clasificado en lo que se retira y sin otra subcategoría activa bajo una categoría activa |
| **M01-06** (RF-CAT-11-03) | El comentario del conteo de líneas hablaba de productos que «dejan de verse» | Corregido: cuenta los productos que dependen de la línea, publicados o no |
| **M01-08 A / M01-09** (RF-CAT-06-01/03, RF-CAT-09-02) | El precio «desde» y los colores fijos del listado usaban variantes no vendibles | El listado, la ficha, la carta, los complementarios y la búsqueda (M02) usan la misma definición `variantesVendibles` |
| **M01-08 B** (RF-CAT-13-04, CA-CAT-13-06) | Un combo con unidades en una variante no vendible parecía disponible | `comboAgotado` mira solo unidades de variantes vendibles |
| **M01-13** (RF-CAT-12-12/13) | La base consumida se elegía por «menor id» y no existía «sin base» | La base sale del catálogo de colores (`color_base`): una candidata → se resuelve; ninguna → `COLOR_NO_DISPONIBLE`; varias → `409 BASE_AMBIGUA`. Colores `sin_base` para productos transparentes (variantes sin base) |
| **M01-17** | El walkthrough v3.36.0 decía «sincronizado con develop (`395dfc9`)» sin serlo | Corregida la afirmación (ese commit no es ancestro de `b19d552`) y la autoría de los walkthroughs de backend v3.35.11 y v3.36.0 |
| **RF-CAT-05-01/02/03, CA-CAT-04-04** (v9.0) | El color pertenecía a una marca y se registraba en CIELAB | Catálogo único de colores con nombre y código únicos, `hexadecimal` obligatorio y familia cromática derivada de él; desactivar una marca ya no toca colores |
| **RF-CAT-12-01/03** (v9.0) | La base no declaraba su resina | La base exige un tipo de resina activo y solo se asigna a productos de su misma resina |
| **RF-CAT-13-09, CA-CAT-13-10** (v9.0) | Todo producto exigía marca | Un combo de varias marcas puede no declararla: no entra en el filtro ni en la faceta por marca y se encuentra por su clasificación |
| **RF-BUS-01-05 / RF-BUS-02-02/03** (M02) | M02 buscaba colores entonables en la «carta de la marca» y contaba variantes no vendibles | M02 usa las reglas de visibilidad de M01: color fijo por variante vendible, color entonable por `color_base` o «sin base», y la faceta con el mismo criterio que el filtro |

---

## 3. REGLAS DE NEGOCIO APLICADAS

- **Una sola definición de visibilidad (`m01-catalogo/repositories/elegibilidad-publica.ts`):**
  - Funciones: `variantesVendibles`, `productoElegible`, `esCombo`, `comboAgotado`, `variantesPreparables`, `colorPreparable` y `dejaDeVerse`.
  - Las usan el catálogo público, las categorías, las subcategorías y la búsqueda de M02, para que buscar y navegar no contradigan la ficha.
  - Reciben el origen de la consulta: por defecto arman subconsultas correlacionadas y, cuando son la consulta principal, el repositorio les pasa su conexión.
  - Una variante preparable es de entonado (sin color propio).
- **Colores (`HU-CAT-05`):**
  - `GET /api/catalogo/colores?q=&pagina=&limite=` reemplaza a `/marcas/:idMarca/colores`.
  - Crear y actualizar reciben `nombre`, `codigo?`, `hexadecimal` (`#RRGGBB`, normalizado a mayúsculas) y `sin_base`.
  - Nombre y código únicos sin distinguir mayúsculas (`COLOR_DUPLICADO`).
  - Un color con bases declaradas no puede pasar a `sin_base` (`COLOR_CON_BASES`), y a un color `sin_base` no se le asignan bases (`COLOR_SIN_BASE`).
  - La familia (`rojos`, `amarillos`, `verdes`, `azules`, `grises`) se deriva del hexadecimal en `services/familia-cromatica.ts`.
- **Marcas (`CA-CAT-04-04`):** la cascada y el aviso de impacto ya no incluyen colores (`colores_afectados` se retira de la respuesta).
- **Bases (`HU-CAT-12`):**
  - `id_tipo_resina` es obligatorio al crear y opcional al actualizar; debe existir (`RESINA_NO_ENCONTRADA`) y estar activo (`RESINA_INACTIVA`).
  - Al asignar una base a un producto entonable: `BASE_SIN_RESINA` si es una base anterior sin resina, `BASE_DE_OTRA_RESINA` si no coincide con la del producto.
- **Variantes entonables (`RF-CAT-12-13`):**
  - Se identifican por base, o por ninguna si el producto es transparente.
  - Mezclar ambas formas en un producto se rechaza con `VARIANTE_FORMA_MIXTA`.
  - El color de una variante o imagen ya no se compara con la marca del producto.
- **Combos sin marca (`RF-CAT-13-09`):**
  - `id_marca` es opcional al crear un producto, pero solo se publica sin marca si es combo (`PRODUCTO_SIN_MARCA`).
  - La regla de visibilidad admite un producto sin marca únicamente si es combo.
  - Una pintura sin marca no puede usar líneas (`LINEA_DE_OTRA_MARCA`).
  - Reactivar no exige una marca activa cuando el producto no tiene marca.
- **M02 Búsqueda:**
  - La base de la consulta es `productoElegible`: la marca, la línea y la clasificación también deben estar activas, como en el catálogo.
  - El orden por precio y el rango de precio usan el «desde» de las variantes vendibles.
  - Los filtros de presentación y color, la coincidencia de texto por color y las facetas usan el mismo criterio `ofreceColor`.

---

## 4. ARCHIVOS MODIFICADOS

- **Base de datos:**
  - `bd/sql/schema_pintuclic.sql` (4.1, migración idempotente);
  - `bd/sql/seed_pintuclic.sql` (colores con hexadecimal y bases con resina);
  - `bd/docs/*` y `bd/README.md` (v2.9).
- **Backend:**
  - `src/core/db/types.ts`.
  - **M01:**
    - `dtos/colores.dto.ts`, `dtos/bases.dto.ts`, `dtos/productos.dto.ts`, `interfaces/m01.interfaces.ts`, `m01.routes.ts`, `controllers/colores.controller.ts`;
    - repositorios `colores`, `marcas`, `categorias`, `subcategorias`, `lineas`, `productos`, `catalogo-publico` y el nuevo `elegibilidad-publica.ts`;
    - servicios `colores`, `marcas`, `bases`, `producto-bases`, `color-bases`, `variantes`, `imagenes`, `productos`, `catalogo-publico` y el nuevo `familia-cromatica.ts`.
  - **M02:** `repositories/busqueda.repository.ts` e `interfaces/m02.interfaces.ts`.
- **Pruebas:** `m01-catalogo/__tests__/m01.test.ts`, `m01.integracion.test.ts` y el nuevo `m02-busqueda/__tests__/m02.integracion.test.ts`.

---

## 5. VERIFICACIÓN

- `npx tsc --noEmit` y `npx eslint src`: sin errores.
- **Pruebas unitarias:** M01 167/167 y M02 26/26. Las reglas nuevas verifican el código de error exacto (`assertLanzaCodigo`).
- **Pruebas de integración contra PostgreSQL (`pintuclic_pruebas_m01`, con `unaccent` y `pg_trgm`):**
  - **M01, 56/56.** Escenarios del informe:
    - una variante más barata en una presentación inactiva no fija el «desde»;
    - un combo sigue agotado aunque una variante no vendible tenga unidades;
    - un borrador no publicado no cuenta en el aviso de la categoría;
    - `BASE_AMBIGUA`;
    - un producto transparente ofrece y resuelve colores «sin base»;
    - desactivar la marca deja los colores activos.
  - **M02, 14/14 (suite nueva):**
    - solo se encuentran productos visibles;
    - el combo sin marca se encuentra por nombre y por categoría, pero no al filtrar por marca ni en la faceta de marcas;
    - el filtro, el texto y la faceta de color cubren colores fijos vendibles y entonables de `color_base`;
    - un color o un precio presente solo en una variante no vendible no cuenta;
    - con la marca inactiva solo sigue visible el combo sin marca.
- **Pruebas de los demás módulos:** sin regresiones. M04 30/30, M05 72/72, M08 117/117 y M18 22/22.
- **Esquema 4.1:**
  - la instalación limpia y la segunda ejecución corren sin errores;
  - la migración desde 4.0 con datos convierte los 30 colores a los mismos hexadecimales del seed y retira `color.id_marca`;
  - el seed nuevo carga sin errores.

---

## 6. PENDIENTES Y BLOQUEOS

- **M01-05 (RF-CAT-01-05, HU-ADM-03): sigue abierto en M17.** Revisión sobre `develop` `eb22342`:
  - M17 v0.4.7.2/v0.4.7.3 no creó los permisos de «Gestión de productos».
  - El catálogo de permisos del seed solo tiene `catalogo.ver/crear/editar/eliminar`; `productos.crear` y `productos.eliminar` son alias legados.
  - `DEPENDENCIAS_PERMISOS` (`m17.interfaces.ts:43`) solo conoce `catalogo.*`.
  - Según el informe, M17 debe definir los permisos y su migración y asignación. Después, M01 aplicará en sus rutas de productos, variantes, imágenes, combos y complementarios el permiso nuevo.
- **Frontend M01 (contrato cambiado):**
  - el formulario de colores debe pedir `hexadecimal` y `sin_base`;
  - la vista por marca debe usar `GET /colores`;
  - el formulario de bases debe pedir `id_tipo_resina`;
  - el formulario de productos debe permitir omitir la marca (solo para combos);
  - el listado debe tolerar `marca: null`;
  - el aviso de marca ya no trae `colores_afectados`;
  - el entonado puede responder `BASE_AMBIGUA` y `id_base: null`.
- **Requisitos v9.0 sin modelo aún** (conciliación con el PO, M01-17): atributos (RF-CAT-10-01), acabado, destacados, ofertas (RF-CAT-13-09 menciona encontrar combos sin marca «por la sección de ofertas»), descripción e imagen de categoría, glosario, familias administrables y carga masiva.
- **Prerrequisito de M02:** las extensiones `unaccent` y `pg_trgm` no están en `schema_pintuclic.sql` (prerrequisito global documentado por M02).
- **`docs/CHANGELOG.md` de `develop`:** trae un marcador de conflicto suelto (`>>>>>>> 129430e...`). No se tocó porque no es de este módulo.
