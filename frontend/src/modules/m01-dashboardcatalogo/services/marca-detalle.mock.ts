import type { DetalleAdministrativoMarca } from '../interfaces';
import { LOGO_MARCA_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL DETALLE ADMINISTRATIVO DE MARCA
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marca-detalle.mock.ts
 *
 * Refleja la maqueta "ADMIN 14 - Detalle de marca" (ejemplo: "Pintuco").
 * ==============================================================================
 */

export const DETALLE_MARCA_DEMO: DetalleAdministrativoMarca = {
  id: 'pintuco',
  nombre: 'Pintuco',
  estado: 'activa',
  eslogan: 'Líder en pinturas y soluciones para un mejor vivir',
  descripcion:
    'En Pintuco creemos en el poder del color para transformar la vida de las personas. Desarrollamos pinturas, recubrimientos y soluciones especializadas para el hogar, la industria y la construcción, con altos estándares de calidad, innovación y sostenibilidad. Nuestro propósito es proteger y embellecer todo lo que importa.',
  logoUrl: LOGO_MARCA_DEMO['pintuco'] ?? null,

  sitioWeb: 'https://www.pintuco.com',
  paisOrigen: 'Colombia',
  anioFundacion: 1954,
  tipoMarca: 'Fabricante',

  productosAsociados: 245,
  lineasComerciales: 12,
  coloresActivos: 186,
  basesAsociadas: 8,

  visibleEnTienda: true,
  apareceEnBusquedas: true,
  ordenVisualizacion: 1,
  actualizadoEn: '2025-05-27T10:24:00-05:00',
  actualizadoPor: 'Carlos Álvarez',

  lineas: [
    { id: 'viniltex-advanced', nombre: 'Viniltex Advanced', productos: 42, estado: 'activa' },
    { id: 'koraza', nombre: 'Koraza', productos: 36, estado: 'activa' },
    { id: 'aqualock', nombre: 'Aqualock', productos: 28, estado: 'activa' },
    { id: 'osel', nombre: 'Osel', productos: 21, estado: 'activa' },
    { id: 'pro-4000', nombre: 'Pro 4000', productos: 18, estado: 'inactiva' },
  ],
  colores: [
    { nombre: 'Blanco Puro', hex: '#FFFFFF', codigo: 'BL-001' },
    { nombre: 'Amarillo Profundo', hex: '#F2B705', codigo: 'AP-001' },
    { nombre: 'Azul Océano', hex: '#0A5BD3', codigo: 'AO-012' },
    { nombre: 'Rojo Carmesí', hex: '#C42B2B', codigo: 'RC-015' },
    { nombre: 'Verde Olivo', hex: '#5A7D2A', codigo: 'VO-008' },
    { nombre: 'Gris Moderno', hex: '#6C757D', codigo: 'GM-003' },
  ],
  productosDestacados: [
    { id: 'prd-001', nombre: 'Viniltex Advanced', precio: 89900 },
    { id: 'prd-006', nombre: 'Pintura Acrílica Premium', precio: 92900 },
    { id: 'prd-007', nombre: 'Viniltex Tradicional', precio: 28900 },
  ],
  bases: ['Base agua', 'Base solvente', 'Base universal', 'Base epóxica'],

  imagenes: [
    { id: 'img-1', nombre: 'Logo principal', tipo: 'imagen', url: LOGO_MARCA_DEMO['pintuco'] ?? '', peso: null },
    { id: 'img-2', nombre: 'Logo alternativo', tipo: 'imagen', url: LOGO_MARCA_DEMO['corona'] ?? '', peso: null },
    { id: 'img-3', nombre: 'Banner de marca', tipo: 'imagen', url: LOGO_MARCA_DEMO['viniltex'] ?? '', peso: null },
    { id: 'img-4', nombre: 'Imagen institucional', tipo: 'imagen', url: LOGO_MARCA_DEMO['sika'] ?? '', peso: null },
  ],
  documentos: [
    { id: 'doc-1', nombre: 'Guía de marca', tipo: 'documento', url: '#', peso: 'PDF · 4.2 MB' },
    { id: 'doc-2', nombre: 'Catálogo general', tipo: 'documento', url: '#', peso: 'PDF · 12.8 MB' },
    { id: 'doc-3', nombre: 'Material promocional', tipo: 'documento', url: '#', peso: 'ZIP · 28.5 MB' },
  ],
  historial: [
    { id: 'h-1', fechaHora: '2025-05-27T10:24:00-05:00', descripcion: 'Marca actualizada', usuario: 'Carlos Álvarez' },
    { id: 'h-2', fechaHora: '2025-05-20T15:10:00-05:00', descripcion: 'Se cambió el logo principal', usuario: 'Laura Gómez' },
    { id: 'h-3', fechaHora: '2025-05-12T09:00:00-05:00', descripcion: 'Se asoció la línea Aqualock', usuario: 'María Torres' },
    { id: 'h-4', fechaHora: '2025-04-30T11:45:00-05:00', descripcion: 'Marca creada', usuario: 'Carlos Álvarez' },
  ],
};

/** Devuelve la ficha de ejemplo (una sola en la semilla, se ajusta el `id`). */
export function detalleMarcaDemo(id: string): DetalleAdministrativoMarca {
  return { ...DETALLE_MARCA_DEMO, id };
}
