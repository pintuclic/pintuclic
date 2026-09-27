# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> Guardar obligatoriamente en `docs/walkthroughs/M[XX]/` con el sufijo de capa técnica **al final del nombre**:  
> - **Frontend:** `walkthrough_v3.35.1_M01_diseno_storefront_tarjetas_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.35.1`
* **Tipo de Incremento:** `PATCH`
* **Módulo de Origen:** `M01 - Dashboard y Catálogo de Productos (Frontend Storefront)`
* **Fecha de Entrega:** `17/09/2026`
* **Autor / Responsable:** `Desarrollador Frontend Senior (Agente IA)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :--- | :--- |
| **HU-CAT-06** | Consulta y Navegación Pública del Catálogo y Paleta de Colores | **100% Cumplida** | `VistaInicioPublica.vue`, `VistaPaletaColoresPublica.vue`, `VistaDetalleProductoPublico.vue`, `TarjetaProductoPublico.vue`, `TarjetaCombinacionColoresPublica.vue`, `AbanicoColoresPublico.vue` |
| **HU-BUS-02** | Búsqueda y Navegación de Productos en Tienda Pública | **100% Cumplida** | `LayoutHome.vue`, `MenuCategoriasPublico.vue`, `imagenes-catalogo.ts` |
| **N/A (Core)** | Estandarización de Modales con Franja Multicolor Institucional | **100% Cumplida** | `frontend/src/core/components/overlays/Modal.vue` |

### Descripción del Alcance de la Versión
Esta versión corrige y estandariza la fidelidad visual de los componentes de storefront conforme a los mockups oficiales y especificaciones de diseño aprobadas:
1. **Rediseño Fiel de `TarjetaProductoPublico`:** Se ajustó la tarjeta de producto con esquinas redondeadas `rounded-2xl`, padding armónico `p-3.5 sm:p-4`, insignia de descuento `-15%` en la esquina superior izquierda sobre fondo oscuro translúcido con efecto blur, tipografía compacta, visualización de precios en una sola línea horizontal (`$89.900 COP $104.900`) con precio tachado, y botón de acción al pie siempre alineado (`mt-auto`) empleando tokens oficiales (`bg-conversion-hover hover:bg-conversion-accent`).
2. **Filas de 5 Productos:** Se reorganizaron las grillas de productos destacados en `VistaInicioPublica`, productos de la paleta ("Pinturas disponibles" y "Herramientas recomendadas") en `VistaPaletaColoresPublica`, y productos relacionados ("Productos que te pueden interesar") en `VistaDetalleProductoPublico` para exhibir exactamente 5 tarjetas por fila en escritorio (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`), asegurando consistencia visual y evitando espacios vacíos desproporcionados.
3. **Distribución del Combinador de Colores:** Se reconfiguró la sección de combinaciones en `VistaPaletaColoresPublica` a una cuadrícula de 2 filas × 2 columnas (`grid grid-cols-1 md:grid-cols-2 gap-4`), con tarjetas de altura homogénea (`h-full flex flex-col justify-between`) y muestras cromáticas de `h-9` con información visible en hover.
4. **Optimización de Espaciados en Abanico de Colores:** Se redujeron los márgenes y alturas mínimas residuales en `AbanicoColoresPublico` para evitar vacíos visuales excesivos entre el título de sección y las láminas interactivas.
5. **Eliminación del Botón de Slider:** Se retiró el botón circular de navegación/slider de productos destacados en la Home, permitiendo una visualización limpia e integrada de las 5 tarjetas.
6. **Franja Arcoíris en Modales:** Se incorporó en el componente unificado `Modal.vue` del Core la barra superior degradada multicolor representativa de la identidad de Pintu Clic.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE DISEÑO APLICADAS

### A. Reglas de Arquitectura y Diseño Frontend
- **Design System Pintu Clic (Directiva 8):** Uso estricto y exclusivo de tokens institucionales definidos en `frontend/src/core/theme/colors.ts`:
  - Botón de conversión y acento: `bg-conversion-hover`, `hover:bg-conversion-accent`.
  - Bordes y superficies: `border-neutral-200`, `bg-neutral-50`, `text-neutral-900`, `text-neutral-500`.
  - Estados activos y navegación: `text-corporate-navy`, `bg-action-primary`.
  - Píldora de Ofertas: fondo rojo institucional de oferta con texto blanco en el menú de categorías.
- **Tipografía Institucional:** Aplicación rigurosa de `font-title` (Poppins) para títulos de tarjetas, precios destacados y encabezados de sección; y `font-sans` (Inter) para descripciones, botones y textos secundarios.
- **Arquitectura Limpia y Principios SOLID:** Componentes desacoplados, responsabilidades únicas, sin mutaciones directas de props ni lógicas duplicadas.
- **Cero Esquemas Inline (Directiva 12):** No se introdujeron validaciones ni esquemas de validación dentro de plantillas `.vue`.

