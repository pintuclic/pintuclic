# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> Guardar obligatoriamente en `docs/walkthroughs/M[XX]/` con el sufijo de capa técnica **al final del nombre**:  
> - **Frontend:** `walkthrough_v3.35.2_M01_avance_detalle_producto_y_core_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.35.2`
* **Tipo de Incremento:** `PATCH`
* **Módulo de Origen:** `M01 - Dashboard y Catálogo de Productos & Core Frontend`
* **Fecha de Entrega:** `19/09/2026`
* **Autor / Responsable:** `Desarrollador Frontend Senior (Agente IA)`
* **Estado de la Implementación:** `⚠️ AVANCE PRELIMINAR (EN PROGRESO / DETALLE DE PRODUCTO NO FINALIZADO)`

---

## 2. HISTORIAS DE USUARIO Y ALCANCE DE ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-06** | Consulta y Navegación Pública del Catálogo y Paleta de Colores | **90% (Avance)** | `VistaPaletaColoresPublica.vue`, `VistaDetalleProductoPublico.vue`, `TarjetaProductoPublico.vue` |
| **HU-CAT-10** | Calculadora de Pintura y Selección Técnica | **85% (Avance)** | `VistaDetalleProductoPublico.vue` (`v-if="esPintura"`) |
| **N/A (Core)** | Centralización de Utilidades y Componentes Globales del Design System | **100% Cumplida** | `src/core/utils/moneda.ts`, `MuestraColor.vue`, `Badge.vue` |

### ⚠️ Aclaración Expresa de Alcance (Solicitud del Usuario / PO)
> **NOTA CRÍTICA:** Esta versión **NO declara concluida la vista de Detalle de Producto (`VistaDetalleProductoPublico.vue`)**.  
> Representa un **avance técnico preliminar** centrado en la resolución de inconsistencias visuales, segregación de productos sin color (herramientas vs pinturas), deduplicación de variantes cromáticas y normalización de componentes hacia la zona Core compartida.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE DISEÑO APLICADAS

### A. Reglas de Negocio Específicas
1. **Segregación de Calculadora (`HU-CAT-10`):**
   * Se condicionó la visibilidad del botón y modal de calculadora (`CalculadoraPinturaPublica`) mediante la propiedad computada `esPintura`.
   * Productos con `clase_color === 'sin_color'` o que contengan descriptores de herramientas/accesorios (taladro, rodillo, brocha, cinta, etc.) no presentan la calculadora.
2. **Deduplicación y Previa Limpia de Carta de Colores:**
   * Las variantes con el mismo `id_color` distribuidas en diferentes presentaciones se unificaron, eliminando las repeticiones de muestras idénticas.
   * Se limitó la previsualización directa a un máximo de 6 colores (`MAX_COLORES_PREVIA`), incorporando un botón disparador `+N más` que abre el modal interactivo de la Carta de Colores completa.
3. **Persistencia y Selección por Query Parameter:**
   * Al navegar desde la Paleta de Colores hacia el detalle de producto, se transmite el parámetro `?color=[id_color]`, preseleccionando automáticamente la variante cromática e imagen de galería correspondiente.

### B. Arquitectura y Zona Global (`src/core/`)
1. **Utilidad Global de Moneda COP (`src/core/utils/moneda.ts`):**
   * Centralización de `formatearCOP`, `formatearPrecio` y `formatearPrecioConSufijo` para Pesos Colombianos, eliminando instancias dispersas de `Intl.NumberFormat`.
2. **Componente Global de Muestra de Color (`MuestraColor.vue`):**
   * Encapsulación del círculo de muestra cromática con relieve, sombra suave (`shadow-md`), anillo perimetral (`ring-1 ring-black/20`) y elevación en z-index (`z-10`) para asegurar nitidez incluso en colores muy claros (`#F4F3F2`).
3. **Erradicación de Clases Arbitrarias (Directiva 8 de Diseño):**
   * Eliminación del color inline no estandarizado `bg-[#D62828]` en `TarjetaProductoPublico.vue`, reemplazándolo por el componente oficial `<Badge estado="descuento">`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS Y PENDIENTES

| ID Criterio | Criterio de Aceptación | Estado | Método de Validación |
| :--- | :--- | :---: | :--- |
| **CA-DET-01** | La calculadora solo debe ser accesible en productos clasificados como pintura. | ✅ **CUMPLIDO** | `v-if="esPintura"` en botón y componente modal de `VistaDetalleProductoPublico.vue`. |
| **CA-DET-02** | No deben mostrarse muestras de color duplicadas en la vista previa del producto. | ✅ **CUMPLIDO** | Deduplicación por `id_color` en `todosLosColores` y corte a 6 items con botón `+N más`. |
| **CA-PAL-01** | Las tarjetas de producto en la Paleta de Colores deben reflejar el círculo del color elegido. | ✅ **CUMPLIDO** | Binding `:muestra-color="colorSeleccionado?.muestra_hex"` y renderizado con `<MuestraColor>`. |
| **CA-CORE-01** | Formateo de moneda y muestras de color centralizadas en `src/core/`. | ✅ **CUMPLIDO** | Creación de `moneda.ts`, `MuestraColor.vue` y actualización de `index.ts`. |
| **CA-DET-PEND** | Culminación integral de la ficha técnica y opciones restantes de Detalle de Producto. | ⏳ **PENDIENTE** | En desarrollo continuo para próximas versiones menores. |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Design System y Core Layouts (`src/core/`):** Requiere `LayoutHome.vue`, tokens de color de `colors.ts`, `Button`, `Badge` y utilidades de moneda.
- **Backend API (`M01/M02`):** Consume endpoints `/catalogo/publico/productos` y `/catalogo/publico/productos/:id`.

### B. Dependencias Hacia Adelante
- **M07 Carrito de Compras:** La selección de color y presentación en detalle de producto habilita la futura adición de la variante precisa al carrito.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `frontend/src/core/utils/moneda.ts` | Utilidad oficial de formateo de moneda COP (`formatearCOP`, `formatearPrecio`, `formatearPrecioConSufijo`). |
| **[NUEVO]** | `frontend/src/core/utils/index.ts` | Barril de utilidades globales del Core. |
| **[NUEVO]** | `frontend/src/core/components/data-display/MuestraColor.vue` | Componente reutilizable del Design System para muestras circulares de color. |
| **[MODIFICADO]** | `frontend/src/core/components/index.ts` | Exportación de `MuestraColor` en la sección de presentación de datos. |
| **[MODIFICADO]** | `frontend/src/core/components/data-display/Badge.vue` | Incorporación de variantes semánticas `descuento` y `destacado`. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaProductoPublico.vue` | Integración de `<Badge>`, `<MuestraColor>` y utilidades de moneda del Core. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue` | Lógica `esPintura`, previa limpia de 6 colores con `+N más`, sincronización de query param y formateo Core. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaPaletaColoresPublica.vue` | Binding `:muestra-color` hacia tarjetas y paso de `query: { color }` en navegación. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Registro formal de la versión `v3.35.2`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `[ ✅ SÍ (v3.35.2) ]`
* **Pruebas de Calidad Superadas (QA Gate):** `[ ✅ SÍ (ESLint 0 errores, vue-tsc/vite build 0 errores) ]`
* **Estado de Finalización del Detalle de Producto:** `[ ⚠️ AVANCE PRELIMINAR - EN PROGRESO ]`
