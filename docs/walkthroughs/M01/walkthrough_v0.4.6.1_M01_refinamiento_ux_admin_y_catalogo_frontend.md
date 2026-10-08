# WALKTHROUGH DE IMPLEMENTACIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> Guardar obligatoriamente en `docs/walkthroughs/M[XX]/` con el sufijo de capa técnica **al final del nombre**:  
> - **Frontend:** `walkthrough_v0.4.6.1_M01_refinamiento_ux_admin_y_catalogo_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.6.1`
* **Módulo de Origen:** `M01 Catálogo de Productos / Core Frontend / M17 Permisos y Administración / M08 Órdenes`
* **Fecha de Entrega:** `08/10/2026`
* **Autor / Responsable:** `Agente de IA Antigravity & Equipo de Ingeniería Pintu Clic`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ADM-03** | Control de Acceso y Gestión de Permisos Granulares | **100% Cumplida** | `src/core/components/forms/SearchableSelect.vue`<br>`src/modules/m17-permisos/views/Permissions.vue` |
| **HU-CAT-01** | Categorías y Subcategorías Jerárquicas | **100% Cumplida** | `src/modules/m01-catalogo/views/admin/VistaCategorias.vue` |
| **HU-CAT-02** | Catálogo de Productos y Navegación | **100% Cumplida** | `src/modules/m01-catalogo/views/admin/VistaProductos.vue`<br>`src/core/layouts/LayoutAdmin.vue` |
| **HU-CAT-03** | Variantes Vendibles y Presentaciones | **100% Cumplida** | `src/modules/m01-catalogo/views/admin/VistaVariantes.vue` |
| **HU-CAT-04** | Marcas, Líneas y Bases Tintométricas | **100% Cumplida** | `src/modules/m01-catalogo/views/admin/VistaMarcas.vue`<br>`src/modules/m01-catalogo/views/admin/VistaPorMarca.vue` |
| **HU-CAT-12** | Asignación de Productos Entonables a Bases | **100% Cumplida** | `src/modules/m01-catalogo/components/admin/ModalProductosBase.vue` (Convertido a Drawer) |
| **HU-ORD-05** | Bandeja de Gestión de Órdenes Administrativas | **100% Cumplida** | `src/modules/m08-ordenes/views/admin/VistaGestionOrdenes.vue`<br>`src/modules/m08-ordenes/components/admin/ModalCambiarEstado.vue` |

