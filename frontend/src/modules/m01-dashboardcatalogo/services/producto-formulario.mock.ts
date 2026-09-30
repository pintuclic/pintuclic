import type {
  DetalleEdicionProducto,
  FormularioProducto,
  OpcionesFormularioProducto,
} from '../interfaces';
import { GALERIA_PRODUCTO_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE PRODUCTO
 * Ubicación: src/modules/m01-dashboardcatalogo/services/producto-formulario.mock.ts
 *
 * Refleja la maqueta "ADMIN 03 - Productos · Crear / editar" (ejemplo:
 * "Viniltex Advanced Amarillo Profundo"). El store usa estos datos mientras el
 * backend de M01 no expone los endpoints del formulario.
 *
 * Los `hex` de los colores son la representación visual que el backend deriva
 * del valor CIELAB (RF-CAT-05-02); aquí son valores de ejemplo, no tokens de UI.
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_DEMO: OpcionesFormularioProducto = {
  categorias: [
    { valor: 'pinturas', etiqueta: 'Pinturas' },
    { valor: 'herramientas', etiqueta: 'Herramientas' },
    { valor: 'accesorios', etiqueta: 'Accesorios' },
    { valor: 'impermeabilizantes', etiqueta: 'Impermeabilizantes' },
  ],
  subcategorias: [
    { valor: 'interiores', etiqueta: 'Interiores', categoriaId: 'pinturas' },
    { valor: 'exteriores', etiqueta: 'Exteriores', categoriaId: 'pinturas' },
    { valor: 'esmaltes', etiqueta: 'Esmaltes', categoriaId: 'pinturas' },
    { valor: 'brochas-rodillos', etiqueta: 'Brochas y rodillos', categoriaId: 'herramientas' },
    { valor: 'electricas', etiqueta: 'Herramientas eléctricas', categoriaId: 'herramientas' },
    { valor: 'cintas', etiqueta: 'Cintas y enmascarado', categoriaId: 'accesorios' },
    { valor: 'mantos', etiqueta: 'Mantos asfálticos', categoriaId: 'impermeabilizantes' },
  ],
  tiposProducto: [
    { valor: 'pintura-acrilica', etiqueta: 'Pintura acrílica' },
    { valor: 'pintura-vinilica', etiqueta: 'Pintura vinílica' },
    { valor: 'esmalte', etiqueta: 'Esmalte' },
    { valor: 'herramienta-manual', etiqueta: 'Herramienta manual' },
    { valor: 'herramienta-electrica', etiqueta: 'Herramienta eléctrica' },
    { valor: 'accesorio', etiqueta: 'Accesorio' },
  ],
  marcas: [
    { valor: 'pintuclic', etiqueta: 'Pintu Clic' },
    { valor: 'pintuco', etiqueta: 'Pintuco' },
    { valor: 'corona', etiqueta: 'Corona' },
    { valor: 'dewalt', etiqueta: 'DeWalt' },
  ],
  lineas: [
    { valor: 'viniltex-advanced', etiqueta: 'Viniltex Advanced', marcaId: 'pintuclic' },
    { valor: 'viniltex', etiqueta: 'Viniltex', marcaId: 'pintuclic' },
    { valor: 'koraza', etiqueta: 'Koraza', marcaId: 'pintuco' },
    { valor: 'premium', etiqueta: 'Premium', marcaId: 'corona' },
    { valor: '20v-max', etiqueta: '20V MAX', marcaId: 'dewalt' },
  ],
  colores: [
    { id: 'col-amarillo-profundo', nombre: 'Amarillo Profundo', codigo: 'AP-001', hex: '#F2B705', marcaId: 'pintuclic' },
    { id: 'col-azul-oceano', nombre: 'Azul Océano', codigo: 'AO-012', hex: '#0A5BD3', marcaId: 'pintuclic' },
    { id: 'col-rojo-carmesi', nombre: 'Rojo Carmesí', codigo: 'RC-015', hex: '#C42B2B', marcaId: 'pintuclic' },
    { id: 'col-verde-olivo', nombre: 'Verde Olivo', codigo: 'VO-008', hex: '#5A7D2A', marcaId: 'pintuclic' },
    { id: 'col-blanco-nieve', nombre: 'Blanco Nieve', codigo: 'BN-001', hex: '#F4F6F7', marcaId: 'pintuco' },
    { id: 'col-gris-moderno', nombre: 'Gris Moderno', codigo: 'GM-003', hex: '#6C757D', marcaId: 'pintuco' },
  ],
  atributos: {
    presentaciones: [
      { valor: '1/4-galon', etiqueta: '1/4 galón (0.946 L)' },
      { valor: '1-galon', etiqueta: '1 galón (3.785 L)' },
      { valor: '5-galones', etiqueta: '5 galones (18.9 L)' },
      { valor: 'unidad', etiqueta: 'Unidad' },
    ],
    rendimientos: [
      { valor: '30-35', etiqueta: '30 - 35 m²/gal' },
      { valor: '40-45', etiqueta: '40 - 45 m²/gal' },
      { valor: '50-55', etiqueta: '50 - 55 m²/gal' },
      { valor: 'na', etiqueta: 'No aplica' },
    ],
    acabados: [
      { valor: 'mate', etiqueta: 'Mate' },
      { valor: 'satinado', etiqueta: 'Satinado' },
      { valor: 'semibrillante', etiqueta: 'Semibrillante' },
      { valor: 'brillante', etiqueta: 'Brillante' },
    ],
    usos: [
      { valor: 'interior', etiqueta: 'Interior' },
      { valor: 'exterior', etiqueta: 'Exterior' },
      { valor: 'interior-exterior', etiqueta: 'Interior y exterior' },
    ],
    secados: [
      { valor: '30-min', etiqueta: '30 minutos' },
      { valor: '1-hora', etiqueta: '1 hora' },
      { valor: '2-horas', etiqueta: '2 horas' },
    ],
    repintados: [
      { valor: '2-4-horas', etiqueta: '2 - 4 horas' },
      { valor: '4-6-horas', etiqueta: '4 - 6 horas' },
      { valor: '24-horas', etiqueta: '24 horas' },
    ],
  },
  bases: [
    { valor: 'base-blanca', etiqueta: 'Base blanca', descripcion: 'Lista para usar' },
    { valor: 'base-pastel', etiqueta: 'Base pastel', descripcion: 'Entonador de tonos claros' },
    { valor: 'base-deep', etiqueta: 'Base deep', descripcion: 'Uso profesional, tonos intensos' },
  ],
  sistemasEntonado: [
    { valor: 'tintometrico-pintuclic', etiqueta: 'Pintu Clic Sistema Tintométrico' },
    { valor: 'manual', etiqueta: 'Entonado manual' },
    { valor: 'ninguno', etiqueta: 'Sin entonado' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioProductoVacio(): FormularioProducto {
  return {
    nombre: '',
    descripcion: '',
    categoriaId: null,
    subcategoriaId: null,
    tipoProductoId: null,
    estado: 'borrador',
    marcaId: null,
    lineaId: null,
    claseColor: 'sin_color',
    colorPrincipalId: null,
    codigoColor: '',
    coloresDisponiblesIds: [],
    atributos: {
      presentacionPrincipal: '',
      rendimiento: '',
      acabado: '',
      usoRecomendado: '',
      secadoAlTacto: '',
      tiempoRepintado: '',
    },
    basesDisponibles: [],
    sistemaEntonado: '',
    imagenes: [],
    precioVenta: null,
    precioReferencia: null,
    sku: '',
    stockInicial: null,
    destacado: false,
    mostrarEnOfertas: false,
    permitirOpiniones: true,
    requiereEnvioEspecial: false,
    etiquetas: [],
  };
}

/** Producto de ejemplo para el modo "editar" (el de la maqueta ADMIN 03). */
export const FORMULARIO_PRODUCTO_DEMO: FormularioProducto = {
  nombre: 'Viniltex Advanced Amarillo Profundo',
  descripcion:
    'Pintura premium a base de agua para paredes interiores. Máxima lavabilidad y activo antibacterial que elimina el 99.9% de las bacterias.',
  categoriaId: 'pinturas',
  subcategoriaId: 'interiores',
  tipoProductoId: 'pintura-acrilica',
  estado: 'publicado',
  marcaId: 'pintuclic',
  lineaId: 'viniltex-advanced',
  claseColor: 'colores_fijos',
  colorPrincipalId: 'col-amarillo-profundo',
  codigoColor: 'AP-001',
  coloresDisponiblesIds: ['col-amarillo-profundo', 'col-azul-oceano', 'col-rojo-carmesi', 'col-verde-olivo'],
  atributos: {
    presentacionPrincipal: '1-galon',
    rendimiento: '40-45',
    acabado: 'mate',
    usoRecomendado: 'interior',
    secadoAlTacto: '30-min',
    tiempoRepintado: '2-4-horas',
  },
  basesDisponibles: ['base-blanca', 'base-pastel'],
  sistemaEntonado: 'tintometrico-pintuclic',
  imagenes: [
    { id: 'img-1', url: GALERIA_PRODUCTO_DEMO.frontal, nombre: 'viniltex-advanced-frontal.jpg', esPrincipal: true },
    { id: 'img-2', url: GALERIA_PRODUCTO_DEMO.lateral, nombre: 'viniltex-advanced-lateral.jpg', esPrincipal: false },
    { id: 'img-3', url: GALERIA_PRODUCTO_DEMO.ambiente, nombre: 'ambiente-sala.jpg', esPrincipal: false },
  ],
  precioVenta: 39900,
  precioReferencia: 0,
  sku: 'VIN-AP-001',
  stockInicial: 50,
  destacado: true,
  mostrarEnOfertas: true,
  permitirOpiniones: false,
  requiereEnvioEspecial: false,
  etiquetas: ['lavable', 'antibacterial', 'interior', 'premium'],
};

/**
 * Datos de solo-edición de la maqueta "ADMIN 04 - Editar producto":
 * auditoría, conteos relacionados e historial de cambios.
 */
export const EDICION_PRODUCTO_DEMO: DetalleEdicionProducto = {
  actualizadoEn: '2025-05-27T10:24:00-05:00',
  creadoPor: 'Carlos Álvarez',
  variantesActivas: 12,
  productosRelacionados: 3,
  historial: [
    {
      id: 'aud-1',
      fechaHora: '2025-05-27T10:24:00-05:00',
      descripcion: 'Se actualizó el precio y la descripción',
      usuario: 'Carlos Álvarez',
    },
    {
      id: 'aud-2',
      fechaHora: '2025-05-25T16:11:00-05:00',
      descripcion: 'Se cambió la imagen principal',
      usuario: 'María Torres',
    },
    {
      id: 'aud-3',
      fechaHora: '2025-05-10T09:32:00-05:00',
      descripcion: 'Producto creado',
      usuario: 'Carlos Álvarez',
    },
  ],
};
