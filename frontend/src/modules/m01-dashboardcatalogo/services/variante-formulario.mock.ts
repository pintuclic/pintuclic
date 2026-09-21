import type {
  DetalleEdicionVariante,
  FormularioVariante,
  OpcionesFormularioVariante,
} from '../interfaces';
import { GALERIA_PRODUCTO_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE VARIANTE
 * Ubicación: src/modules/m01-dashboardcatalogo/services/variante-formulario.mock.ts
 *
 * Refleja las maquetas "ADMIN 07 - Crear variante" y "ADMIN 08 - Editar
 * variante" (ejemplo: "Viniltex Advanced · 1 galón · Blanco Nieve"), acotada a
 * los campos reales del backend (CrearVarianteDto). El store usa estos datos
 * mientras el backend no expone los endpoints.
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_VARIANTE_DEMO: OpcionesFormularioVariante = {
  productos: [
    { valor: 'viniltex-advanced', etiqueta: 'Viniltex Advanced', marca: 'Pintuco', linea: 'Pinturas interiores', requierePresentacion: true, requiereColor: true },
    { valor: 'pintura-acrilica-premium', etiqueta: 'Pintura Acrílica Premium', marca: 'Pintuco', linea: 'Premium', requierePresentacion: true, requiereColor: true },
    { valor: 'brocha-premium', etiqueta: 'Brocha Premium 3"', marca: 'Pintuco', linea: 'Profesional', requierePresentacion: false, requiereColor: false },
    { valor: 'taladro-20v', etiqueta: 'Taladro Inalámbrico 20V', marca: 'DeWalt', linea: '20V MAX', requierePresentacion: false, requiereColor: false },
  ],
  presentaciones: [
    { valor: '1-4-galon', etiqueta: '1/4 galón' },
    { valor: '1-galon', etiqueta: '1 galón' },
    { valor: '5-galones', etiqueta: '5 galones' },
    { valor: 'unidad', etiqueta: 'Unidad' },
  ],
  bases: [
    { valor: 'blanco', etiqueta: 'Blanco' },
    { valor: 'base-1', etiqueta: 'Base 1' },
    { valor: 'base-2', etiqueta: 'Base 2' },
    { valor: 'base-3', etiqueta: 'Base 3' },
  ],
  colores: [
    { id: 'col-amarillo-profundo', nombre: 'Amarillo Profundo', codigo: 'AP-001', hex: '#F4C430', familia: 'Amarillos' },
    { id: 'col-blanco-nieve', nombre: 'Blanco Nieve', codigo: 'BN-001', hex: '#F1F1F1', familia: 'Blancos' },
    { id: 'col-azul-oceano', nombre: 'Azul Océano', codigo: 'AO-012', hex: '#0A5BD3', familia: 'Azules' },
    { id: 'col-rojo-carmesi', nombre: 'Rojo Carmesí', codigo: 'RC-015', hex: '#C42B2B', familia: 'Rojos' },
    { id: 'col-verde-olivo', nombre: 'Verde Olivo', codigo: 'VO-008', hex: '#5A7D2A', familia: 'Verdes' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioVarianteVacio(): FormularioVariante {
  return {
    productoId: null,
    presentacionId: null,
    baseId: null,
    colorId: null,
    codigoProveedor: '',
    precioVigente: null,
    existenciaReferencial: null,
    imagenes: [],
    estado: 'borrador',
  };
}

/** Variante de ejemplo para el modo "editar" (la de la maqueta ADMIN 08). */
export const FORMULARIO_VARIANTE_DEMO: FormularioVariante = {
  productoId: 'viniltex-advanced',
  presentacionId: '1-galon',
  baseId: 'blanco',
  colorId: 'col-blanco-nieve',
  codigoProveedor: 'VIN-ADV-100',
  precioVigente: 89900,
  existenciaReferencial: 24,
  imagenes: [
    { id: 'img-1', url: GALERIA_PRODUCTO_DEMO.frontal, nombre: 'viniltex-advanced-1g.jpg', orden: 0, esPrincipal: true },
  ],
  estado: 'activo',
};

/** Datos de solo-edición de la maqueta "ADMIN 08" (movimientos, rotación). */
export const EDICION_VARIANTE_DEMO: DetalleEdicionVariante = {
  movimientos: [
    { id: 'mov-1', fechaHora: '2025-05-27T10:24:00-05:00', tipo: 'salida', cantidad: -3, usuario: 'Laura Gómez' },
    { id: 'mov-2', fechaHora: '2025-05-26T16:42:00-05:00', tipo: 'entrada', cantidad: 10, usuario: 'María Torres' },
    { id: 'mov-3', fechaHora: '2025-05-25T11:03:00-05:00', tipo: 'salida', cantidad: -2, usuario: 'Juan Pérez' },
    { id: 'mov-4', fechaHora: '2025-05-24T09:32:00-05:00', tipo: 'entrada', cantidad: 8, usuario: 'Carlos Álvarez' },
    { id: 'mov-5', fechaHora: '2025-05-22T14:18:00-05:00', tipo: 'ajuste', cantidad: 1, usuario: 'Laura Gómez' },
  ],
  rotacion: 'alta',
  rotacionComparativa: 32,
  disponibilidadPorcentaje: 96,
  tiendasConStock: 24,
  tiendasTotales: 25,
};