### Descripción del Alcance de la Versión
En este incremento de refinamiento de experiencia de usuario y arquitectura de interfaz (`v0.4.6.1`):
1. **Componente Global de Búsqueda Integrada (`SearchableSelect`):** Se diseñó e implementó en `src/core/components/forms/SearchableSelect.vue` un selector desplegable accesible con barra de búsqueda instantánea para listas extensas de opciones (empleados, permisos, productos, marcas). Dispone de normalización de cadenas (insensible a mayúsculas y acentos diacríticos), resaltado de opción seleccionada, teclado accesible (`Escape` para cerrar) y prevención de desbordamientos.
2. **Eliminación de Doble Tooltip y Desbordamiento en Tablas:** Se retiró el componente visual flotante `<Tooltip>` en `PeopleList.vue`, cuya posición absoluta forzaba desplazamiento horizontal indeseado y colisionaba con el tooltip nativo de los navegadores. En su lugar se estandarizó la prop `title` nativa en `IconButton.vue` para todas las acciones (`Bloquear acceso`, `Reactivar cliente`, `Ver ficha`, `Editar`).
3. **Ergonomía de Tablas (`Table.vue`):** Se eliminó la clase global `whitespace-nowrap` a nivel del tag `<table>`, permitiendo que las celdas de texto hagan salto de línea fluido (`break-words`), limitando `whitespace-nowrap` exclusivamente a columnas de acción alineadas a la derecha (`align="right"`).
4. **Reorganización Taxonómica en Navegación Administrativa (`LayoutAdmin.vue`):** En el Catálogo Central se dispuso la secuencia lógica de negocio **Productos $\rightarrow$ Variantes $\rightarrow$ Categorías**; en Configuración y Maestros se agregó el acceso directo a **Resinas y Presentaciones** (`/admin/catalogo/configuracion`) y se purgó la ruta/enlace huérfano de búsquedas de catálogo no implementado.
5. **Drawer Lateral con Buscador en Bases Tintométricas (`ModalProductosBase.vue`):** Sustitución del modal flotante estándar por un `Drawer` vertical de pantalla completa con barra de filtro reactiva para seleccionar los productos entonables asociados a cada base, garantizando ergonomía ante catálogos con decenas de referencias.
6. **Navegación de Retorno y Depuración Visual:** Se incorporó el botón `← Volver a Productos` en `VistaCatalogosBase.vue`, se corrigió el letrero `+ Subcategoría` (que generaba doble `+`) en `VistaCategorias.vue` y se limpiaron todos los identificadores técnicos de especificación interna (`HU-CAT-01`, `HU-CAT-02`, etc.) en los títulos y subtítulos de las vistas.
7. **Estandarización de Botones de Cancelar y Descartar:** Todos los botones secundarios de cancelar o descartar fueron homologados a `variant="neutral"` (gris suave corporativo), erradicando el uso equívoco de `variant="outline"` que los renderizaba con apariencia azul activa.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Regla 1 (Taxonomía y Jerarquía de Catálogo):** La navegación central agrupa entidades en el orden de mayor a menor jerarquía comercial (Producto maestro $\rightarrow$ Variante vendible $\rightarrow$ Categorías organizativas).
- **Regla 2 (Asociación Estricta de Bases Tintométricas):** Solo los productos con `clase_color = 'entonable'` y de la misma marca pueden ser asignados a una base (`RF-CAT-12-02`, `RF-CAT-12-03`).
- **Regla 3 (Consistencia Semántica de Acciones UI):** Las acciones destructivas o de reversión deben usar tonos neutrales de cancelación (`variant="neutral"`) o tonos de advertencia (`danger`), nunca tonos primarios de acción que confundan al operador administrativo.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Hashing y Credenciales (`HU-SEG-01`):** Mantenido en factor de costo 12 en backend.
- 🛡️ **M17 - Autorización en Servidor (`HU-ADM-03`):** Toda acción administrativa (cambio de permisos, actualización de catálogos, ciclo de vida de órdenes) valida el token de sesión y permiso individual en el servidor.
- 🆔 **M04 - Unicidad de Identidad (`HU-CUE-08`):** Unicidad estricta mantenida en tablas de usuarios.
- 👁️ **M20 - Mínima Exposición (`HU-SEG-06`):** Respuestas de endpoints no retornan campos sensibles.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 M17 / UI Core: Selectores con Buscador Integrado y Acciones de Tabla

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-UX-01** | **Dado que** un selector contiene decenas de registros (empleados, permisos, productos)...<br>**Cuando** el usuario abre el selector y digita un término...<br>**Entonces** el selector filtra en tiempo real sin recargar y permite selección inmediata con teclado/ratón. | Verificación interactiva de `SearchableSelect.vue` en `Permissions.vue` y `VistaVariantes.vue` | ✅ **CUMPLIDO** |
| **CA-UX-02** | **Dado que** el cursor pasa sobre botones de acción en filas de tablas (`IconButton`)...<br>**Cuando** se hace hover...<br>**Entonces** el navegador muestra el texto explicativo nativo vía `title` sin generar desbordamiento horizontal ni duplicidades visuales. | Inspección de `PeopleList.vue` y `IconButton.vue` | ✅ **CUMPLIDO** |
| **CA-UX-03** | **Dado que** una tabla contiene columnas de texto o contacto...<br>**Cuando** se visualiza en monitores de escritorio...<br>**Entonces** el texto se ajusta en saltos de línea (`break-words`) y no fuerza barra de desplazamiento horizontal a menos que el viewport sea inferior al límite de lectura. | Verificación de `Table.vue` con remoción de `whitespace-nowrap` | ✅ **CUMPLIDO** |

