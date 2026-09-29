import { z } from 'zod';

// ==============================================================================
// M02 - DTO DE BÚSQUEDA Y FILTROS (Zod)
// Valida los parámetros de query de HU-BUS-01 (texto) y HU-BUS-02 (filtros).
// El término es opcional y sin longitud mínima (RF-BUS-01-01: vacío => catálogo
// completo). Los filtros admiten varios valores (RF-BUS-02-01) y llegan por URL
// como `?marca=1&marca=2` o `?marca=1,2`. `pagina`/`limite`/`precio_*` llegan como
// texto, por eso se coaccionan a número (HU-BUS-05 / RF-BUS-02-04).
// ==============================================================================

/** Lista de IDs desde string | string[] | "a,b"; vacío se trata como ausente. */
const idLista = z
  .preprocess((valor) => {
    if (valor === undefined || valor === null) return undefined;
    const partes = (Array.isArray(valor) ? valor.flatMap((v) => String(v).split(',')) : String(valor).split(','))
      .map((s) => s.trim())
      .filter((s) => s !== '');
    return partes.length > 0 ? partes.map(Number) : undefined;
  }, z.array(z.number().int().positive()).min(1).optional());

const precio = z.coerce.number().nonnegative();

export const BuscarProductosDto = z
  .object({
    q: z.string().trim().max(150, 'El término de búsqueda es demasiado largo').optional(),
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
    // Criterio de ordenamiento (HU-BUS-03, RF-BUS-03-01). Ausente => por defecto.
    orden: z.enum(['relevancia', 'precio_asc', 'precio_desc', 'novedad']).optional(),
    // Filtros del catálogo (HU-BUS-02, RF-BUS-02-01)
    categoria: idLista,
    subcategoria: idLista,
    marca: idLista,
    linea: idLista,
    resina: idLista,
    color: idLista,
    presentacion: idLista,
    precio_min: precio.optional(),
    precio_max: precio.optional(),
  })
  // RF-BUS-02-04 / CA-BUS-02-06: se rechaza el rango con mínimo superior al máximo.
  .refine((d) => d.precio_min === undefined || d.precio_max === undefined || d.precio_min <= d.precio_max, {
    message: 'El precio mínimo no puede superar al máximo',
    path: ['precio_min'],
  });
export type BuscarProductosDto = z.infer<typeof BuscarProductosDto>;

// HU-BUS-06: consulta de la analítica de búsquedas sin resultado. `periodo`
// acota la ventana temporal (RF-BUS-06-02); ausente => `mensual` (en el servicio).
export const EstadisticasSinResultadoDto = z.object({
  periodo: z.enum(['diario', 'semanal', 'mensual', 'anual']).optional(),
});
export type EstadisticasSinResultadoDto = z.infer<typeof EstadisticasSinResultadoDto>;
