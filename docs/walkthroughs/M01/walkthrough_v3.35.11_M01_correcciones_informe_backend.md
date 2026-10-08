# Walkthrough v3.35.11 — M01 Correcciones backend del informe de faltantes

## 1. Metadatos de la Implementación
- **Versión:** `v3.35.11`
- **Módulo de Origen:** `M01 Catálogo de productos`
- **Fecha y Autor:** 2026-10-07 — Agente IA (Claude), a solicitud del equipo M01.
- **Fuente:** `Informe_M01_faltantes_errores_inconsistencias.docx` (6 de octubre de 2026). Solo hallazgos de backend.

## 2. Historias de Usuario (HUs) Cubiertas
| Hallazgo | HU / Requisito | Resultado |
| :--- | :--- | :--- |
| M01 01 Publicación sin imagen | HU-CAT-02 / RF-CAT-02-05 | Corregido |
| M01 02 Impacto de categorías con relación antigua | HU-CAT-01 / RF-CAT-01-04 | Corregido |
| M01 03 Desactivación de color sin cascada | HU-CAT-05 / RF-CAT-05-05, RF-CAT-09-02 | Corregido |
| M01 04 Reactivación incompleta de productos | HU-CAT-09 / RF-CAT-09-04, RF-CAT-01-04 | Corregido |
| M01 06 Impacto de líneas sin reglas M06 | HU-CAT-11 / RF-CAT-11-03 | Parcial: dependencia no integrada explícita |
| M01 07 Cascada de marca sin transacción | HU-CAT-04 / RF-CAT-04-03 | Parcial: transacción común; campañas pendientes |
| M01 09 Visibilidad sin dependencias activas | HU-CAT-06 / RF-CAT-01-04, RF-CAT-09-02 | Corregido |
| M01 10 Imágenes públicas por ruta protegida | HU-CAT-06/07 / RF-CAT-06-01, RF-CAT-07-03 | Corregido |
| M01 12 Complementarios incompletos | HU-CAT-08 / RF-CAT-08-03, CA-CAT-08-03 | Parcial: variantes activas y azar; herencia por categoría y combos pendientes |
| M01 14 Orden público distinto del administrado | HU-CAT-01 / RF-CAT-01-01 | Corregido |

## 3. Reglas de Negocio y Políticas de Seguridad Aplicadas
- **Elegibilidad pública única (`productoElegible`):** producto activo y publicado, marca activa, línea activa o nula, al menos una subcategoría activa bajo categoría activa y al menos una variante activa con presentación activa y color/base activos cuando aplican. Se aplica en listado, conteo, ficha, categorías, complementarios, patrocinados e imágenes públicas.
- **Variantes públicas:** además de su estado, exigen presentación, color y base activos.
- **Publicar:** exige variante activa **y** al menos una imagen (`PRODUCTO_SIN_IMAGEN`).
- **Reactivar producto:** exige marca, línea y al menos una subcategoría activa bajo categoría activa (`PRODUCTO_SIN_CLASIFICACION_ACTIVA`). Reactivar no publica.
- **Impacto de categoría/subcategoría:** cuenta, vía `producto_subcategoria`, solo los productos activos que pierden su última clasificación activa.
- **Desactivar color:** transacción que desactiva el color y sus variantes de colores fijos; en entonables el color solo sale de la carta.
- **Desactivar marca:** marca, líneas, bases, colores y productos en una única transacción.
- **Línea:** la advertencia añade `reglas_integradas: false` para no presentar el 0 de M06 como conteo confirmado.
- **Imágenes:** nueva ruta sin autenticación `GET /api/catalogo/publico/imagenes/:id/contenido` (solo productos elegibles, `Cache-Control: public`). La ruta administrativa `/api/catalogo/imagenes/:id/contenido` sigue protegida con `catalogo.ver` (🛡️ HU-ADM-03 / 🔒 HU-SEG-03).
- **Complementarios:** solo productos elegibles bajo subcategoría activa; patrocinados primero y el resto en orden aleatorio.
- **Menú público:** ordena por `orden` administrado con desempate por nombre e id.