### B. Políticas Transversales Validadas
- 🎨 **Design System:** 100% de clases auditadas bajo tokens oficiales. Prohibidos colores hexadecimales inline o clases arbitrarias `bg-[#...]`.
- 🛡️ **Aislamiento de Módulo:** Cambios acotados exclusivamente al storefront de M01 y al componente de modal transversal del Core. Archivos de infraestructura (`docker-compose.yml`, `.env`) y backend han sido estrictamente excluidos de este commit.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 M01 Storefront — Rediseño de Tarjetas y Distribución Visual

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-TARJ-01** | La tarjeta de producto debe incluir badge de descuento `-15%`, precio actual y tachado en línea, y botón de acción fijado al pie. | Inspección visual en navegador y verificación en `TarjetaProductoPublico.vue`. | ✅ **CUMPLIDO** |
| **CA-TARJ-02** | Las secciones de productos en Home, Paleta y Detalle deben desplegar 5 tarjetas por fila en pantallas grandes. | Validación de clases `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` en las 3 vistas. | ✅ **CUMPLIDO** |
| **CA-TARJ-03** | El combinador de colores debe presentarse en grilla 2×2 ocupando el espacio vertical de forma equilibrada. | Comprobación en `VistaPaletaColoresPublica.vue` con `grid-cols-1 md:grid-cols-2`. | ✅ **CUMPLIDO** |
| **CA-TARJ-04** | El abanico de colores no debe presentar espacios vacíos excesivos en la parte superior ni inferior. | Ajuste de paddings y altura `min-h-[460px]` en `AbanicoColoresPublico.vue`. | ✅ **CUMPLIDO** |
| **CA-TARJ-05** | Los modales deben exhibir la barra superior con el degradado cromático oficial de Pintu Clic. | Inspección de `frontend/src/core/components/overlays/Modal.vue`. | ✅ **CUMPLIDO** |
| **CA-TARJ-06** | Se debe retirar el botón de control de slider en productos destacados. | Verificación en `VistaInicioPublica.vue`. | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Backend M01 (Catálogo Público):**
  - Endpoint `GET /api/v1/catalogo-publico/inicio`: Retorna productos destacados.
  - Endpoint `GET /api/v1/catalogo-publico/productos/:id`: Provee el detalle del producto y la lista de complementarios (actualizado a 5 complementarios).
  - Base de datos PostgreSQL con catálogo sembrado (`seed_pintuclic.sql`) conteniendo los productos 1 al 5 con sus precios y variantes.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **M07 Carrito de Compras:** Los botones "Agregar al Carrito" y "Comprar Ahora" estandarizados en las tarjetas de 5 columnas canalizan directamente los SKUs hacia el flujo de compra.
- **M02 Búsqueda y Filtros:** La estructura uniforme de tarjetas es reutilizable para los resultados de búsqueda avanzada.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `docs/walkthroughs/M01/walkthrough_v3.35.1_M01_diseno_storefront_tarjetas_frontend.md` | Documento oficial de walkthrough para la versión v3.35.1. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Registro de la versión v3.35.1 con resumen de alcance y puntero técnico. |
| **[MODIFICADO]** | `frontend/src/core/components/overlays/Modal.vue` | Incorporación de la barra superior decorativa con degradado multicolor Pintu Clic. |
| **[MODIFICADO]** | `frontend/src/core/layouts/LayoutHome.vue` | Detección reactiva de enlaces activos (`isActivo`), píldora roja de OFERTAS y soporte de categorías. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/assets/imagenes-catalogo.ts` | Mapeo determinístico de imágenes SVG para productos con IDs 1 a 5. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaProductoPublico.vue` | Estandarización de dimensiones, badge `-15%`, precios en una línea y botón alineado al pie. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaCombinacionColoresPublica.vue` | Ajuste de altura completa (`h-full`), padding proporcional y muestras `h-9`. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/AbanicoColoresPublico.vue` | Optimización de altura y espaciados para eliminar espacios en blanco redundantes. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/CartaColoresProductoPublica.vue` | Ajustes cosméticos menores de alineación. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/MenuCategoriasPublico.vue` | Integración y compatibilidad con barra de navegación. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/composables/useInicioPublico.ts` | Ordenamiento por ID para presentación fiel de productos destacados. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/composables/useCatalogoPublico.ts` | Manejo de criterios de visualización pública. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaInicioPublica.vue` | Grilla de 5 columnas para productos destacados y supresión del botón de slider. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaPaletaColoresPublica.vue` | Grilla 2x2 para combinador y filas de 5 columnas en pinturas y herramientas recomendadas. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue` | Fila de 5 columnas en la sección de productos complementarios de interés. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `[ ✅ SÍ ]`
* **Pruebas de Calidad Superadas (QA Gate):** `[ ✅ SÍ (ESLint 0 errores, vue-tsc/vite 0 errores) ]`
* **Apego a la Arquitectura y Directivas:** `[ ✅ 100% Conforme a AGENTS.md ]`
