# PINTU CLIC
## Documento de Flujo y Arquitectura
### Módulo M02 — Búsqueda y navegación

**Versión:** 8.0  
**Basado en:** Análisis de Requisitos — Tanda 1 (v8.0) y Diagramas Funcionales (Draw.io)  
**Estado:** Documento que consolida los flujos de búsqueda, filtros y ordenamiento del catálogo según reglas de negocio definidas.

---

## 1. Propósito y alcance
Este documento define el flujo funcional y comportamiento del módulo **M02 (Búsqueda y navegación)** de Pintu Clic, integrando los diagramas de comportamiento del usuario al interactuar con el buscador, los filtros multielección y el ordenamiento de resultados.

### 1.1. Alcance (Específico M02)
**Incluye:**
*   Búsqueda de productos por texto libre sin autenticación (HU-BUS-01).
*   Manejo de errores, bloqueos de caracteres especiales y resiliencia del buscador (HU-BUS-01, HU-BUS-06).
*   Filtros del catálogo multielección (HU-BUS-02).
*   Ordenamiento de resultados (HU-BUS-03).
*   Paginación (HU-BUS-05 - mencionado en análisis).
*   Registro de búsquedas sin resultado y su consulta por administradores (HU-BUS-06).

**No incluye (Bloqueado/Fuera de alcance):**
*   Prioridad de patrocinio en resultados (HU-BUS-04 - bloqueado por M14).

---

## 2. Flujo Funcional: Búsqueda de Productos

El siguiente diagrama detalla la interacción principal de un usuario (logueado o no logueado) con el buscador de productos de Pintu Clic.

```mermaid
flowchart TD
    %% Entidades principales
    User([Usuario]) --> |Navega sin login requerido| Buscador[Usuario usa el buscador de productos]
    
    %% Flujo buscador vacío
    Buscador --> CondVacio{Buscador vacío?}
    CondVacio -- "Sí" --> MuestraTodo[Se muestra todo el catálogo]
    CondVacio -- "No" --> CondCarEspecial{Ingresó carácter especial?}
    
    %% Flujo de caracteres especiales
    CondCarEspecial -- "Sí" --> Bloqueo[Bloqueador se activa: No deja ingresar carácter especial]
    CondCarEspecial -- "No" --> CondFalla{Buscador falla?}
    
    %% Flujo de falla del buscador
    CondFalla -- "Sí" --> FallaError[Sucedió un error]
    CondFalla -- "No" --> CondEncontrado{Característica, producto o color\nse encuentra en el catálogo?}
    
    %% Resultados de búsqueda
    CondEncontrado -- "Sí" --> MuestraResultado[Se muestra en el catálogo]
    CondEncontrado -- "No" --> NoEncontrado[Producto o color no se encontró]

    %% Flujo secundario de falla de buscador y credenciales (parte 2 del diagrama original)
    FallaError -.-> FallaSistema{Buscador falla?}
    FallaSistema -- "Sí" --> ErrorSistema[Sucedió un error]
    FallaSistema -- "No" --> IngresoCred[Ingreso de credenciales]
    IngresoCred --> CredValida{Credenciales válidas?}
```

### 2.1 Reglas de Búsqueda (HU-BUS-01)
*   **Acceso Público:** Se permite la búsqueda sin autenticación previa (RF-BUS-01-01).
*   **Búsqueda Vacía:** Si el término está vacío, se muestra el catálogo completo (RF-BUS-01-01).
*   **Procesamiento:** La búsqueda y el filtrado se resuelven en el servidor, no en el navegador (RF-BUS-01-02).
*   **Alcance:** Busca en nombre, marca, línea, color y descripción, ignorando mayúsculas y acentos (RF-BUS-01-03).
*   **Prevención de Errores Técnicos:** Si el servicio falla, se debe redirigir al inicio e informar sin exponer códigos de error técnicos, manteniendo el sitio operativo (RF-BUS-01-06).

---

## 3. Flujo Funcional: Filtro de Productos

El siguiente diagrama muestra el proceso cuando un usuario aplica filtros al catálogo.

```mermaid
flowchart TD
    User([Usuario]) --> |Navega sin login requerido| UsaFiltro{Usuario usa filtro?}
    
    UsaFiltro -- "No" --> SinCambios[No hay cambios visuales en el catálogo]
    UsaFiltro -- "Sí" --> FiltroMulti[Filtro multielección]
    
    %% Tipos de filtro
    FiltroMulti --> Categoria[Categoría]
    FiltroMulti --> Subcategoria[Subcategoría]
    FiltroMulti --> Marca[Marca]
    FiltroMulti --> Linea[Línea]
    FiltroMulti --> TipoResina[Tipo de resina]
    FiltroMulti --> Color[Color]
    FiltroMulti --> Acabado[Acabado]
    FiltroMulti --> RangoPrecio[Rango de precio]
    FiltroMulti --> Simultaneo[Aplicables de forma simultánea]
    
    %% Aplicación y resultados
    Categoria & Subcategoria & Marca & Linea & TipoResina & Color & Acabado & RangoPrecio & Simultaneo --> MuestraFiltros[Se muestran resultados relacionados con el filtro]
    
    MuestraFiltros --> ModificaFiltros{Usuario aplica nuevos filtros\no quita filtros}
    
    ModificaFiltros -- "No" --> MantieneFiltro[No hay cambios visuales con los filtros ya aplicados]
    ModificaFiltros -- "Sí" --> NuevosResultados[Se muestran los resultados relacionados con el nuevo filtro]
    
    NuevosResultados --> AplicaPrecio{Se aplica filtro por rango de precio?}
    
    AplicaPrecio -- "No" --> SinCambiosPrecio[No se muestran cambios extra]
    AplicaPrecio -- "Sí" --> CondDescuento{Hay productos en descuento\nque entren en el rango?}
    
    CondDescuento -- "No" --> FiltroNormal[Sucede el filtro con normalidad]
    CondDescuento -- "Sí" --> IncluyeDesc[Se incluye el producto en este rango de precio]
```

