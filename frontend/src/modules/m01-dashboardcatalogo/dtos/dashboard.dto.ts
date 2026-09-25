import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL PANEL DE CATÁLOGO (DASHBOARD)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/dashboard.dto.ts
 *
 * Esquemas de validación de los parámetros que el frontend envía al backend
 * para consultar el tablero. Sincronizados 1:1 con el tipo de integración
 * `FiltroDashboardParams` de ../interfaces/dashboard.interface.ts.
 * ==============================================================================
 */

/**
 * Ventana temporal de comparación del tablero.
 * `30d` es el valor por defecto (equivale a "vs. mes anterior" de la maqueta).
 */
export const periodoDashboardSchema = z
  .enum(['hoy', '7d', '30d', '90d', 'anio'])
  .default('30d');

export type PeriodoDashboardDTO = z.infer<typeof periodoDashboardSchema>;

/**
 * Filtro completo del panel. Hoy solo contiene el periodo; se deja como objeto
 * para poder crecer (por marca, por categoría) sin romper la firma del service.
 */
export const filtroDashboardSchema = z.object({
  periodo: periodoDashboardSchema,
});

export type FiltroDashboardDTO = z.infer<typeof filtroDashboardSchema>;

/**
 * Normaliza un filtro parcial (o `undefined`) a un DTO completo y válido,
 * aplicando los valores por defecto del esquema.
 */
export function normalizarFiltroDashboard(filtro?: Partial<FiltroDashboardDTO>): FiltroDashboardDTO {
  return filtroDashboardSchema.parse(filtro ?? {});
}
