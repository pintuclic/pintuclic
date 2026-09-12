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
 * variante" (ejemplo: "Viniltex Advanced · 1 galón · Blanco Nieve"). El store
 * usa estos datos mientras el backend no expone los endpoints.
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_VARIANTE_DEMO: OpcionesFormularioVariante = {
  productos: [
    { valor: 'viniltex-advanced', etiqueta: 'Viniltex Advanced', sku: 'VIN-ADV-001', marca: 'Pintuco', linea: 'Pinturas interiores' },
    { valor: 'pintura-acrilica-premium', etiqueta: 'Pintura Acrílica Premium', sku: 'PIN-ACR-001', marca: 'Pintuco', linea: 'Premium' },
    { valor: 'brocha-premium', etiqueta: 'Brocha Premium 3"', sku: 'BRO-PRM-003', marca: 'Pintuco', linea: 'Profesional' },
    { valor: 'taladro-20v', etiqueta: 'Taladro Inalámbrico 20V', sku: 'TAL-20V-001', marca: 'DeWalt', linea: '20V MAX' },
  ],
  presentaciones: [
    { valor: '1-4-galon', etiqueta: '1/4 galón' },
    { valor: '1-galon', etiqueta: '1 galón' },
    { valor: '5-galones', etiqueta: '5 galones' },
    { valor: 'otra', etiqueta: 'Otra' },
  ],
  unidades: [
    { valor: 'galon', etiqueta: 'Galón' },
    { valor: 'litro', etiqueta: 'Litro' },
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
  impuestos: [
    { valor: '0', etiqueta: '0% (exento)' },
    { valor: '5', etiqueta: '5%' },
    { valor: '19', etiqueta: '19%' },
  ],
  bodegas: [
    { valor: 'bodega-norte', etiqueta: 'Bodega Norte' },
    { valor: 'bodega-sur', etiqueta: 'Bodega Sur' },
    { valor: 'bodega-central', etiqueta: 'Bodega Central' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioVarianteVacio(): FormularioVariante {
  return {
    productoId: null,
    presentacion: '',
    unidadMedida: '',
    base: '',
    colorId: null,
    sku: '',
    codigoProveedor: '',
    codigoBarras: '',
    precioVenta: null,
    precioReferencia: null,
    costoCompra: null,
    impuestoIva: 19,
    stockInicial: null,
    stockMinimo: null,
    bodegaId: null,
    pesoKg: null,
    altoCm: null,
    anchoCm: null,
    profundidadCm: null,
    notasLogisticas: '',
    imagenes: [],
    estado: 'borrador',
  };
}

/** Variante de ejemplo para el modo "editar" (la de la maqueta ADMIN 08). */
export const FORMULARIO_VARIANTE_DEMO: FormularioVariante = {
  productoId: 'viniltex-advanced',
  presentacion: '1-galon',
  unidadMedida: 'galon',
  base: 'blanco',
  colorId: 'col-blanco-nieve',
  sku: 'VIN-ADV-100-BN',
  codigoProveedor: 'VIN-ADV-100',
  codigoBarras: '7701234567890',
  precioVenta: 89900,
  precioReferencia: 0,
  costoCompra: 52300,
  impuestoIva: 19,
  stockInicial: 24,
  stockMinimo: 5,
  bodegaId: 'bodega-norte',
  pesoKg: 1.2,
  altoCm: 18,
  anchoCm: 16,
  profundidadCm: 16,
  notasLogisticas:
    'Disponible en todas las tiendas. Manejar con cuidado. Almacenar en lugar fresco y seco.',
  imagenes: [
    { id: 'img-1', url: GALERIA_PRODUCTO_DEMO.frontal, nombre: 'viniltex-advanced-1g.jpg', esPrincipal: true },
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
