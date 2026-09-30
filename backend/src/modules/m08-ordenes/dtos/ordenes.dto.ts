import { z } from 'zod';
import { EnumEstadoOrden, EnumModoEntrega, EnumOrigenOrden } from '../../../core/db/types';
import type {
  DescuentoSolicitud,
  LineaSolicitud,
  MedioContacto,
  SolicitudPagoConfirmado,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - DTOs DE ÓRDENES (Zod)
// El código visible es el único identificador expuesto al navegador (RF-ORD-06-01,
// ADR-04): la clave primaria nunca viaja en la URL. Su longitud máxima es la de la
// columna `orden.codigo_visible` (VARCHAR 50).
// ==============================================================================

export const CodigoOrdenDto = z.object({
  codigo: z.string().trim().min(1).max(50),
});
export type CodigoOrdenDto = z.infer<typeof CodigoOrdenDto>;

// HU-ORD-07 (CA-ORD-07-03): texto del buscador de la sección de pedidos. Opcional;
// vacío equivale a listar todos los pedidos del cliente.
export const ListarMisPedidosDto = z.object({
  q: z.string().trim().max(150, 'El texto de búsqueda es demasiado largo').optional(),
});
export type ListarMisPedidosDto = z.infer<typeof ListarMisPedidosDto>;

/**
 * Estados de `enum_estado_orden` (schema v3.8, HU-ORD-03). La comprobación de abajo obliga
 * a actualizar esta lista en cuanto cambie `EnumEstadoOrden` en `core/db/types.ts`.
 */
const ESTADOS_ORDEN = [
  'orden_confirmada',
  'revision_disponibilidad',
  'en_preparacion',
  'preparada',
  'despachado',
  'entregado',
  'cancelado',
  'devuelto',
] as const satisfies readonly EnumEstadoOrden[];
type _EstadosSinListar = Exclude<EnumEstadoOrden, (typeof ESTADOS_ORDEN)[number]>;
const _listaExhaustiva: [_EstadosSinListar] extends [never] ? true : never = true;

const fechaIso = z.iso.date('La fecha debe tener el formato AAAA-MM-DD');

// Paginación con el mismo criterio que M02: `limite` como máximo 100.
const pagina = z.coerce.number().int().positive().optional();
const limite = z.coerce.number().int().positive().max(100).optional();

// Teléfono tal como lo dicta el cliente: dígitos con espacios opcionales y prefijo +.
// Se quitan los espacios para compararlo con `usuario.telefono` (VARCHAR 20).
const telefono = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{7,25}$/, 'El teléfono solo admite dígitos, espacios y el prefijo +')
  .transform((valor) => valor.replace(/\s+/g, ''))
  .refine((valor) => valor.length <= 20, 'El teléfono es demasiado largo');

// Listado del personal (HU-ORD-05, HU-ORD-08). Cada filtro es opcional y se prueba por
// separado; el periodo usa `orden.fecha` con ambos extremos incluidos.
export const ListarOrdenesGestionDto = z
  .object({
    codigo: z.string().trim().max(50).optional(),
    estado: z.enum(ESTADOS_ORDEN, { error: `El estado debe ser uno de: ${ESTADOS_ORDEN.join(', ')}` }).optional(),
    desde: fechaIso.optional(),
    hasta: fechaIso.optional(),
    cliente: z.coerce.number().int().positive().optional(),
    // CA-ORD-08-02: el dato que da el cliente cuando no recuerda su número de pedido.
    correo: z.string().trim().max(150).email('Debe indicar un correo válido').optional(),
    telefono: telefono.optional(),
    // CA-ORD-05-07: la bandeja pide ver primero lo que lleva más tiempo esperando.
    orden: z.enum(['recientes', 'antiguedad'], { error: 'El orden debe ser «recientes» o «antiguedad»' }).optional(),
    pagina,
    limite,
  })
  .refine((d) => d.desde === undefined || d.hasta === undefined || d.desde <= d.hasta, {
    message: 'La fecha inicial no puede ser posterior a la final',
    path: ['desde'],
  });
export type ListarOrdenesGestionDto = z.infer<typeof ListarOrdenesGestionDto>;

// Historial de compras del cliente desde una orden (HU-ORD-11): solo paginación.
export const PaginacionDto = z.object({ pagina, limite });
export type PaginacionDto = z.infer<typeof PaginacionDto>;

