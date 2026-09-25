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

// HU-ORD-05 (CA-ORD-05-04): listado del personal. Cada filtro es opcional y se prueba
// por separado; el periodo usa `orden.fecha` con ambos extremos incluidos.
export const ListarOrdenesGestionDto = z
  .object({
    codigo: z.string().trim().max(50).optional(),
    estado: z.enum(ESTADOS_ORDEN).optional(),
    desde: fechaIso.optional(),
    hasta: fechaIso.optional(),
    cliente: z.coerce.number().int().positive().optional(),
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
  })
  .refine((d) => d.desde === undefined || d.hasta === undefined || d.desde <= d.hasta, {
    message: 'La fecha inicial no puede ser posterior a la final',
    path: ['desde'],
  });
export type ListarOrdenesGestionDto = z.infer<typeof ListarOrdenesGestionDto>;
