import { z } from 'zod';
import { EnumEstadoOrden } from '../../../core/db/types';

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
 * Estados que hoy admite `enum_estado_orden`. ⚠️ PROVISIONAL: no coinciden con la máquina
 * de estados definida el 23/09 (#128). La comprobación de abajo obliga a actualizar esta
 * lista en cuanto cambie `EnumEstadoOrden` en `core/db/types.ts`.
 */
const ESTADOS_ORDEN = [
  'pendiente',
  'pagado',
  'en_preparacion',
  'enviado',
  'entregado',
  'cancelado',
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
