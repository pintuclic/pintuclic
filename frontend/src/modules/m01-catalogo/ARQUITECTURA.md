# M01 — Estructura y análisis SOLID

Fecha: 2026-09-22. Alcance: integración de las ramas Core y dashboard, y organización del frontend público. Este documento es una explicación de implementación y deuda técnica; no es un dictamen de cierre funcional ni un archivo de `docs/reviews/`.

## Decisión de estructura

Se adopta `m01-catalogo`, el nombre ya utilizado por el backend y por el panel nuevo. Se mantienen las capas oficiales y se separa la audiencia dentro de cada capa. Así se preservan los imports administrativos del compañero y se distingue la propiedad de los archivos públicos.

Se trasladaron 45 archivos públicos del módulo antiguo y se retiraron sus 132 archivos restantes, correspondientes al panel sustituido, sus mocks, barriles y documentación obsoleta. Los 26 archivos de administración recibidos desde `dd0c8be` se conservan sin cambios. El inventario exacto de movimientos y retiradas está en el walkthrough de v3.35.9.

El contrato público se exporta desde `publico.routes.ts`. El archivo `catalogo.routes.ts` del compañero sigue dedicado al panel. El router global solamente los integra con sus layouts.

## Flujo de dependencias público

```text
views/publicas → composables/publicas → CatalogoPublicoGateway
      ↓                                      ↑ implementa
components/publicas                 services/publicas → services/http → core/api
      ↓                                      ↓
interfaces/publicas                 interfaces/publicas

dtos/publicas: validación de entradas; assets: recursos visuales.
```

Los composables aceptan el puerto de lectura como parámetro opcional y usan el adaptador HTTP real por defecto. `enriquecerProductosPublicos` concentra la consulta de detalles antes repetida en Inicio, Catálogo, Paleta y Detalle. Un fallo de una ficha conserva el resumen con `detalle: null`, igual que antes de la extracción.

No se añade un store público artificial: no existe actualmente un requisito de persistencia compartida que lo justifique. El store administrativo de taxonomías continúa siendo responsabilidad del panel.

## Evaluación SOLID

| Principio | Estado y evidencia | Alcance pendiente |
| --- | --- | --- |
| S: responsabilidad única | Separación de vistas, componentes, DTOs, contratos y HTTP. El enriquecimiento repetido reside ahora en un solo servicio. | `VistaCatalogoPublico.vue` aún combina UI y orden/filtros locales; `VistaDetalleProductoPublico.vue` combina galería, selección de variantes y clasificación de pintura. Mover archivos por sí solo no resuelve estas responsabilidades. |
| O: abierto/cerrado | El transporte público puede sustituirse mediante `CatalogoPublicoGateway` sin modificar las vistas. Los componentes se configuran con props/eventos. | Clasificación de pinturas y armonías cromáticas contienen decisiones concretas; ampliar esas reglas todavía exige editar lógica existente. |
| L: sustitución | No hay jerarquía de clases pública a la que aplicar una comprobación clásica de herencia. El puerto declara respuestas y promesas tipadas. | TypeScript comprueba la forma, no la equivalencia semántica. No se certifica sustitución completa sin pruebas de contrato de implementaciones alternativas. |
| I: segregación de interfaces | Los tipos públicos están separados de los contratos de administración. El enriquecimiento requiere solo `Pick<CatalogoPublicoGateway, 'obtenerFicha'>`. `interfaces/publicas` contiene únicamente tipos. | El puerto público agrupa cuatro lecturas; podría dividirse si consumidores futuros necesitan adaptadores independientes. No se añaden interfaces redundantes ahora. |
| D: inversión de dependencias | Los cuatro composables reciben un contrato de lectura inyectable; el adaptador utiliza el transporte compartido del módulo. | El adaptador real sigue siendo el valor por defecto. `LayoutHome` aún importa el servicio y el menú M01 directamente: acoplamiento global preexistente que requiere una decisión coordinada de Core. |

Resultado: organización por capas coherente y mejora concreta en DRY, segregación e inyección. **No se declara cumplimiento SOLID total.**

## Comprobaciones de las reglas del repositorio

- Nomenclatura única `m01-catalogo` y carpetas por responsabilidad.
- DTOs públicos fuera de `.vue`; tipos de lectura y esquema de combinaciones en `interfaces/publicas`.
- Se reutiliza `services/http.ts`; no se duplica `ApiResponse` en otro archivo público.
- No se crean datos de catálogo, seeds runtime ni mocks. Los mocks del admin antiguo se retiran con los archivos sustituidos.
- No se modifican rutas, controladores ni servicios de otros módulos para reorganizar las vistas públicas.
- Las resoluciones compartidas de los merges y la conexión del router fueron autorizadas explícitamente. Los cambios M04 incorporados provienen de Core; la resolución OTP conserva la versión previamente validada.
- Los campos públicos de color, sus pruebas y el seed se conservan byte por byte respecto del estado anterior al segundo merge.
- No hay cambios a `docs/reviews/` ni push.

## Deuda preexistente que esta reorganización no cierra

1. **Paginación de colores (HU-CAT-06):** la paleta construye colores desde las fichas de los primeros 20 productos. La carta del detalle filtra las variantes recibidas; no equivale a paginación de colores/familias en servidor. No certificar CA-CAT-06-06.
2. **Consultas adicionales:** cada página consulta una ficha por producto. La extracción elimina duplicación de código, no el patrón de múltiples peticiones. Para optimizarlo hace falta acordar un resumen público enriquecido con backend.
3. **Filtros y orden:** parte de la UI pública opera sobre la página recibida; no representa ordenamiento/facetas globales de M02. Mantener explícita esta limitación al planificar HU-BUS.
4. **Detalle extenso y regla inline:** `esPintura` usa una expresión regular dentro de la vista. Contradice la separación exigida por infraestructura para reglas complejas; requiere extraer una regla de dominio y acordar una clasificación fiable con backend.
5. **Recursos de maqueta:** `assets/imagenes-catalogo.ts` conserva imágenes de respaldo por ID y exportaciones antiguas de recursos visuales. Las tarjetas contienen presentación comercial preliminar. No son evidencia de datos reales de imágenes o promociones; no se alteran en una reorganización.
6. **Errores/carreras:** peticiones públicas concurrentes no tienen cancelación ni descarte de respuestas antiguas; el detalle agrupa ficha/categorías/complementarios en una sola promesa y un fallo secundario puede mostrar “no disponible”. Requiere un fix separado.
7. **Core:** el layout todavía contiene acoplamiento a M01 y el modal global conserva una franja con colores inline heredados. No se certifica cumplimiento total de paleta ni se amplía esta tarea a rediseñar Core.
8. **Admin:** el menú global enlaza `/admin/catalogo/busquedas-sin-resultado`, ausente del panel de `dd0c8be`. Se respeta la indicación del usuario de dejar la última versión administrativa; debe resolverlo su responsable.
9. **Documentación:** la matriz de trazabilidad no enumera M01; varias imágenes HU-CAT-*.png enlazadas en la especificación no existen con esos nombres. Se inspeccionó el diagrama existente `Entonado durante la compra.drawio.png`; no se inventan contratos faltantes.

## Coordinación recomendada

La responsable de públicos puede evolucionar sus subcarpetas sin mover archivos del panel. Cambios en `http.ts`, contratos compartidos, rutas Core, autenticación o endpoints requieren coordinación. Una mejora funcional posterior debe identificar la HU y su diagrama antes de alterar comportamiento. Las pruebas y limitaciones de esta entrega se registran en el walkthrough, sin afirmar cierre de M01.