// Cambio de estado por el personal (HU-ORD-03, CA-ORD-05-01). Si la transición es
// válida lo decide el servicio; aquí solo se valida la forma. El motivo es obligatorio
// al volver de Preparada a En preparación (D01).
export const CambiarEstadoDto = z.object({
  estado: z.enum(ESTADOS_ORDEN, { error: `El estado debe ser uno de: ${ESTADOS_ORDEN.join(', ')}` }),
  motivo: z.string().trim().max(500, 'El motivo no puede superar 500 caracteres').optional(),
});
export type CambiarEstadoDto = z.infer<typeof CambiarEstadoDto>;

// Nota interna del personal (HU-ORD-10).
export const CrearNotaDto = z.object({
  texto: z
    .string({ error: 'Escribe el texto de la nota' })
    .trim()
    .min(1, 'La nota no puede estar vacía')
    .max(2000, 'La nota no puede superar 2000 caracteres'),
});
export type CrearNotaDto = z.infer<typeof CrearNotaDto>;

/** Los medios que la orden conserva: correo y teléfono (RF-ORD-09-02, Tanda 3C). */
const MEDIOS_CONTACTO = ['correo', 'telefono'] as const satisfies readonly MedioContacto[];
type _MediosSinListar = Exclude<MedioContacto, (typeof MEDIOS_CONTACTO)[number]>;
const _mediosExhaustivos: [_MediosSinListar] extends [never] ? true : never = true;

// Contacto con el cliente iniciado desde la orden (CA-ORD-09-03).
export const RegistrarContactoDto = z.object({
  medio: z.enum(MEDIOS_CONTACTO, { error: `El medio debe ser uno de: ${MEDIOS_CONTACTO.join(', ')}` }),
  detalle: z.string().trim().max(1000, 'El detalle no puede superar 1000 caracteres').optional(),
});
export type RegistrarContactoDto = z.infer<typeof RegistrarContactoDto>;

// ==============================================================================
// HU-ORD-01: SOLICITUD CON PAGO CONFIRMADO (llamada interna de M07, sin ruta HTTP)
// Solo se valida la forma y la coherencia de los datos: los importes se copian tal como
// los congeló la solicitud, sin recalcularlos ni redondearlos (D07). Los objetos son
// estrictos: un campo desconocido o mal escrito se rechaza en lugar de perderse.
// ==============================================================================

/** Hasta 10 cifras enteras y 2 decimales, como las columnas NUMERIC(12, 2). */
const PATRON_IMPORTE = /^\d{1,10}(\.\d{1,2})?$/;

/**
 * Importe exacto como texto. Un número se acepta si se escribe exacto con 2 decimales
 * (95900.5 sí; 0.1 + 0.2 no), para no guardar un valor distinto del cobrado.
 */
const importe = z
  .union([z.string().trim(), z.number()], { error: 'El importe debe ser un número o un texto numérico' })
  .transform((valor) => String(valor))
  .pipe(
    z.string().regex(PATRON_IMPORTE, 'El importe debe ser cero o positivo, con hasta 10 cifras enteras y 2 decimales')
  );

const porcentaje = importe.refine((valor) => Number(valor) <= 100, 'El porcentaje no puede superar 100');

const idPositivo = z.number().int().positive();

/** Texto obligatorio sin espacios sobrantes, con el máximo de su columna. */
function texto(campo: string, maximo: number) {
  return z
    .string({ error: `Falta ${campo}` })
    .trim()
    .min(1, `${campo} no puede estar vacío`)
    .max(maximo, `${campo} no puede superar ${maximo} caracteres`);
}

/** Texto opcional: vacío o ausente se guarda como `null`. */
function textoOpcional(campo: string, maximo: number) {
  return z
    .string()
    .trim()
    .max(maximo, `${campo} no puede superar ${maximo} caracteres`)
    .nullish()
    .transform((valor) => (valor ? valor : null));
}

const ORIGENES_ORDEN = ['carrito', 'cotizacion'] as const satisfies readonly EnumOrigenOrden[];
type _OrigenesSinListar = Exclude<EnumOrigenOrden, (typeof ORIGENES_ORDEN)[number]>;
const _origenesExhaustivos: [_OrigenesSinListar] extends [never] ? true : never = true;

const MODOS_ENTREGA = ['domicilio', 'recogida'] as const satisfies readonly EnumModoEntrega[];
type _ModosSinListar = Exclude<EnumModoEntrega, (typeof MODOS_ENTREGA)[number]>;
const _modosExhaustivos: [_ModosSinListar] extends [never] ? true : never = true;

