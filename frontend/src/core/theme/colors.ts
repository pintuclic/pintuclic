/**
 * ==============================================================================
 * PALETA DE COLORES GLOBAL Y OFICIAL - PINTUCLIC DESIGN SYSTEM
 * ==============================================================================
 *
 * ⛔ REGLA DE ORO ESTRICTA:
 * Todo componente, vista o estilo en el frontend DEBE utilizar exclusivamente los
 * tokens de color definidos en este archivo y en Tailwind CSS.
 *
 * Queda TERMINANTEMENTE PROHIBIDO:
 * 1. Usar colores hexadecimales arbitrarios en clases (ej: bg-[#123456], text-[#000]).
 * 2. Usar colores por defecto de Tailwind no aprobados (ej: text-purple-500, bg-pink-400).
 * 3. Declarar variables CSS o estilos inline con colores que no pertenezcan a esta paleta.
 * ==============================================================================
 */

export const PINTUCLIC_COLORS = {
  // 1. Rol Corporativo: Títulos principales, precios, navegación
  corporate: {
    DEFAULT: '#002855',
    dark: '#002855',
  },

  // 2. Rol Acción: Botones primarios, enlaces, bordes activos, sliders
  action: {
    DEFAULT: '#0877E8',
    hover: '#0661BF',
  },

  // 3. Rol SubAcción: Botones secundarios de selección, subprocesos (ej. Calculadora)
  subaction: {
    DEFAULT: '#DAEEFC',
  },

  // 4. Rol Conversión: Botón "Agregar al Carrito", confirmaciones de compra
  conversion: {
    DEFAULT: '#41BF5A',
    hover: '#1B6D24',
    accent: '#3CB148',
  },

  // 5. Rol Destacado: Etiquetas de "Patrocinado", ofertas, alertas comerciales
  highlight: {
    DEFAULT: '#FFC107',
  },

  // 6. Rol Neutros: Superficies, fondos, bordes y tipografía
  neutral: {
    white: '#FFFFFF',    // Fondos de tarjetas, modales, superficies principales
    lightest: '#F7F8FA', // Gris Muy Claro: Fondos de página, fondo de imágenes de producto
    light: '#E5E7EB',    // Gris Claro: Bordes, divisores, sliders inactivos
    medium: '#6B7280',   // Gris Medio: Textos secundarios, descripciones, precios tachados
    dark: '#374151',     // Gris Oscuro: Texto general de cuerpo
    black: '#111827',    // Negro: Títulos de alta jerarquía, nombres de producto
  },
} as const;

export type PintuclicColors = typeof PINTUCLIC_COLORS;
