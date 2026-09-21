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
  logoUrl: LOGO_MARCA_DEMO['pintuco'] ?? null,

  productosAsociados: 245,
  lineasComerciales: 12,
  coloresActivos: 186,

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
  productosPatrocinados: [
    { id: 'prd-001', nombre: 'Viniltex Advanced', precio: 89900 },
    { id: 'prd-006', nombre: 'Pintura Acrílica Premium', precio: 92900 },
    { id: 'prd-007', nombre: 'Viniltex Tradicional', precio: 28900 },
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
