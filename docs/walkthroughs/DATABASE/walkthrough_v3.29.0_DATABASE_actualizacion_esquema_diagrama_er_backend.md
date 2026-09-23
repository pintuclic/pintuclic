# Walkthrough de Implementación - Actualización de Base de Datos Pintuclic según Diagrama ER

**Versión:** `v3.29.0`  
**Capa:** `backend` (Base de Datos & DDL & Tipos Kysely)  
**Fecha:** 2026-09-22  
**Módulos Afectados:** Base de Datos (`bd/`), Core Kysely (`backend/src/core/db/`)  

---

## 🎯 Resumen Ejecutivo

En este walkthrough se documenta la actualización completa del esquema de base de datos de la plataforma **Pintuclic** (`schema_pintuclic.sql`), los datos iniciales de prueba y mocks (`seed_pintuclic.sql`), la documentación técnica oficial (`DOCUMENTACION_BASE_DATOS.md`) y las definiciones TypeScript de Kysely (`backend/src/core/db/types.ts`), alineados rigurosamente con el nuevo diagrama Entidad-Relación (Mermaid ER) suministrado.

---

## 📐 Cambios Estructurales por Entidad

### 1. Bloque Fusionado: `Variante` $\rightarrow$ `Bases` $\rightarrow$ `Color` $\rightarrow$ `tonos`
- **`base` (`Bases`):**
  - Incorpora la clave foránea `id_variante INT REFERENCES variante(id_variante)`.
  - Añade la columna `prefijo VARCHAR(50)` para identificar la nomenclatura de la base (e.g. `BSA`, `BSB`).
- **`color` (`Color`):**
  - Se vincula directamente a la base mediante `id_base INT REFERENCES base(id_base)`.
- **`tonos` (`tonos`):**
  - Añade los atributos `nombre VARCHAR(100)` y `hexagesimal VARCHAR(10)` (matiz hexadecimal).

### 2. Módulo de Ventas, Cotizaciones y Carrito
- **`cotizacion` (`Cotizacion`):**
  - Añade las claves foráneas `id_usuario INT REFERENCES usuario(id_usuario)` e `id_rol INT REFERENCES rol(id_rol)`.
- **`linea_carrito` (`LineaCarrito`):**
  - Añade la columna `ref_viva INT NOT NULL DEFAULT 1` para la trazabilidad de referencias vivas.
- **`orden` (`Orden`):**
  - Añade el campo `carrito_o_cotizacion VARCHAR(50)` para clasificar el origen de compra en checkout.

---

## 📁 Archivos Modificados / Creados

| Archivo | Tipo de Cambio | Descripción |
| :--- | :--- | :--- |
| [`bd/sql/schema_pintuclic.sql`](file:///home/patrickortiz/Documentos/Proyectos/pintuclic/bd/sql/schema_pintuclic.sql) | **[MODIFY]** | Definición DDL oficial con nuevas claves foráneas y columnas. |
| [`bd/sql/seed_pintuclic.sql`](file:///home/patrickortiz/Documentos/Proyectos/pintuclic/bd/sql/seed_pintuclic.sql) | **[MODIFY]** | Mocks idempotentes actualizados (`ON CONFLICT DO NOTHING`). |
| [`bd/docs/DOCUMENTACION_BASE_DATOS.md`](file:///home/patrickortiz/Documentos/Proyectos/pintuclic/bd/docs/DOCUMENTACION_BASE_DATOS.md) | **[MODIFY]** | Diagrama Mermaid ER oficial y diccionario de datos sincronizado. |
| [`backend/src/core/db/types.ts`](file:///home/patrickortiz/Documentos/Proyectos/pintuclic/backend/src/core/db/types.ts) | **[MODIFY]** | Interfaces Kysely (`BaseTable`, `ColorTable`, `TonosTable`, `LineaCarritoTable`, `CotizacionTable`, `OrdenTable`). |
| [`docs/CHANGELOG.md`](file:///home/patrickortiz/Documentos/Proyectos/pintuclic/docs/CHANGELOG.md) | **[MODIFY]** | Registro del incremento de versión `v3.29.0`. |

---

## 🧪 Resultados de Verificación y Compilación

1. **Compilación TypeScript Backend:**
   - Comando: `npx tsc --noEmit` en `backend/`
   - Resultado: **0 errores y 0 advertencias**.
2. **ESLint Audit Backend:**
   - Comando: `npm run lint` en `backend/`
   - Resultado: **0 errores y 0 advertencias**.
