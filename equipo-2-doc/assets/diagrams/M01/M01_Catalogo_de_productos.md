# PINTU CLIC
## Documento de Flujo y Arquitectura
### Módulo M01 — Catálogo de productos

**Versión:** 8.0  
**Basado en:** Análisis de Requisitos — Tanda 1 (v8.0) y Diagramas Funcionales (Draw.io)  
**Estado:** Documento que consolida los flujos de gestión de catálogo, marcas, líneas, productos, colores, bases y atributos técnicos.

---

## 1. Propósito y alcance
Este documento define el flujo funcional del módulo **M01 (Catálogo de productos)** de Pintu Clic, integrando los diagramas de comportamiento para el registro y validación de categorías, marcas, líneas, colores, bases, productos y sus atributos técnicos.

### 1.1. Alcance (Específico M01)
**Incluye:**
*   HU-CAT-01: Gestión de categorías y subcategorías (máximo 2 niveles).
*   HU-CAT-11: Gestión de líneas (asociadas a una marca).
*   HU-CAT-04: Gestión de marcas.
*   HU-CAT-12: Gestión de bases y su relación con el entonado de colores.
*   HU-CAT-05: Gestión de colores (CIELAB) y carga masiva.
*   HU-CAT-02: Gestión de productos y sus tipos de resina.
*   HU-CAT-10: Atributos técnicos del producto (ej. rendimiento, rangos).
*   HU-CAT-03: Gestión de variantes (producto + presentación + [base/color]).

**No incluye (Bloqueado/Fuera de alcance):**
*   HU-CAT-09: Eliminación física de entidades (se manejan con baja lógica/desactivación).
*   Definición exacta de número de bases por fabricante (pendiente).
*   Definición exacta del origen del valor CIELAB (pendiente).

---

## 2. Flujo Funcional: Categorías y Subcategorías (HU-CAT-01)

El sistema soporta únicamente dos niveles (Categoría raíz y Subcategoría). La eliminación física está prohibida; se maneja mediante desactivación en cascada.

```mermaid
flowchart TD
    OP{"¿Qué operación?"}
    OP -->|"Crear / editar"| T{"¿Categoría o subcategoría?"}
    
    %% Flujo Categoría
    T -->|"Categoría"| C1{"¿Nombre válido y ≤ 100 caracteres?"}
    C1 -->|"No"| E1["Impedir e indicar el dato que falta"]
    C1 -->|"Sí"| C2{"¿Nombre único en el nivel raíz?"}
    C2 -->|"No"| E2["Rechazar: categoría duplicada"]
    C2 -->|"Sí"| OK1["Guardar categoría"]
    
    %% Flujo Subcategoría
    T -->|"Subcategoría"| SP["Seleccionar la categoría padre (solo nivel 1)"]
    SP --> S0{"¿Se eligió una categoría padre válida?"}
    S0 -->|"No"| E3["Impedir: la subcategoría exige una categoría padre"]
    S0 -->|"Sí"| S1{"¿Nombre indicado y ≤ 100 caracteres?"}
    S1 -->|"No"| E3b["Impedir e indicar el dato que falta"]
    S1 -->|"Sí"| S2{"¿Nombre único bajo esa misma categoría padre?"}
    S2 -->|"No"| E4["Rechazar: duplicada bajo el mismo padre (se admite bajo padres distintos)"]
    S2 -->|"Sí"| OK2["Guardar subcategoría"]
    
    %% Flujo Desactivar
    OP -->|"Desactivar"| DT{"¿Categoría o subcategoría?"}
    
    DT -->|"Categoría"| D1["Contar los productos que dejarán de verse"]
    D1 --> D2["Advertir al administrador antes de confirmar"]
    D2 --> D3{"¿Confirma?"}
    D3 -->|"No"| FIN1["Cancelar"]
    D3 -->|"Sí"| D4["Desactivar la categoría y en cascada sus subcategorías"]
    D4 --> D5["Los productos sin subcategoría activa salen del catálogo público"]
    
    DT -->|"Subcategoría"| DS1["Contar los productos que dejarán de verse por esta subcategoría"]
    DS1 --> DS2["Advertir al administrador"]
    DS2 --> DS3{"¿Confirma?"}
    DS3 -->|"No"| FIN2["Cancelar"]
    DS3 -->|"Sí"| DS4["Desactivar la subcategoría"]
    DS4 --> DS5["Los productos que conserven otra subcategoría activa siguen en el catálogo público"]
```

