# Walkthrough de Implementación — v3.31.0

## 1. Identificación

- **Módulo:** M01 — Catálogo de Productos.
- **Historia:** HU-CAT-06 — Vistas Públicas de la Tienda.
- **Entrega:** Calculadora pública de pintura.
- **Incremento:** MINOR.

## 2. Resultado

Se implementó un modal responsive de cálculo accesible desde Home, catálogo y detalle. Permite elegir superficie, ingresar dimensiones, indicar cuántas superficies iguales se pintarán y obtener una recomendación de galones y producto.

## 3. Reglas implementadas

- Ancho y alto deben ser positivos y no superar 100 metros.
- La cantidad debe estar entre 1 y 50.
- El área se calcula como `ancho × alto × cantidad`.
- La estimación contempla dos manos y usa el promedio entre rendimiento mínimo y máximo del producto.
- Cuando no existe rendimiento registrado se aplica una referencia conservadora de 35 m² por galón y se identifica el resultado como aproximado.
- El resultado siempre recomienda al menos un galón.

## 4. Arquitectura y políticas

- El esquema Zod reside en `dtos/calculadora-pintura.dto.ts`, fuera del componente Vue.
- El componente no persiste datos ni inserta catálogos.
- Todos los colores utilizan tokens oficiales del Design System.
- La acción de carrito informa la dependencia de M07 sin implementar lógica externa al módulo.

## 5. Validación

- Flujo superficie → medidas → resultado.
- Recalculo reactivo del área y galones.
- Apertura y cierre desde las tres vistas públicas.
- Bloqueo del desplazamiento de fondo mientras el modal está abierto.
- Compilación TypeScript y ESLint sin errores ni advertencias.

## 6. Archivos

- `frontend/src/modules/m01-dashboardcatalogo/dtos/calculadora-pintura.dto.ts`
- `frontend/src/modules/m01-dashboardcatalogo/components/publicas/CalculadoraPinturaPublica.vue`
- `frontend/src/modules/m01-dashboardcatalogo/views/VistaInicioPublica.vue`
- `frontend/src/modules/m01-dashboardcatalogo/views/VistaCatalogoPublico.vue`
- `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue`
- `docs/CHANGELOG.md`
