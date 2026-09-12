import type { DetalleAdministrativoProducto } from '../interfaces';
import { GALERIA_PRODUCTO_DEMO, IMAGEN_PRODUCTO_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL DETALLE ADMINISTRATIVO DEL PRODUCTO
 * Ubicación: src/modules/m01-dashboardcatalogo/services/producto-detalle.mock.ts
 *
 * Refleja la maqueta "ADMIN 05 - Detalle administrativo del producto"
 * (ejemplo: "Viniltex Advanced Amarillo Profundo"). El store la usa como
 * respaldo mientras el backend no expone `GET /api/catalogo/productos/:id/detalle`.
 * ==============================================================================
 */

export const DETALLE_PRODUCTO_DEMO: DetalleAdministrativoProducto = {
  id: 'prd-001',
  nombre: 'Viniltex Advanced Amarillo Profundo',
  sku: 'VIN-ADV-001',
  descripcion:
    'Pintura premium a base de agua para paredes interiores. Máxima lavabilidad y activo antibacterial que elimina el 99.9% de las bacterias. Ideal para hogares, oficinas y espacios de alto tráfico.',
  estado: 'publicado',
  destacado: true,
  permitirOpiniones: true,

  marca: 'PintuClic',
  linea: 'Viniltex',
  categoria: 'Pinturas',
  subcategoria: 'Interiores',
  tipoProducto: 'Pintura acrílica',
  claseColor: 'colores_fijos',

  imagenes: [
    { id: 'img-1', url: GALERIA_PRODUCTO_DEMO.frontal, nombre: 'viniltex-advanced-frontal.jpg', esPrincipal: true },
    { id: 'img-2', url: GALERIA_PRODUCTO_DEMO.ambiente, nombre: 'ambiente-sala.jpg', esPrincipal: false },
    { id: 'img-3', url: GALERIA_PRODUCTO_DEMO.lateral, nombre: 'viniltex-advanced-lateral.jpg', esPrincipal: false },
    { id: 'img-4', url: IMAGEN_PRODUCTO_DEMO['prd-006'] ?? '', nombre: 'ambiente-cocina.jpg', esPrincipal: false },
    { id: 'img-5', url: IMAGEN_PRODUCTO_DEMO['prd-004'] ?? '', nombre: 'aplicacion-rodillo.jpg', esPrincipal: false },
  ],

  disponibleEnCatalogo: true,
  stockTotal: 50,
  variantesActivas: 12,
  variantesTotales: 12,

  precioBase: 39900,
  precioReferencia: 0,
  variacionPrecio: 0,
  variantes: { valor: 12, variacionPorcentaje: 20 },
  coloresAsociados: { valor: 6, variacionPorcentaje: 50 },
  combosRelacionados: 3,
  actualizadoEn: '2025-05-27T10:24:00-05:00',
  actualizadoPor: 'Carlos Álvarez',

  atributos: [
    { etiqueta: 'Tipo de acabado', valor: 'Mate' },
    { etiqueta: 'Rendimiento teórico', valor: '35 - 40 m² por galón' },
    { etiqueta: 'Tiempo de secado', valor: '1 hora al tacto / 4 horas entre manos' },
    { etiqueta: 'Dilución recomendada', valor: '10% con agua' },
    { etiqueta: 'Uso recomendado', valor: 'Interiores (hogar, oficinas, comercio)' },
  ],

  listaVariantes: [
    { id: 'var-1', presentacion: '1/4 galón', color: 'Amarillo', colorHex: '#F2B705', base: 'Blanco', stock: 36, estado: 'activo', precio: 28900 },
    { id: 'var-2', presentacion: '1 galón', color: 'Amarillo', colorHex: '#F2B705', base: 'Blanco', stock: 24, estado: 'activo', precio: 89900 },
    { id: 'var-3', presentacion: '5 galones', color: 'Amarillo', colorHex: '#F2B705', base: 'Blanco', stock: 8, estado: 'activo', precio: 399900 },
    { id: 'var-4', presentacion: '1 galón', color: 'Amarillo', colorHex: '#F2B705', base: 'Base P', stock: 12, estado: 'activo', precio: 92900 },
    { id: 'var-5', presentacion: '5 galones', color: 'Amarillo', colorHex: '#F2B705', base: 'Base P', stock: 6, estado: 'activo', precio: 419900 },
  ],

  basesDisponibles: ['Blanco', 'Base P', 'Base D', 'Base TR'],
  sistemaEntonado: 'PintuClic Color System',
  coloresDisponibles: [
    { nombre: 'Amarillo Profundo', hex: '#F2B705' },
    { nombre: 'Rojo Carmesí', hex: '#C42B2B' },
    { nombre: 'Azul Océano', hex: '#0A5BD3' },
    { nombre: 'Verde Olivo', hex: '#5A7D2A' },
    { nombre: 'Gris Moderno', hex: '#6C757D' },
  ],
  etiquetas: ['lavable', 'antibacterial', 'interior', 'premium', 'hogar', 'alta cobertura'],

  actividad: [
    { id: 'act-1', fechaHora: '2025-05-27T10:24:00-05:00', descripcion: 'Producto actualizado', usuario: 'Carlos Álvarez' },
    { id: 'act-2', fechaHora: '2025-05-25T18:20:00-05:00', descripcion: 'Precio de variante modificado', usuario: 'Laura Gómez' },
    { id: 'act-3', fechaHora: '2025-05-25T11:03:00-05:00', descripcion: 'Imagen agregada', usuario: 'Laura Gómez' },
    { id: 'act-4', fechaHora: '2025-05-24T09:32:00-05:00', descripcion: 'Producto creado', usuario: 'Juan Pérez' },
  ],
};

/** Devuelve la ficha de ejemplo (una sola en la semilla, se ignora el `id`). */
export function detalleProductoDemo(id: string): DetalleAdministrativoProducto {
  return { ...DETALLE_PRODUCTO_DEMO, id };
}