## 4. Criterios de Aceptación Cumplidos (Matriz de Verificación)
| Criterio | Verificación |
| :--- | :--- |
| RF-CAT-02-05 publicar sin imagen se rechaza | Prueba nueva en `m01.test.ts` |
| RF-CAT-09-04 reactivar sin clasificación activa se rechaza | Prueba nueva en `m01.test.ts` |
| RF-CAT-07-03 imagen pública accesible y retirada al despublicar | 2 pruebas nuevas |
| RF-CAT-06-01 la ficha entrega URLs públicas | Prueba nueva |
| RF-CAT-05-05 cascada de color a variantes fijas | Prueba nueva |
| Regresión | `npx tsx src/modules/m01-catalogo/__tests__/m01.test.ts`: 129 superadas, 0 fallidas; `tsc --noEmit` y `eslint src/modules/m01-catalogo` limpios |

| Integración PostgreSQL 15 (contenedor `pintuclic-db`) | `__tests__/m01.integracion.test.ts`: **22 superadas, 0 fallidas** en una base aislada `pintuclic_pruebas_m01` creada con `bd/sql/schema_pintuclic.sql` y eliminada al terminar. Cubre M01-01, 02, 03, 04, 07 (incluida reversión de la transacción ante una falla forzada), 09, 10, 12 y 14 con productos multiclasificados y dependencias inactivas. |

> La suite de integración escribe datos: solo se ejecuta si el nombre de la base contiene "prueba" y borra sus registros al terminar. No se probó concurrencia ni la ruta HTTP en el backend desplegado (el contenedor corre la imagen anterior).

## 5. Resumen Conceptual de Dependencias Externas
Pendientes que requieren tocar archivos compartidos o de otros módulos (protocolo Stop & Report de `AGENTS.md`):
- **M01 05 Permisos separados:** crear el permiso «Gestión de productos» exige cambios en M17 (`m17.interfaces.ts`) y en `bd/sql/seed_pintuclic.sql`.
- **M01 06 / M01 07:** M06 (reglas comerciales) y campañas no existen aún; cuando existan se integran el conteo real y la cascada.
- **M01 08 Combos:** requiere coordinación con precios, importación SAMIT y M08 Órdenes (decremento atómico y bloqueo de sobreventa).
- **M01 11 Miniaturas:** requiere una librería de procesamiento de imágenes (`package.json` compartido) o almacenamiento de variantes en BD.
- **M01 12 Herencia por categoría:** requiere columna nueva en `categoria` (esquema compartido). Exclusión de combos agotados depende de M01 08.
- **M01 13 Resolución color–base:** depende del dato de negocio RF-CAT-12-12.
- **Frontend:** no se modificó. Las vistas públicas consumen `contenido_url`/`imagen_principal_url` de la API, que ahora apuntan a la ruta pública.

Habilita a M02, M05 y M08 a confiar en que un producto expuesto públicamente tiene todas sus dependencias activas.

## 6. Registro de Archivos Modificados / Creados
Todos dentro de `backend/src/modules/m01-catalogo/` (más este walkthrough y `docs/CHANGELOG.md`):
- `m01.routes.ts`
- `controllers/catalogo-publico.controller.ts`
- `interfaces/m01.interfaces.ts`
- `repositories/catalogo-publico.repository.ts`, `categorias.repository.ts`, `subcategorias.repository.ts`, `colores.repository.ts`, `marcas.repository.ts`, `productos.repository.ts`
- `services/catalogo-publico.service.ts`, `colores.service.ts`, `lineas.service.ts`, `marcas.service.ts`, `productos.service.ts`
- `__tests__/m01.test.ts`
- `__tests__/m01.integracion.test.ts` (nuevo)
