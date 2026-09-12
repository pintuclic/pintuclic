/**
 * ==============================================================================
 * M01 - IMÁGENES DEL CATÁLOGO (ilustraciones de la maqueta)
 * Ubicación: src/modules/m01-dashboardcatalogo/assets/imagenes-catalogo.ts
 *
 * Ilustraciones SVG planas que reproducen las fotos de producto de los mockups
 * "ADMIN 02/03/06". Se resuelven como URL con Vite y las consumen las semillas
 * (`services/*.mock.ts`) para poblar `imagenUrl`, `imagenes[].url` y `logoUrl`.
 * Al conectar el backend real estas rutas se reemplazan por las del CDN.
 * ==============================================================================
 */
import viniltexAdvanced from './productos/viniltex-advanced.svg';
import viniltexAdvancedLateral from './productos/viniltex-advanced-lateral.svg';
import ambienteSala from './productos/ambiente-sala.svg';
import brochaPremium from './productos/brocha-premium.svg';
import cintaEnmascarar from './productos/cinta-enmascarar.svg';
import rodilloProfesional from './productos/rodillo-profesional.svg';
import taladro20v from './productos/taladro-20v.svg';
import pinturaAcrilica from './productos/pintura-acrilica.svg';
import viniltexTradicional from './productos/viniltex-tradicional.svg';
import impermeabilizanteEler from './productos/impermeabilizante-eler.svg';

import logoPintuco from './marcas/pintuco.svg';
import logoCorona from './marcas/corona.svg';
import logoSika from './marcas/sika.svg';
import logoViniltex from './marcas/viniltex.svg';
import logo3m from './marcas/3m.svg';
import logoRustOleum from './marcas/rust-oleum.svg';
import logoFlex from './marcas/flex.svg';
import logoTak from './marcas/tak.svg';

/** Imagen principal por `id` de producto de la semilla `productos.mock.ts`. */
export const IMAGEN_PRODUCTO_DEMO: Record<string, string> = {
  'prd-001': viniltexAdvanced,
  'prd-002': brochaPremium,
  'prd-003': cintaEnmascarar,
  'prd-004': rodilloProfesional,
  'prd-005': taladro20v,
  'prd-006': pinturaAcrilica,
  'prd-007': viniltexTradicional,
  'prd-008': impermeabilizanteEler,
};

/** Galería del formulario "ADMIN 03" (Viniltex Advanced Amarillo Profundo). */
export const GALERIA_PRODUCTO_DEMO = {
  frontal: viniltexAdvanced,
  lateral: viniltexAdvancedLateral,
  ambiente: ambienteSala,
};

/** Logo por `id` de marca de la semilla `marcas.mock.ts`. */
export const LOGO_MARCA_DEMO: Record<string, string> = {
  pintuco: logoPintuco,
  corona: logoCorona,
  sika: logoSika,
  viniltex: logoViniltex,
  '3m': logo3m,
  'rust-oleum': logoRustOleum,
  flex: logoFlex,
  tak: logoTak,
};
