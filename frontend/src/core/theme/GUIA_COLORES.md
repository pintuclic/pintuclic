# 🎨 Sistema de Colores Globales - PINTUCLIC

> **Ubicación de Definición:** [`src/core/theme/colors.ts`](./colors.ts)  
> **Configuración Tailwind:** [`tailwind.config.ts`](../../../tailwind.config.ts)  
> **Estado:** Oficial y Obligatorio para todo el Frontend.

---

## ⛔ DIRECTIVA ESTRICTA DE DISEÑO (Zero Tolerance)

> 🚨 **PROHIBICIÓN ABSOLUTA DE COLORES ARBITRARIOS:**  
> Queda terminantemente PROHIBIDO para cualquier desarrollador humano o Agente de Inteligencia Artificial (IA):
> 1. Utilizar valores hexadecimales arbitrarios en clases de Tailwind (ej: `bg-[#002855]`, `text-[#333]`).
> 2. Utilizar nombres de colores por defecto de Tailwind que no formen parte de la identidad aprobada (ej: `bg-purple-600`, `text-red-400`, `bg-pink-500`).
> 3. Emplear estilos inline (`style="color: ..."`).
>
> **Todo color DEBE ser invocado a través de las clases de tokens semánticos oficiales detalladas en la siguiente tabla.**

---

## 📋 Matriz Oficial de Tokens y Clases Tailwind

| Rol de Negocio | Nombre | HEX | Clases de Fondo | Clases de Texto | Clases de Borde | Aplicación Principal |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Corporativo** | Azul Oscuro | `#002855` | `bg-corporate` | `text-corporate` | `border-corporate` | Títulos principales, precios, navegación, header. |
| **Acción** | Azul Vivo | `#0877E8` | `bg-action` | `text-action` | `border-action` | Botones primarios, enlaces, bordes activos, sliders. |
| **SubAcción** | Azul Claro | `#DAEEFC` | `bg-subaction` | `text-subaction` | `border-subaction` | Botones secundarios de selección, subprocesos (Calculadora). |
| **Conversión** | Verde Principal | `#41BF5A` | `bg-conversion` | `text-conversion` | `border-conversion` | Botón "Agregar al Carrito", confirmaciones de compra. |
| **Conversión (Hover)** | Verde Oscuro | `#1B6D24` | `bg-conversion-hover` | `text-conversion-hover` | `border-conversion-hover` | Estado hover de botones de compra/conversión. |
| **Conversión (Acento)**| Verde Acento | `#3CB148` | `bg-conversion-accent`| `text-conversion-accent`| `border-conversion-accent`| Variantes de conversión o estados activos. |
| **Destacado** | Amarillo | `#FFC107` | `bg-highlight` | `text-highlight` | `border-highlight` | Etiquetas de "Patrocinado", ofertas, badges promocionales. |
| **Neutros: Blanco** | Blanco Puro | `#FFFFFF` | `bg-neutral-white` o `bg-white` | `text-neutral-white` | `border-neutral-white` | Fondos de tarjetas, modales, superficies principales. |
| **Neutros: Gris Muy Claro** | Gris Fondo | `#F7F8FA` | `bg-neutral-lightest` | `text-neutral-lightest` | `border-neutral-lightest` | Fondo general de página, fondos de fotos de producto. |
| **Neutros: Gris Claro** | Gris Bordes | `#E5E7EB` | `bg-neutral-light` | `text-neutral-light` | `border-neutral-light` | Bordes, separadores, divisores, sliders inactivos. |
| **Neutros: Gris Medio** | Gris Secundario | `#6B7280` | `bg-neutral-medium` | `text-neutral-medium` | `border-neutral-medium` | Textos secundarios, descripciones, precios tachados. |
| **Neutros: Gris Oscuro**| Gris Cuerpo | `#374151` | `bg-neutral-dark` | `text-neutral-dark` | `border-neutral-dark` | Texto general de lectura, párrafos de cuerpo. |
| **Neutros: Negro** | Negro Títulos | `#111827` | `bg-neutral-black` | `text-neutral-black` | `border-neutral-black` | Títulos de alta jerarquía (H1, H2), nombres de producto. |

---

## 💻 Ejemplos de Implementación Recomendados

### 1. Botón de Compra / Conversión con Hover
```html
<button class="bg-conversion hover:bg-conversion-hover text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
  Agregar al Carrito
</button>
```

### 2. Botón Primario de Acción
```html
<button class="bg-action hover:bg-action/90 text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Continuar
</button>
```

### 3. Botón Secundario de Selección (SubAcción)
```html
<button class="bg-subaction text-corporate hover:bg-subaction/80 font-medium px-3 py-1.5 rounded-md transition-colors">
  Seleccionar paredes
</button>
```

### 4. Tarjeta de Producto con Badge Destacado
```html
<article class="bg-neutral-white border border-neutral-light rounded-xl p-4 shadow-sm">
  <div class="relative bg-neutral-lightest rounded-lg p-6 flex justify-center items-center">
    <span class="absolute top-2 left-2 bg-highlight text-neutral-black text-xs font-bold px-2 py-0.5 rounded">
      OFERTA
    </span>
    <img src="/paints/viniltex.png" alt="Pintura Viniltex" class="h-40 object-contain" />
  </div>
  <h3 class="text-neutral-black font-bold text-lg mt-3">Viniltex Avanzado</h3>
  <p class="text-neutral-medium text-sm mt-1">Máxima lavabilidad y cubrimiento superior.</p>
  <div class="mt-3 flex items-baseline gap-2">
    <span class="text-corporate font-extrabold text-xl">$85.900</span>
    <span class="text-neutral-medium text-sm line-through">$105.000</span>
  </div>
</article>
```
