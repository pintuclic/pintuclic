## 2. Historias de Usuario (HUs) Cubiertas

### HU-CAT-14 — Un catálogo que se entiende sin saber de pintura

**Historia:** Como cliente que no sabe de pintura, quiero que el catálogo esté organizado por lo que voy a pintar y con palabras que entienda, para llegar al producto correcto sin conocer marcas ni términos técnicos.

**Alcance cubierto en esta entrega:**

* Se mejora la navegación del catálogo desde el menú responsive de Productos.
* Se permite acceder a las categorías disponibles.
* Se implementa la navegación desde una categoría hacia sus subcategorías.
* Se permite acceder posteriormente al catálogo correspondiente a la subcategoría seleccionada.

**Flujo implementado:**

`Productos → Categorías → Categoría → Subcategorías → Catálogo filtrado`

También se mantiene la posibilidad de acceder directamente al catálogo completo mediante:

`Productos → Ver todos los productos → Catálogo completo`

---

### HU-BUS-02 — Filtros del catálogo

**Historia:** Como visitante, quiero refinar los resultados combinando varios filtros a la vez, para reducir una lista larga a las pocas opciones que realmente me sirven.

**Alcance cubierto en esta entrega:**

* Se ajusta la navegación hacia catálogos filtrados mediante la selección de categorías y subcategorías.
* La selección de una subcategoría conduce al catálogo correspondiente con el filtro aplicado.

**Nota:** La implementación de filtros múltiples debe validarse contra el alcance completo definido en la HU-BUS-02. En esta entrega se documenta específicamente el flujo de filtrado derivado de categoría y subcategoría.

---

### HU-CAT-10 — Atributos técnicos del producto

**Historia:** Como administrador del catálogo, quiero registrar los datos técnicos de cada producto, y en particular cuánto rinde, para que el cliente sepa qué esperar del producto y la calculadora pueda decirle cuánto comprar.

**Alcance cubierto en esta entrega:**

* Se corrige el flujo de acceso a la calculadora de pintura.
* Cuando el usuario ingresa desde Home o Productos, la calculadora funciona como una página completa y permite realizar el cálculo general antes de seleccionar un producto.
* Cuando el usuario ingresa desde el detalle de un producto, la calculadora funciona como modal y utiliza el producto seleccionado como referencia.

**Flujos implementados:**

`Home / Productos → Calculadora completa → Cálculo → Buscar / elegir producto`

`Detalle de producto → Calculadora → Modal → Resultado para el producto → Regresar / continuar`

---

### Alcance general de las HUs

Las HUs anteriores se documentan únicamente respecto a los comportamientos implementados o ajustados en esta entrega.

Las demás HUs pertenecientes al catálogo M01 permanecen fuera del alcance de esta implementación al no haberse realizado cambios relacionados con ellas.
