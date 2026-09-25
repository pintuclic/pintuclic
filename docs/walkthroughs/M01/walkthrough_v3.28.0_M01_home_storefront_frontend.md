# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

- **Versión Generada:** `v3.28.0`
- **Tipo de Incremento:** `MINOR`
- **Módulo de Origen:** `M01 - Catálogo de Productos`
- **Capa:** Frontend
- **Fecha de Entrega:** `12/09/2026`
- **Autor / Responsable:** Agente IA Codex
- **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS`

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-06** | Consulta pública del catálogo | **Home público completo; HU parcial** | Home responsive, buscador, destacados, categorías y modal de navegación |

### Descripción del alcance

Esta entrega inicia las vistas públicas del storefront con el Home de escritorio y su adaptación responsive. La pantalla consume los endpoints públicos de M01 sin requerir autenticación, evita datos de catálogo hardcodeados y muestra estados explícitos de carga, vacío y error. El menú de categorías replica el segundo diseño suministrado y filtra productos por subcategoría.

Quedan expresamente fuera de esta versión las vistas de catálogo completo, ficha de producto, selector cromático, producto no disponible y sus variantes móviles específicas. Se implementarán conforme se reciban sus diseños.

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

### Reglas de negocio

- Los datos visibles provienen de `GET /api/catalogo/publico/categorias` y `GET /api/catalogo/publico/productos`.
- La portada solicita una página de máximo cinco productos; nunca descarga el catálogo completo (`RNF-CAT-06-01`).
- Cada producto destacado solicita su ficha pública para obtener precio vigente e imagen sin duplicar contratos ni inventar valores.
- El buscador normaliza y valida una consulta de máximo 120 caracteres mediante un DTO Zod dedicado.
- Si el backend no está disponible, la interfaz informa el error y permite reintentar; no sustituye la respuesta con mocks.

### Políticas transversales

- **HU-SEG-03 / HU-ADM-03:** La vista y sus endpoints son explícitamente públicos; la UI no simula permisos administrativos.
- **HU-SEG-06:** Se consumen únicamente los DTO públicos mínimos definidos por M01.
- **Origen único de datos:** No se añadieron catálogos, productos ni categorías hardcodeados en TypeScript.
- **Design System:** Todos los colores de UI usan exclusivamente tokens `corporate`, `action`, `subaction`, `conversion`, `highlight` y `neutral-*`.
- **DTOs:** La validación del buscador vive en `dtos/catalogo-publico.dto.ts`; no existen esquemas inline en archivos Vue.

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| ID | Validación realizada | Resultado |
| :--- | :--- | :---: |
| **CA-CAT-06-01** | El Home consulta categorías y productos sin solicitar sesión. | ✅ **CUMPLIDO EN HOME** |
| **CA-CAT-06-02** | Selección de color/presentación y precio correspondiente. | ⏳ **PENDIENTE DE FICHA** |
| **CA-CAT-06-03** | Mensaje al acceder a producto inactivo. | ⏳ **PENDIENTE DE FICHA** |
| **CA-CAT-06-04** | La navegación usa el endpoint que solo devuelve categorías con productos activos/publicados. | ✅ **CUMPLIDO** |
| **CA-CAT-06-05** | La portada solicita únicamente la primera página con límite cinco. | ✅ **CUMPLIDO** |
| **CA-CAT-06-06** | Carta cromática cargada por familia. | ⏳ **PENDIENTE DE BACKEND Y DISEÑO** |

## 5. DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### Dependencias hacia atrás

- **Backend M01:** Requiere disponibles los endpoints `/api/catalogo/publico/categorias`, `/productos` y `/productos/:id`.
- **Imágenes:** El backend devuelve `contenido_url`, pero el walkthrough previo indica que el binario aún puede exigir permiso; backend debe habilitar su lectura pública para mostrar imágenes reales sin sesión.
- **Contrato de flujo:** La especificación referencia `docs/assets/diagrams/M01/HU-CAT-06.png`, archivo ausente. El Product Owner autorizó usar la especificación y las capturas aportadas como contrato temporal.
- **Rutas globales:** El Product Owner aprobó sustituir la vista M02 que ocupaba `/` por el Home público M01.

### Dependencias hacia adelante

- **M04 Cuentas:** Habilitará la acción “Mi cuenta / Iniciar sesión”.
- **M07 Carrito:** Habilitará contador, resumen y acción “Agregar al carrito”.
- **Siguientes vistas HU-CAT-06:** Catálogo, ficha, carta cromática y estados de no disponibilidad reutilizarán los contratos y servicios creados aquí.

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Acción | Ruta | Propósito |
| :---: | :--- | :--- |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/views/VistaInicioPublica.vue` | Home público responsive |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/MenuCategoriasPublico.vue` | Modal dinámico de categorías |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaProductoPublico.vue` | Tarjeta conectada a ficha/precio/imagen |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/composables/useInicioPublico.ts` | Estado y orquestación del Home |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/services/catalogo-publico.service.ts` | Cliente de endpoints públicos M01 |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/dtos/catalogo-publico.dto.ts` | Validación Zod del buscador |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/interfaces/catalogo-publico.interface.ts` | Contratos TypeScript públicos |
| NUEVO | `frontend/src/modules/m01-dashboardcatalogo/assets/storefront/hero-storefront.png` | Banner del storefront sin texto incrustado |
| MODIFICADO | `frontend/src/modules/m01-dashboardcatalogo/dashboard-catalogo.routes.ts` | Registro de la ruta pública `/` dentro de M01 |
| MODIFICADO (APROBADO) | `frontend/src/core/routes/index.ts` | Sustitución de la ruta raíz M02 por la ruta M01 |
| MODIFICADO | `docs/CHANGELOG.md` | Registro ejecutivo de `v3.28.0` |

El cambio preexistente en `docker-compose.dev.yml` no pertenece a esta implementación y se excluye de su commit.

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

- **Incremento registrado en `CHANGELOG.md`:** ✅ SÍ
- **TypeScript / build:** ✅ `npm run build`
- **ESLint:** ✅ `npm run lint`
- **Validación visual:** ✅ Home y modal inspeccionados en navegador local
- **Apego al alcance:** ✅ Home entregado; resto de HU-CAT-06 declarado pendiente
- **Aislamiento:** ✅ Código funcional dentro de M01; único cambio global aprobado en rutas