### 3.1 Reglas de Filtros (HU-BUS-02)
*   **Multifiltro:** Se pueden combinar filtros por categoría, marca, línea, resina, color y rango de precio simultáneamente (RF-BUS-02-01).
*   **Opciones Válidas:** Los filtros solo muestran valores que produzcan resultados en la vista actual (RF-BUS-02-02).
*   **Resultados por Producto:** Los filtros devuelven productos padre, no variantes individuales (RF-BUS-02-03).
*   **Descuentos y Precios:** El rango de precios aplica sobre el *precio final con descuentos* para el usuario actual y con IVA incluido (RF-BUS-02-04). El diagrama confirma que si hay productos en descuento que entren en el rango, deben incluirse.

---

## 4. Flujo Funcional: Orden de Resultados

El diagrama ilustra el flujo de ordenamiento de los resultados obtenidos tras una búsqueda o filtrado.

```mermaid
flowchart TD
    User([Usuario]) --> |Navega sin login requerido| BuscaFiltra[Usuario usa el buscador o el filtro]
    BuscaFiltra --> Resultados[Resultado de la búsqueda o filtro]
    
    Resultados --> UsaOrden{Usuario usa filtro de\norden de resultados?}
    
    UsaOrden -- "No" --> MantieneOrden[No sucede nada fuera de la búsqueda o filtro aplicado]
    UsaOrden -- "Sí" --> Novedad[Novedad]
    UsaOrden -- "Sí" --> MenorMayor[De menor a mayor]
    UsaOrden -- "Sí" --> MayorMenor[De mayor a menor]
    UsaOrden -- "Sí" --> Alfabetico[Ordenar alfabéticamente]
    
    Novedad & MenorMayor & MayorMenor & Alfabetico --> MuestraOrden[Se muestra el resultado del filtro de orden de resultados]
```

### 4.1 Reglas de Ordenamiento (HU-BUS-03)
*   **Criterios Base:** El usuario puede cambiar el orden entre relevancia, precio ascendente (menor a mayor), precio descendente (mayor a menor) y novedad (RF-BUS-03-01). *Nota: El diagrama también contempla un ordenamiento alfabético.*
*   **Cálculo de Relevancia:** Orden por coincidencia exacta vs aproximada priorizando: nombre, marca, línea, color y descripción (RF-BUS-03-02).
*   **Desempate:** En caso de igual relevancia, se desempatan por nombre del producto para evitar saltos (RF-BUS-03-03).

---

## 5. Flujo Funcional: Consultar Estadísticas (Búsquedas sin resultado)

Este flujo pertenece a un panel administrativo donde se registran y auditan las búsquedas fallidas de los usuarios, útil para detectar carencias en el catálogo.

```mermaid
flowchart TD
    %% Actores
    Usuario([Usuario visitante]) --> |Navega sin login| UsaBuscador{Usuario usó el buscador?}
    
    UsaBuscador -- "No" --> Nada[No sucede nada]
    UsaBuscador -- "Sí" --> Encuentra{Búsqueda se encontró en el catálogo?}
    
    Encuentra -- "Sí" --> BusquedaNormal[Sucede como una búsqueda normal]
    BusquedaNormal --> VistaCat[Actualiza la vista de catálogo con los resultados]
    
    Encuentra -- "No" --> NoDisponible[Sale mensaje de producto o color no disponible]
    NoDisponible --> HistorialInterno[Se crea historial internamente y se envía a BD]
    HistorialInterno --> ModuloAdmin[Esto se mostrará en el módulo de consultar estadística del perfil Admin]

    %% Flujo Administrador
    Admin([Admin]) --> |Login requerido / Permisos de visualización| NavEstadisticas[Navegando en el módulo de consultar estadística]
    
    NavEstadisticas --> HayRegistros{Hay registros de búsqueda sin resultado?}
    
    HayRegistros -- "No" --> MensajeVacio[Muestra mensaje que no hay nada para informar]
    HayRegistros -- "Sí" --> ModuloGeneral[Visualiza todo el módulo en general de registros sin resultado]
    
    ModuloGeneral --> AplicaFiltroAdmin{Usuario aplica algún filtro temporal?}
    
    AplicaFiltroAdmin -- "No" --> SinFiltroAdmin[No aplica filtros]
    AplicaFiltroAdmin -- "Sí" --> FDiario[Diario]
    AplicaFiltroAdmin -- "Sí" --> FSemanal[Semanal]
    AplicaFiltroAdmin -- "Sí" --> FMensual[Mensual]
    AplicaFiltroAdmin -- "Sí" --> FAnual[Anual]
    
    FDiario & FSemanal & FMensual & FAnual --> MuestraFiltroAdmin[Se muestra filtro aplicado en registros de búsqueda sin resultado]
```

### 5.1 Reglas de Búsquedas sin Resultado (HU-BUS-06)
*   **Registro Anónimo:** Se guardan los términos que no arrojan resultados, agrupados por repetición y fecha, **sin identificar a quien buscó** (RF-BUS-06-01).
*   **Acceso Restringido:** El reporte y filtrado por periodos (diario, semanal, mensual, anual) se reserva para usuarios con el permiso administrativo *«Consultar estadísticas»* (RF-BUS-06-02).
