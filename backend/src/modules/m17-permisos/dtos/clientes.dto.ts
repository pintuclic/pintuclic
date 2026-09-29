import { z } from 'zod';

// ==============================================================================
// M17 - DTOs DE CLIENTES (Zod v4)
// Validacion de entradas HTTP para operaciones de administracion de clientes.
// ==============================================================================

/**
 * DTO de filtros para el listado de clientes (RF-ADM-04-01).
 */
export const FiltroClientesDto = z.object({
  busqueda: z
    .string()
    .max(150, 'La busqueda no puede superar 150 caracteres')
    .trim()
    .optional(),

  tipo: z.enum(['normal', 'empresa']).optional(),

  estado: z.enum(['activo', 'inactivo', 'bloqueado', 'pendiente']).optional(),

  pagina: z.coerce.number().int().positive().default(1),
  por_pagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type FiltroClientesDto = z.infer<typeof FiltroClientesDto>;

/**
 * DTO de bloqueo administrativo de un cliente (RF-ADM-04-12).
 * El motivo es obligatorio para dejar trazabilidad del bloqueo.
 */
export const DesactivarClienteDto = z.object({
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500)
    .trim(),
});

export type DesactivarClienteDto = z.infer<typeof DesactivarClienteDto>;