---

## 3. Flujo Funcional: Marcas y Líneas (HU-CAT-04 y HU-CAT-11)

Las líneas comerciales pertenecen siempre a una marca. Al desactivar una marca, todo lo que dependa de ella se desactiva en cascada.

```mermaid
flowchart TD
    %% Flujo Marcas
    OP_M{"¿Operación de Marca?"}
    OP_M -->|"Crear / editar"| V{"¿Nombre y logotipo presentes?"}
    V -->|"No"| EM1["Impedir e indicar el dato que falta"]
    V -->|"Sí"| F{"¿El logotipo cumple formato y peso?"}
    F -->|"No"| EM2["Rechazar la imagen"]
    F -->|"Sí"| UM{"¿Nombre de marca único?"}
    UM -->|"No"| EM3["Rechazar: marca duplicada"]
    UM -->|"Sí"| OKM["Guardar marca"]
    
    OP_M -->|"Desactivar"| DM1["Desactivar en cascada: productos, líneas, colores, bases y campañas"]
    
    %% Flujo Líneas
    OP_L{"¿Operación de Línea?"}
    OP_L -->|"Crear / editar"| SM["Seleccionar la marca (debe existir)"]
    SM --> M{"¿Se eligió una marca válida?"}
    M -->|"No"| EL0["Impedir: la línea debe asociarse a una marca"]
    M -->|"Sí"| NL{"¿Nombre indicado?"}
    NL -->|"No"| EL1["Impedir e indicar el dato que falta"]
    NL -->|"Sí"| UL{"¿Nombre único dentro de esa marca?"}
    UL -->|"No"| EL2["Rechazar: línea duplicada en la marca"]
    UL -->|"Sí"| PR{"¿La línea del producto pertenece a la marca del producto?"}
    PR -->|"No"| EL3["Rechazar: línea de otra marca"]
    PR -->|"Sí"| OKL["Guardar línea"]
    
    OP_L -->|"Desactivar"| DL1["Advertir cuántos productos y reglas M06 dependen"]
    DL1 --> DL2{"¿Confirma?"}
    DL2 -->|"Sí"| DL3["Desactivar línea"]
```

---

## 4. Flujo Funcional: Bases, Entonado y Colores (HU-CAT-12 y HU-CAT-05)

El sistema maneja los colores a través del valor cromático CIELAB. En productos entonables, la base no la elige el cliente, se deriva del color deseado.

### 4.1 Administración de Bases y Entonado
```mermaid
flowchart TD
    OP{"¿Operación sobre bases?"}
    
    OP -->|"1. Registrar base"| SM["Seleccionar la marca"]
    SM --> M{"¿Nombre/código y tipo de resina presentes?"}
    M -->|"Sí"| U{"¿Nombre único en la marca?"}
    U -->|"Sí"| OKB["Guardar base"]
    
    OP -->|"2. Asignar bases a producto"| SPR["Seleccionar producto entonable"]
    SPR --> R{"¿Base es de la misma marca y resina?"}
    R -->|"Sí"| OKP["Declarar bases que ofrece el producto"]
    
    OP -->|"3. Asociar colores a bases"| Q{"¿Base declarada por fabricante o decidida al mezclar?"}
    Q -->|"Declarada"| V1["Asociar y validar combinación permitida"]
    Q -->|"Decidida"| V2["Sistema solo sugiere la base"]
    
    %% Entonado en la compra
    A["Cliente consulta producto entonable"] --> BUILD["Construir carta del producto"]
    BUILD --> FIL{"¿El color tiene base activa disponible?"}
    FIL -->|"No"| EXC["No incluir en la carta"]
    FIL -->|"Sí"| SHOW["Incluir en la carta"]
    SHOW --> SEL["Cliente elige color (NUNCA BASE)"]
    SEL --> RES["Sistema determina base a consumir"]
    RES --> REG["Registrar en orden: variante de base + color"]
```