const DescuentoSolicitudDto = z.strictObject({
  origen: texto('El origen del descuento', 150),
  porcentaje: porcentaje.nullish().transform((valor) => valor ?? null),
  importe,
});

const LineaSolicitudDto = z
  .strictObject({
    nombreProducto: texto('El nombre del producto', 150),
    varianteCopia: texto('La variante', 150),
    cantidad: z.number().int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor que cero'),
    precioInicial: importe,
    precioAplicado: importe,
    colorSolicitado: textoOpcional('El color solicitado', 150),
    idVarianteRef: idPositivo.nullish().transform((valor) => valor ?? null),
    esEntonado: z.boolean().optional().default(false),
    baseConsumida: textoOpcional('La base consumida', 150),
    descuentos: z.array(DescuentoSolicitudDto).max(20, 'Una línea admite como máximo 20 descuentos').optional().default([]),
  })
  .refine((l) => !l.esEntonado || (l.colorSolicitado !== null && l.baseConsumida !== null), {
    message: 'Una línea entonada debe indicar el color solicitado y la base que consume',
    path: ['esEntonado'],
  });

const ConfirmacionPagoDto = z.discriminatedUnion(
  'medio',
  [
    z.strictObject({
      medio: z.literal('pasarela'),
      transaccionId: texto('El identificador de la transacción', 100),
      montoConfirmado: importe,
    }),
    z.strictObject({
      medio: z.literal('verificacion_manual'),
      idEmpleado: idPositivo,
      referencia: textoOpcional('La referencia del pago', 150),
      montoConfirmado: importe,
    }),
  ],
  { error: 'La confirmación del pago debe venir de la pasarela o de la verificación de un empleado' }
);

export const SolicitudPagoConfirmadoDto = z
  .strictObject({
    codigoSolicitud: z
      .string({ error: 'Falta el código de la solicitud' })
      .trim()
      .regex(/^SOL-\d{4}-\d{5,}$/, 'El código de la solicitud debe tener el formato SOL-AAAA-NNNNN')
      .max(20, 'El código de la solicitud no puede superar 20 caracteres'),
    idCliente: idPositivo,
    origen: z.enum(ORIGENES_ORDEN, { error: `El origen debe ser uno de: ${ORIGENES_ORDEN.join(', ')}` }),
    idCotizacion: idPositivo.nullish().transform((valor) => valor ?? null),
    modoEntrega: z.enum(MODOS_ENTREGA, { error: `El modo de entrega debe ser uno de: ${MODOS_ENTREGA.join(', ')}` }),
    direccion: textoOpcional('La dirección', 500),
    costoEntrega: importe,
    subTotal: importe,
    descuento: importe,
    total: importe,
    baseSinImpuesto: importe,
    importeIva: importe,
    tasaIva: porcentaje,
    observaciones: textoOpcional('Las observaciones', 1000),
    lineas: z
      .array(LineaSolicitudDto)
      .min(1, 'La solicitud debe tener al menos una línea')
      .max(200, 'La solicitud no puede superar 200 líneas'),
    confirmacion: ConfirmacionPagoDto,
  })
  // CA-ORD-01-04: la cotización de origen se registra si, y solo si, la compra viene de una.
  .refine((s) => (s.origen === 'cotizacion') === (s.idCotizacion !== null), {
    message: 'Indica la cotización de origen solo cuando la compra proviene de una cotización',
    path: ['idCotizacion'],
  })
  .refine((s) => s.modoEntrega !== 'domicilio' || s.direccion !== null, {
    message: 'Una orden a domicilio debe tener dirección de entrega',
    path: ['direccion'],
  });
export type SolicitudPagoConfirmadoDto = z.infer<typeof SolicitudPagoConfirmadoDto>;

// Los nombres de los campos del esquema y del contrato público deben coincidir: si uno
// cambia sin el otro, la compilación falla (un campo mal escrito no debe perderse en silencio).
type ClavesIguales<A, B> = [Exclude<keyof A, keyof B> | Exclude<keyof B, keyof A>] extends [never] ? true : never;
const _solicitudAlineada: ClavesIguales<SolicitudPagoConfirmado, z.input<typeof SolicitudPagoConfirmadoDto>> = true;
const _lineaAlineada: ClavesIguales<LineaSolicitud, z.input<typeof LineaSolicitudDto>> = true;
const _descuentoAlineado: ClavesIguales<DescuentoSolicitud, z.input<typeof DescuentoSolicitudDto>> = true;
