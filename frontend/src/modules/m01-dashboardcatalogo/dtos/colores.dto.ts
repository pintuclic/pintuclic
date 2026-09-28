import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL LISTADO DE COLORES
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/colores.dto.ts
 *
 * Validación de los filtros de la vista "ADMIN 07 - Colores". Sincronizado
 * 1:1 con `FiltrosColores` de ../interfaces/colores.interface.ts.
 * ==============================================================================
 */

export const estadoColorSchema = z.enum(['publicado', 'borrador']);

export const filtrosColoresSchema = z.object({
  busqueda: z.string().trim().max(120, 'Máximo 120 caracteres').default(''),
  marcaId: z.string().min(1).nullable().default(null),
  familiaClave: z.string().min(1).nullable().default(null),
  estado: estadoColorSchema.nullable().default(null),
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(10),
});

export type FiltrosColoresDTO = z.infer<typeof filtrosColoresSchema>;

export const FILTROS_COLORES_INICIALES: FiltrosColoresDTO = filtrosColoresSchema.parse({});

export function normalizarFiltrosColores(
  filtros?: Partial<FiltrosColoresDTO>
): FiltrosColoresDTO {
  return filtrosColoresSchema.parse(filtros ?? {});
}

export function hayFiltrosColoresActivos(filtros: FiltrosColoresDTO): boolean {
  return (
    filtros.busqueda.trim() !== '' ||
    filtros.marcaId !== null ||
    filtros.familiaClave !== null ||
    filtros.estado !== null
  );
}
