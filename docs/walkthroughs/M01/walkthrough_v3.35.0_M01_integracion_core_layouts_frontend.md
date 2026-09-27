# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> Guardar obligatoriamente en `docs/walkthroughs/M[XX]/` con el sufijo de capa técnica **al final del nombre**:  
> - **Frontend:** `walkthrough_v3.35.0_M01_integracion_core_layouts_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.35.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Dashboard y Catálogo de Productos (Frontend Storefront)`
* **Fecha de Entrega:** `16/09/2026`
* **Autor / Responsable:** `Desarrollador Frontend Senior (Agente IA)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-06** | Consulta y Navegación Pública del Catálogo y Paleta de Colores | **100% Cumplida** | `VistaInicioPublica.vue`, `VistaCatalogoPublico.vue`, `VistaDetalleProductoPublico.vue`, `VistaPaletaColoresPublica.vue` |
| **HU-BUS-02** | Búsqueda y Filtrado de Productos en Tienda Pública | **100% Cumplida** | `MenuCategoriasPublico.vue`, `TarjetaProductoPublico.vue`, `TarjetaCombinacionColoresPublica.vue` |
| **N/A (Core)** | Estandarización e Integración Oficial con Core Layouts y Design System | **100% Cumplida** | `LayoutHome.vue`, `LayoutAdmin.vue`, `dashboard-catalogo.routes.ts`, `core/routes/index.ts` |

### Descripción del Alcance de la Versión
Esta entrega culmina la unificación arquitectónica y estética de la tienda pública de Pintu Clic (`M01`) con la rama maestra del Core (`feature/core-frontend-layouts`).
Se erradicó completamente la duplicación de cabeceras y pies de página mediante la adopción del layout unificado `LayoutHome.vue`, configurando todas las vistas del Storefront como rutas anidadas (`children: publicStorefrontRoutes`).
Asimismo, se normalizó el sistema tipográfico institucional (Poppins para jerarquía de títulos y precios, Inter para lectura y botones), se migraron componentes hacia los primitivos oficiales del Core (`Button`, `Modal`, `Paginacion`), y se validó la compilación estricta y linteo sin errores ni advertencias.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE DISEÑO APLICADAS

### A. Reglas de Arquitectura y Diseño Frontend
- **Tipografía Oficial del Sistema:** Aplicación estricta de `font-title` (Poppins) para títulos principales H1, H2, nombres de productos destacados y cifras de precios. Uso de `font-sans` (Inter) para párrafos, campos de formulario y botones de interacción.
- **Rutas Anidadas (`children`):** Las vistas del Storefront público son hijas directas del layout `/` (`LayoutHome.vue`) con rutas relativas (`''`, `'catalogo'`, `'productos/:productoId'`, `'paleta-colores'`). Las vistas de administración de catálogo se anidan bajo `/admin` (`LayoutAdmin.vue`).
- **Erradicación de Duplicados (Caso 1):** Eliminación física de `EncabezadoTiendaPublica.vue` y `PieTiendaPublica.vue`.
- **Integración de Componentes de Dominio (Caso 2):** Los componentes especializados (`CalculadoraPinturaPublica`, `TarjetaProductoPublico`, etc.) preservan su lógica de negocio de catálogo mientras consumen los componentes oficiales del Core (`<Modal>`, `<Button>`).

### B. Políticas Transversales Validadas
- 🎨 **Design System Pintu Clic (Directiva 8):** Tokens oficiales aplicados (`corporate`, `action`, `conversion`, `neutral-*`). Sin clases arbitrarias ni colores hexadecimales inline no estandarizados.
- 📐 **Arquitectura de DTOs (Directiva 12):** Cero esquemas inline dentro de plantillas o vistas Vue.
- 🧹 **Calidad de Código (Directiva 11):** 0 errores de compilación TypeScript (`vue-tsc -b`) y 0 errores/warnings en ESLint.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 M01 Storefront — Integración de Layouts y Vistas Públicas

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CORE-01** | La navegación de la tienda pública debe delegarse al `LayoutHome` del Core con cabecera y pie globales unificados. | Inspección de `VistaInicioPublica.vue`, `VistaCatalogoPublico.vue`, `VistaDetalleProductoPublico.vue` y `VistaPaletaColoresPublica.vue` sin cabeceras locales. | ✅ **CUMPLIDO** |
| **CA-CORE-02** | Las rutas del módulo deben exportarse modularmente y anidarse como `children` de sus layouts correspondientes. | Verificación en `dashboard-catalogo.routes.ts` y montaje en `frontend/src/core/routes/index.ts`. | ✅ **CUMPLIDO** |
| **CA-CORE-03** | Los componentes duplicados de cabecera y pie deben ser retirados del repositorio. | Ejecución de `git rm` sobre `EncabezadoTiendaPublica.vue` y `PieTiendaPublica.vue`. | ✅ **CUMPLIDO** |
| **CA-CORE-04** | Los modales de la tienda deben usar el componente `<Modal>` del Core. | Verificación en `CalculadoraPinturaPublica.vue` con `<Modal :accent="true" max-width="2xl">`. | ✅ **CUMPLIDO** |
| **CA-CORE-05** | Las fuentes institucionales deben seguir la especificación oficial (Poppins en títulos/precios, Inter en texto). | Auditoría de clases `font-title` en nombres de producto, precios destacados y títulos de sección. | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Módulo Core Layouts (`feature/core-frontend-layouts`):** Requiere de `LayoutHome.vue`, `LayoutAdmin.vue`, `HeaderPrincipal.vue`, `FooterPrincipal.vue` y los tokens cromáticos definidos en `frontend/src/core/theme/colors.ts`.
- **M02 Catálogo y Productos (Backend):** Requiere de los endpoints de productos, categorías y facetas para la carga dinámica de catálogo.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **M07 Carrito y M08 Órdenes:** Habilita el flujo continuo de usuario desde la exploración del catálogo y detalle de producto hacia la adición al carrito y compra.
- **M04 Cuentas y Auth:** Permite que los enlaces del header unificado conecten fluidamente con los modales o vistas de login/registro de usuarios.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[ELIMINADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/EncabezadoTiendaPublica.vue` | Header duplicado retirado en favor de `HeaderPrincipal` del Core. |
| **[ELIMINADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/PieTiendaPublica.vue` | Footer duplicado retirado en favor de `FooterPrincipal` del Core. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/dashboard-catalogo.routes.ts` | Modularización de `publicStorefrontRoutes` y `adminCatalogoRoutes` con rutas relativas. |
| **[MODIFICADO]** | `frontend/src/core/routes/index.ts` | Configuración de `/` con `LayoutHome` y `/admin` con `LayoutAdmin` usando rutas anidadas. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaInicioPublica.vue` | Remoción de header/footer locales, aplicación de `font-title` a títulos de secciones. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaCatalogoPublico.vue` | Remoción de header/footer locales, integración de `<Paginacion>` oficial y `font-title`. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue` | Remoción de header/footer locales, aplicación de `font-title` a producto y precio. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/views/VistaPaletaColoresPublica.vue` | Remoción de header/footer locales, corrección de bindings reactivos de paleta. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaProductoPublico.vue` | Uso de `<Button>` del Core y tipografía `font-title` en títulos y precios. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/CalculadoraPinturaPublica.vue` | Migración de modal local a `<Modal>` oficial del Core. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/CartaColoresProductoPublica.vue` | Tipografía institucional `font-title` en encabezados y títulos de carta. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/MenuCategoriasPublico.vue` | Tipografía institucional `font-title` en título de categorías. |
| **[MODIFICADO]** | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaCombinacionColoresPublica.vue` | Tipografía institucional `font-title` en título de combinaciones. |
| **[MODIFICADO]** | `frontend/src/core/components/buttons/Button.vue` | Soporte retrocompatible para variantes `primary`, `secondary`, `green`, `danger`, `google`, `ghost`. |
| **[MODIFICADO]** | `frontend/src/core/components/data-display/Table.vue` | Tipado robusto con defaults para `rowKey` compatible con `vue-tsc`. |
| **[MODIFICADO]** | `frontend/src/core/components/index.ts` | Exportación oficial de `FooterPrincipal`. |
| **[MODIFICADO]** | `frontend/src/core/layouts/LayoutHome.vue` | Rutas de navegación conectadas a `/catalogo` y `/paleta-colores`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Registro de versión `v3.35.0` con detalle técnico de cambios. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `[ ✅ SÍ ]`
* **Pruebas de Calidad Superadas (QA Gate):** `[ ✅ SÍ (ESLint 0 errores, vue-tsc/vite 0 errores) ]`
* **Apego a la Arquitectura y Directivas:** `[ ✅ 100% Conforme a AGENTS.md ]`
