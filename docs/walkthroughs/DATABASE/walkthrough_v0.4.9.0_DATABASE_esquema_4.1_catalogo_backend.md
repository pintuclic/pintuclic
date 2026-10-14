# Walkthrough de Implementación - Base de Datos v2.9 (esquema 4.1): catálogo M01 según requisitos v9.0

**Versión:** `v0.4.9.0` (base de datos `v2.9`, esquema `4.1`)
**Capa:** `backend` (Base de Datos, DDL, seed y tipos Kysely)
**Fecha:** 2026-10-14
**Autor / Responsable:** Ingri Julieth (@ingrijuliethgascatenorio-bot), con apoyo de un agente de IA (Claude Code). Edición de la base autorizada por el líder técnico.
**Módulos Afectados:** Base de datos (`bd/`), Core Kysely (`backend/src/core/db/types.ts`), M01 Catálogo y M02 Búsqueda
**Detalle oficial de la migración:** [bd/docs/WALKTHROUGH_DATABASE.md (v2.9)](../../../bd/docs/WALKTHROUGH_DATABASE.md#-versión-29--v04900-2026-10-14)

---

## 🎯 Resumen Ejecutivo

Ajuste del modelo de catálogo a la especificación de requisitos v9.0 de M01 y al informe de revisión del líder técnico:
- el color pasa a un catálogo único, sin marca;
- se registra con hexadecimal en lugar de CIELAB;
- puede declararse «sin base» para productos transparentes;
- la base de entonado declara su tipo de resina;
- un combo puede no tener marca.

El total de tablas se mantiene en 50.

---

## 📐 Cambios Estructurales por Entidad

| Tabla | Cambio | Requisito |
| :--- | :--- | :--- |
| `color` | Añade `hexadecimal CHAR(7) NOT NULL` con `chk_color_hexadecimal` (`^#[0-9A-F]{6}$`) | RF-CAT-05-02/03 |
| `color` | Añade `sin_base BOOLEAN NOT NULL DEFAULT false` | RF-CAT-12-13 |
| `color` | Retira `cie_l`, `cie_a`, `cie_b`, `id_marca` (con `fk_color_marca`) y `uq_color_nombre_marca` | RF-CAT-05-01, CA-CAT-04-04 |
| `color` | Únicos `uq_color_nombre (lower(nombre))` y `uq_color_codigo (lower(codigo)) WHERE codigo IS NOT NULL` | RF-CAT-05-01, CA-CAT-05-01 |
| `base` | Añade `id_tipo_resina INT` con `fk_base_tipo_resina` e índice `idx_base_tipo_resina` | RF-CAT-12-01/03 |
| `producto` | `id_marca` pasa a `NULL` permitido (solo los combos pueden omitirla; lo controla el backend) | RF-CAT-13-09 |

---

## 🔁 Migración desde el esquema 4.0

El script es idempotente y se ejecuta igual sobre una base nueva o existente:
1. **Columnas nuevas:** `ADD COLUMN IF NOT EXISTS` para `hexadecimal`, `sin_base` e `id_tipo_resina`.
2. **Conversión del CIELAB:** la función temporal `pg_temp.cielab_a_hexadecimal` (D65 → XYZ → sRGB, la misma fórmula que usaba el backend) llena `hexadecimal` antes de retirar las columnas CIELAB.
3. **Control de nombres repetidos:** si dos colores comparten nombre (antes solo eran únicos por marca), la migración se detiene con un mensaje para unificarlos; no borra ni renombra datos.
4. **Retiro de la marca:** `ALTER TABLE color DROP COLUMN IF EXISTS id_marca` y `ALTER TABLE producto ALTER COLUMN id_marca DROP NOT NULL`.
5. **Bases existentes:** conservan `id_tipo_resina` en `NULL`. El backend no las asigna a productos hasta que se declare la resina (`BASE_SIN_RESINA`).

**Seed (`seed_pintuclic.sql`):** los 30 colores se cargan con su hexadecimal y sin marca; las bases A y B, con el tipo de resina 1. `tipo_resina` se inserta antes que `base`.

**Tipos Kysely (`types.ts`):**
- `ColorTable`: `hexadecimal`, `sin_base` y sin `id_marca`/CIELAB.
- `BaseTable`: `id_tipo_resina`.
- `ProductoTable`: `id_marca: number | null`.

---

## ✅ Verificación

| Prueba | Resultado |
| :--- | :--- |
| Instalación limpia del esquema en base de pruebas | ✅ Sin errores, 50 tablas |
| Segunda ejecución del mismo script | ✅ Sin errores ni cambios |
| Migración desde 4.0 con marcas, bases y 30 colores | ✅ Los 30 hexadecimales convertidos coinciden con los del seed nuevo; `color.id_marca` retirado; `producto.id_marca` opcional |
| Carga del seed nuevo | ✅ Sin errores (30 colores) |
| Integración M01 (56) y M02 (14) contra PostgreSQL | ✅ 70/70 |
| Aplicación sobre la base local `pintuclic` (con respaldo previo `pg_dump`) | ✅ Sin errores; backend reconstruido y respondiendo por HTTP |

---

## 💻 Impacto

- **M01:**
  - colores con hexadecimal y «sin base»;
  - bases con resina obligatoria;
  - productos sin marca solo publicables si son combos.
- **M02:** filtra colores por `color_base` y variantes vendibles; ya no usa `color.id_marca`.
- **Frontend:** debe pedir el hexadecimal en los colores y la resina en las bases, y tolerar `marca: null`.
- **Prerrequisito de M02:** las extensiones `unaccent` y `pg_trgm` no forman parte del script.
