# REPORTE DE PARADA — Necesidad técnica de modificar archivos compartidos

> Emitido conforme a la **Directiva Crítica 3** de `AGENTS.md`: *«Si para completar una
> HU consideras necesario modificar un archivo compartido o externo a tu módulo, DEBES
> DETENER LA EJECUCIÓN INMEDIATAMENTE, no realizar ningún cambio y presentar un reporte
> detallado al equipo humano»*.

* **Módulo:** `M08 - Orden de venta` (Frontend)
* **Versión afectada:** `v3.31.0`
* **Rama:** `feature/m08-orden-venta`
* **Fecha:** `24/09/2026`
* **Estado:** ⛔ **EJECUCIÓN DETENIDA — pendiente de aprobación del Líder Técnico**

---

## 1. Resumen

La entrega `v3.31.0` está **completa y aislada**: todos los archivos viven dentro de
`frontend/src/modules/m08-ordenes/` y no se modificó ningún archivo de otro módulo.

Sin embargo, el módulo **no es alcanzable ni se muestra con la identidad visual
correcta** hasta que se aprueben dos cambios en archivos compartidos, descritos abajo.

---

## 2. Solicitud 1 — Registro de rutas en el enrutador central

* **Archivo:** `frontend/src/core/routes/index.ts`
* **Propietario:** Core / Líder Técnico
* **Impacto si no se aprueba:** las vistas existen en el repositorio pero **ninguna URL
  las alcanza**. La entrega queda como código inerte.

### Cambio solicitado (4 líneas)

```ts
import { ordenesRoutes } from '@/modules/m08-ordenes/m08-ordenes.routes';
```

Y dentro de los `children` de la ruta `'/'` (layout de tienda):

```ts
// M08: sección de pedidos del cliente
...ordenesRoutes,
```

### Justificación

Es el **punto de integración estándar** del proyecto: M01 se registra exactamente igual
(`...dashboardCatalogoRoutes`). No altera ninguna ruta existente; solo añade
`/pedidos` y `/pedidos/:codigo` como rutas hijas del layout público.

### Riesgo

Nulo para las rutas existentes. Las rutas añadidas no colisionan con ninguna ya
registrada.

---

## 3. Solicitud 2 — Token de color para estados de error y alerta

* **Archivo:** `frontend/src/style.css` (bloque `@theme`) y, por coherencia,
  `frontend/src/core/theme/colors.ts`
* **Propietario:** Core / Diseño
* **Impacto si no se aprueba:** ya resuelto en esta entrega mediante una degradación
  visual; ver §3.3.

### 3.1 La inconsistencia detectada

Hay una **contradicción entre dos documentos normativos** del propio repositorio:

| Documento | Qué dice |
| :--- | :--- |
| `AGENTS.md`, directiva 8 y `frontend/infraestructura.md` §4.2 | La paleta obligatoria tiene **13 tokens**: `corporate`, `action`, `subaction`, `conversion` (+ hover, accent), `highlight` y los `neutral-*`. **No incluye ningún rojo.** |
| Guía de Identidad Visual oficial (documento de diseño, §11 «Uso semántico del color») | Define explícitamente un rojo para **«Error, alerta o descuento»** |

M08 necesita representar dos situaciones que la paleta de 13 tokens no cubre:

1. El estado **`cancelado`** de un pedido.
2. El **descuento** en el resumen de la compra (importe que se resta).

### 3.2 Cambio solicitado (si se aprueba)

```ts
// frontend/src/core/theme/colors.ts
danger: {
  DEFAULT: '#E63946',
  hover:   '#D62828',
  subtle:  '#FDEDEE',
},
```

Con su correspondiente declaración en el bloque `@theme` de `src/style.css`.

Estos valores **no son inventados**: son los que ya utiliza la rama
`feature/m01-backend-catalogo-publico`, donde el token `danger` existe con exactamente
esos códigos.

### 3.3 Solución provisional aplicada en esta entrega

Para **no incumplir la directiva 8**, el módulo se entrega usando únicamente los 13
tokens aprobados:

| Elemento | Token provisional | Consecuencia |
| :--- | :--- | :--- |
| Estado `cancelado` | `bg-neutral-lightest` + `text-neutral-dark` | Se confunde visualmente con el estado `pendiente` |
| Aviso de cancelación | `bg-neutral-lightest` + `text-neutral-dark` | Pierde jerarquía de alerta |
| Línea de descuento | `text-neutral-dark` | No se distingue del subtotal |
| Aviso de error de carga | `bg-neutral-lightest` | No se distingue de un aviso informativo |

Si se aprueba el token, revertir la degradación es un cambio de una línea en
`dtos/estado-pedido.dto.ts` y tres clases en dos componentes.

---

## 4. Solicitud 3 — Utilidad tipográfica `font-title` (informativa)

No se solicita ningún cambio. Se documenta por trazabilidad.

La Guía de Identidad Visual establece **Poppins para títulos e Inter para cuerpo**. En
esta rama, `src/style.css` ya aplica Poppins automáticamente a `h1`–`h6`, de modo que
los encabezados del módulo cumplen la guía sin necesidad de clase alguna.

Para elementos que **no son encabezados** pero que el diseño muestra en Poppins (por
ejemplo el importe total), no existe utilidad aprobada. Se han dejado con la tipografía
de cuerpo. La rama `feature/m01-backend-catalogo-publico` define una utilidad
`font-title`; si el equipo decide adoptarla globalmente, el módulo puede acogerse a ella
sin cambios estructurales.

---

## 5. Observación adicional — fuera del alcance de M08

Detectado durante las pruebas, se reporta por si procede abrir incidencia:

`frontend/src/core/layouts/LayoutHome.vue` contiene un `watchEffect` que redirige a
`/admin` a todo usuario cuyo rol sea administrador o empleado. El efecto es que esos
roles **no pueden acceder a ninguna vista pública de la tienda**, incluida la sección de
pedidos. No es un problema introducido por M08 y no se ha modificado nada al respecto.

---

## 6. Decisión requerida

| # | Solicitud | Archivo | Decisión |
| :-- | :--- | :--- | :--- |
| 1 | Registrar las rutas de M08 | `core/routes/index.ts` | ☐ Aprobar ☐ Rechazar |
| 2 | Añadir el token `danger` | `core/theme/colors.ts` + `style.css` | ☐ Aprobar ☐ Rechazar |
| 3 | Resolver la contradicción entre `AGENTS.md` §8 y la Guía de Identidad §11 | — | ☐ Pendiente |

Sin la aprobación de la solicitud 1, la entrega `v3.31.0` **no es funcional para el
usuario final**, aunque el código esté completo y probado.
