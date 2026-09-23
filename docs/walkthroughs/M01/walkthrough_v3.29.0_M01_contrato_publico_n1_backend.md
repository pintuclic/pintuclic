# Walkthrough de Implementación: M01 Catálogo (Backend) - v3.29.0

## 1. Resumen de la Implementación
**Versión:** v3.29.0
**Módulo:** M01 Catálogo
**HUs Cubiertas:** HU-CAT-06 (Consulta pública del catálogo - mejora de rendimiento N+1 y paginación de colores).

Se resolvió el patrón de consultas N+1 en la consulta pública del catálogo (`listarProductos`). Se mejoró el contrato de respuesta para incluir `precio_desde`, `imagen_principal_url` y `cantidad_colores` utilizando funciones agregadas a nivel de base de datos (`MIN`, `COUNT`, `EXISTS`). Se implementó un nuevo endpoint paginado para los colores activos de un producto (`/api/catalogo/publico/productos/:id/colores`).

## 2. Reglas de Negocio y Políticas Validadas
- **N+1 Resuelto:** Las consultas al listado de productos públicos ya no ejecutan una consulta individual (`obtenerFicha`) por cada producto. Todo se resuelve mediante subconsultas Kysely.
- **Validación Estricta:** Uso riguroso de Zod para las queries de paginación (`colores`) y parámetros (`id_producto`).
- **Lógica de Colores:** Se derivan `muestra_hex` (vía CIELAB) y `familia_color` en tiempo real.
- **Limitación de Entonables:** Para productos entonables, se listan los colores activos de la marca solo si el producto cuenta con al menos una variante activa con base activa (regla provisional pendiente de RF-CAT-12-12).

## 3. Criterios de Aceptación Verificados
- [x] El listado de productos devuelve los agregados (`precio_desde`, `cantidad_colores`, `id_imagen_principal`) sin incurrir en N+1 llamadas al servicio de ficha.
- [x] El endpoint `/api/catalogo/publico/productos/:id/colores` responde de forma paginada con el array de colores activos pertenecientes al producto y el `total`.
- [x] Las pruebas aseguran la correcta integración de todos los componentes.

## 4. Dependencias Externas (Habilitadores)
- **Frontend M01:** Requiere de este contrato para pintar el catálogo sin latencias por sobrecarga de consultas N+1.
- **BD / Esquema:** Depende del esquema base de Pintu Clic sin modificaciones (solo lecturas optimizadas).

## 5. Archivos Creados/Modificados
- `[NUEVO]` `src/modules/m01-catalogo/dtos/catalogo-publico.dto.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/interfaces/m01.interfaces.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/services/colores.service.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/repositories/catalogo-publico.repository.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/services/catalogo-publico.service.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/controllers/catalogo-publico.controller.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/m01.routes.ts`
- `[MODIFICADO]` `src/modules/m01-catalogo/__tests__/m01.test.ts`
- `[MODIFICADO]` `docs/CHANGELOG.md`
