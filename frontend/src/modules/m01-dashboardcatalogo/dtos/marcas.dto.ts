import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DE GESTIÓN DE MARCAS
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/marcas.dto.ts
 *
 * RF-CAT-04-01/02: nombre y logotipo obligatorios; unicidad de nombre validada
 * en el servidor. Sincronizado con `FiltrosMarcas` y `MarcaFormulario`.
 * ==============================================================================
 */

export const estadoMarcaSchema = z.enum(['activa', 'inactiva']);

export const filtrosMarcasSchema = z.object({
  busqueda: z.string().trim().max(120, 'Máximo 120 caracteres').default(''),
  estado: estadoMarcaSchema.nullable().default(null),
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(8),
});

export type FiltrosMarcasDTO = z.infer<typeof filtrosMarcasSchema>;

export const FILTROS_MARCAS_INICIALES: FiltrosMarcasDTO = filtrosMarcasSchema.parse({});

export function normalizarFiltrosMarcas(
  filtros?: Partial<FiltrosMarcasDTO>
): FiltrosMarcasDTO {
  return filtrosMarcasSchema.parse(filtros ?? {});
}

export function hayFiltrosMarcasActivos(filtros: FiltrosMarcasDTO): boolean {
  return filtros.busqueda.trim() !== '' || filtros.estado !== null;
}

/** Alta / edición de una marca (panel lateral). */
export const marcaFormSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la marca es obligatorio' })
    .trim()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),
  descripcionCorta: z
    .string({ required_error: 'La descripción corta es obligatoria' })
    .trim()
    .min(1, 'La descripción corta es obligatoria')
    .max(120, 'Máximo 120 caracteres'),
  logoUrl: z.string().nullable().default(null),
  estado: estadoMarcaSchema.default('activa'),
  lineas: z.array(z.string().trim().min(1)).default([]),
});

export type MarcaFormDTO = z.infer<typeof marcaFormSchema>;

export function validarMarcaForm(valor: unknown): {
  valido: boolean;
  errores: Record<string, string>;
} {
  const r = marcaFormSchema.safeParse(valor);
  if (r.success) return { valido: true, errores: {} };
  const errores: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}
