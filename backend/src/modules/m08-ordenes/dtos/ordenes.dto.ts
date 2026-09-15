import { z } from 'zod';

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