### 4.2 Administración de Colores
```mermaid
flowchart TD
    OP_C{"¿Operación de Colores?"}
    OP_C -->|"Registrar individual"| M_C{"¿Nombre comercial presente?"}
    M_C -->|"Sí"| U_C{"¿Nombre y código únicos en la marca?"}
    U_C -->|"Sí"| LAB{"¿Valor CIELAB presente?"}
    LAB -->|"No"| E_LAB["Impedir: CIELAB es obligatorio"]
    LAB -->|"Sí"| GEN["Guardar y generar muestra visual desde CIELAB"]
    GEN --> FAM["Asignar familia cromática"]
    
    OP_C -->|"Carga Masiva"| BULK["Cargar miles de colores desde CSV/SAMIT"]
    
    OP_C -->|"Desactivar"| USO{"¿Cómo se usa el color?"}
    USO -->|"Producto de color fijo"| DV["Desactivar esas variantes"]
    USO -->|"Producto entonable"| DC["Retirar de la carta; la base sigue activa"]
```

---

## 5. Flujo Funcional: Productos y Atributos Técnicos (HU-CAT-02 y HU-CAT-10)

Los productos tienen una clase (`entonable`, `colores fijos`, `sin color`) que dicta qué atributos se les exigen. Además, pueden tener atributos técnicos independientes como el rendimiento.

### 5.1 Creación de Productos
```mermaid
flowchart TD
    OP{"¿Operación de Producto?"}
    OP -->|"Crear / editar"| N0{"¿Nombre presente?"}
    N0 -->|"Sí"| B1{"¿Marca y ≥1 subcategoría?"}
    B1 -->|"Sí"| CLASE{"¿Clase declarada?"}
    CLASE -->|"Entonable/Fijo"| SL["Exigir línea y tipo de resina"]
    CLASE -->|"Sin color"| B3["Línea y resina opcionales"]
    SL --> B2{"¿Indicados?"}
    B2 & B3 --> CH{"¿Se cambia la clase y ya tiene variantes?"}
    CH -->|"Sí"| E4["Impedir: retirar variantes primero"]
    CH -->|"No"| OK["Guardar producto padre"]
    
    OP -->|"Publicar"| PUB{"¿Tiene ≥1 variante activa y ≥1 imagen?"}
    PUB -->|"Sí"| OKP["Publicar en catálogo público"]
```

### 5.2 Atributos Técnicos (Rendimiento)
```mermaid
flowchart TD
    OP_A{"¿Operación de Atributos?"}
    OP_A -->|"1. Catálogo de atributos"| DEF["Registrar atributo con unidad de medida"]
    DEF --> REND["Rendimiento: m² por galón/mano (min y max)"]
    
    OP_A -->|"2. Asignar a producto"| PICK["Elegir atributos aplicables al producto"]
    PICK --> ISR{"¿Es el rendimiento?"}
    
    ISR -->|"No"| UNIT{"¿Usa la unidad declarada?"}
    UNIT -->|"Sí"| SAVEA["Guardar atributo"]
    
    ISR -->|"Sí"| VV{"¿Rendimiento > 0 y min ≤ max?"}
    VV -->|"Sí"| TP{"¿Cifra única o rango?"}
    TP -->|"Cifra única"| R1["Guardar min = max"]
    TP -->|"Rango"| R2["Guardar extremos"]
    
    R1 & R2 --> DERIV["Derivar rendimiento de cada presentación según su volumen"]
    DERIV --> TRACE["Conservar rendimiento usado en la línea de compra"]
    
    SAVEA & DERIV --> FICHA["Mostrar en ficha refiriéndose a la presentación elegida y advirtiendo que es aproximado"]
```
