# Walkthrough de implementación — menú móvil de Productos

## 1. Metadatos

- **Versión base de trabajo:** v0.3.34.0 (sin publicación ni cambio de versión).
- **Módulo:** M01 Catálogo, frontend.
- **Fecha:** 29/09/2026.
- **Responsable:** agente de IA.
- **Estado:** punto 1 implementado localmente; pendiente de revisión visual del usuario.

## 2. Historia y alcance

**HU-CAT-06 — Consulta pública del catálogo.** El botón hamburguesa móvil abre Inicio, Productos, Ofertas, Servicios, Paleta de Color y Sobre Nosotros. Productos despliega «Ver todos los productos» y las categorías disponibles. Elegir una categoría abre únicamente sus subcategorías; elegir una subcategoría navega al catálogo filtrado con título y migas de pan correspondientes. La opción de ver todos navega a `/catalogo` sin filtro.

## 3. Reglas y políticas

- Las categorías y subcategorías se obtienen del servicio público existente de M01. No se añadieron llamadas ni cambios al backend.
- La selección de subcategoría usa el parámetro `subcategoria` que ya consume la vista pública del catálogo. La selección de todos omite ese parámetro.
- El menú de escritorio conserva su presentación anterior. No se añadieron datos sensibles ni controles de autorización en el cliente.
- Se consultó el diagrama de M01 sobre categorías y subcategorías; su flujo administrativo no cambia.
- La imagen local del frontend se compila con el Dockerfile oficial y `VITE_API_URL=/api`; esto evita la petición directa a `localhost:3000` que activaba el rechazo CORS desde `localhost:8080`. No se editó el backend.
- El encabezado móvil oculta la barra superior de mensajes y fija las acciones de cuenta/carrito al borde derecho del viewport para evitar que el menú quede fuera del ancho visible.
- El menú móvil usa una superficie neutra oscura y translúcida, desenfoque de fondo, borde de reflejo y texto blanco mediante los tokens oficiales. La hamburguesa sigue limitada a tamaños responsive.
- El encabezado de escritorio conserva su botón «Categorías» con su menú público original. El menú responsive sigue disponible únicamente bajo `xl`.
- Los enlaces del encabezado de escritorio tienen separación respecto al botón «Categorías», ajustada para tamaños `xl` y `2xl` según la referencia visual.
- Si la URL del catálogo contiene una subcategoría, al reabrir el menú se muestra su categoría y se resalta la subcategoría actual. Los nombres combinados del catálogo permanecen tal como están en la base de datos.

## 4. Criterios verificados

| Criterio | Resultado |
| --- | --- |
| Hamburguesa móvil muestra las seis secciones y Productos despliega el catálogo completo y las categorías | Implementado; prueba de componente aprobada |
| Una categoría muestra solo sus subcategorías | Implementado; prueba de componente aprobada |
| La subcategoría seleccionada abre `/catalogo?subcategoria=<id>` | Implementado mediante el manejador existente del layout |
| Ver todos abre `/catalogo` sin filtro | Implementado mediante un manejador nuevo |
| Catálogo general y filtrado muestran productos reales sin error | Verificado en Edge headless con la API local |
| Compilación TypeScript/Vite y ESLint | Aprobados dentro de Docker |
| Estilo vidrioso y recuperación de la categoría filtrada al reabrir | Implementados; dos pruebas de componente aprobadas |
| Prueba existente de rutas públicas | Agotó su tiempo fijo de 20 segundos dentro de Docker; no se modificó |

## 5. Dependencias externas

El menú necesita el servicio público de categorías de M01 y la ruta de catálogo existente. Habilita la exploración móvil de productos sin afectar los módulos de cuentas, carrito o administración.

## 6. Archivos

| Acción | Ruta | Motivo |
| --- | --- | --- |
| Modificado con autorización explícita | `frontend/src/core/layouts/LayoutHome.vue` | Botón hamburguesa, carga de categorías y navegación del menú móvil |
| Creado | `frontend/src/modules/m01-catalogo/components/publicas/MenuNavegacionMovil.vue` | Secciones, acordeón de Productos y vista de subcategorías |
| Modificado | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Título, migas de pan y URL de filtros sincronizados |
| Creado | `frontend/src/modules/m01-catalogo/tests/publicas/menu-productos-movil.test.ts` | Prueba de interacción móvil |

## 7. Cierre local

La corrección del punto 1 está cargada en el frontend local de Docker. No hubo cambios de backend, commit ni push. Los puntos 2 y 3 quedan pendientes según la instrucción de resolver cada punto por separado.