### 🔹 M01 Catálogo: Navegación, Drawer y Depuración Visual

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-01** | **Dado que** el administrador gestiona productos entonables asociados a una base...<br>**Cuando** pulsa «Productos que la ofrecen»...<br>**Entonces** se despliega un Drawer lateral de pantalla completa con buscador reactivo de productos. | Verificación de `ModalProductosBase.vue` con componente `Drawer` | ✅ **CUMPLIDO** |
| **CA-CAT-02** | **Dado que** el usuario ingresa a «Resinas y Presentaciones»...<br>**Cuando** desea regresar al catálogo general...<br>**Entonces** dispone de un botón directo «← Volver a Productos» que lo traslada sin perder contexto. | Verificación de navegación en `VistaCatalogosBase.vue` | ✅ **CUMPLIDO** |
| **CA-CAT-03** | **Dado que** un modal o formulario ofrece opción de descarte o cancelación...<br>**Cuando** se visualiza el botón de cancelar...<br>**Entonces** su estilo corresponde estrictamente a `variant="neutral"` sin tintes azules de acción primaria. | Revisión de `Configuration.vue`, `PersonDetail.vue` y `ModalCambiarEstado.vue` | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Módulo M17 (Permisos):** Requiere que los catálogos de permisos y usuarios sigan sirviéndose mediante `/api/v1/usuarios/empleados` y `/api/v1/seguridad/permisos/catalogo`.
- **Módulo M01 (Catálogo Backend):** Requiere los endpoints REST de CRUD para productos, categorías, subcategorías, marcas, líneas, bases tintométricas y colores CIELAB.
- **Base de Datos PostgreSQL:** Requiere el esquema v3.9 con las tablas maestras de catálogo pobladas según `seed_pintuclic.sql`.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Tienda Pública / Storefront (M01 / M02 / M05):** La asignación precisa de bases a productos entonables y la activación de variantes habilitan la preparación tintométrica y la venta en el storefront público.
- **Auditoría Interna y Monitoreo (M17 / M20):** La herramienta de búsqueda inversa de permisos (`¿Quién tiene este permiso?`) con `SearchableSelect` habilita revisiones de seguridad expeditas para los administradores.

---

## 6. ARCHIVOS MODIFICADOS Y CREADOS

### Frontend:
- `src/core/components/forms/SearchableSelect.vue` *(Nuevo)*: Componente global reutilizable de selección con buscador integrado.
- `src/core/components/index.ts`: Exportación de `SearchableSelect`.
- `src/core/components/buttons/IconButton.vue`: Añadida prop opcional `title` y vinculación `:title="title || label"`.
- `src/core/components/data-display/Table.vue`: Remoción de `whitespace-nowrap` a nivel tabla y soporte de wrap fluido.
- `src/core/layouts/LayoutAdmin.vue`: Reordenamiento de menú de catálogo (Productos $\rightarrow$ Variantes $\rightarrow$ Categorías), adición de Resinas/Presentaciones y eliminación de enlace huérfano a búsquedas.
- `src/core/routes/index.ts`: Eliminación de redirección huérfana de búsquedas.
- `src/modules/m17-permisos/views/Permissions.vue`: Integración de `SearchableSelect` en empleado y búsqueda inversa, y botón de descarte en `variant="neutral"`.
- `src/modules/m17-permisos/views/PeopleList.vue`: Retiro de `<Tooltip>` flotante y reemplazo por títulos nativos.
- `src/modules/m17-permisos/views/PersonDetail.vue`: Botón Cancelar actualizado a `variant="neutral"`.
- `src/modules/m17-permisos/views/Configuration.vue`: Botón Descartar cambios actualizado a `variant="neutral"`.
- `src/modules/m01-catalogo/views/admin/VistaCategorias.vue`: Eliminación del `+` duplicado en botón subcategoría y limpieza de subtítulo técnico.
- `src/modules/m01-catalogo/views/admin/VistaCatalogosBase.vue`: Adición de botón `← Volver a Productos` y limpieza de subtítulo.
- `src/modules/m01-catalogo/views/admin/VistaProductos.vue`: Limpieza de subtítulo técnico.
- `src/modules/m01-catalogo/views/admin/VistaVariantes.vue`: Integración de `SearchableSelect` para productos y limpieza de subtítulo.
- `src/modules/m01-catalogo/views/admin/VistaMarcas.vue`: Limpieza de subtítulo técnico.
- `src/modules/m01-catalogo/views/admin/VistaPorMarca.vue`: Integración de `SearchableSelect` para marcas y limpieza de descripciones con referencias HU.
- `src/modules/m01-catalogo/components/admin/ModalProductosBase.vue`: Transformación a `Drawer` con filtro reactivo de productos.
- `src/modules/m08-ordenes/views/admin/VistaGestionOrdenes.vue`: Limpieza de subtítulo técnico.
- `src/modules/m08-ordenes/components/admin/ModalCambiarEstado.vue`: Botón Cancelar actualizado a `variant="neutral"`.

### Control de Versiones:
- `.github/version.txt`: Actualizado a `0.4.6.1`.
- `docs/CHANGELOG.md`: Registrada la versión `v0.4.6.1`.
