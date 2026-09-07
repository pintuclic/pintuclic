import { z } from 'zod';

// ==============================================================================
// M17 - DTOs DE EMPLEADOS (Zod v4)
// Validacion de entradas HTTP para operaciones de administracion de empleados.
// ==============================================================================

/**
 * DTO de creacion de empleado (RF-ADM-01-02, RF-ADM-01-03).
 * El empleado se crea con estado activo y cero permisos (RF-ADM-01-04).
 */
export const CrearEmpleadoDto = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres')
    .trim(),

  doc_identidad: z
    .string()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'El documento no puede superar 20 caracteres')
    .trim(),

  correo: z
    .string()
    .email('El correo no tiene un formato valido')
    .max(150, 'El correo no puede superar 150 caracteres')
    .trim()
    .toLowerCase(),

  telefono: z
    .string()
    .max(20, 'El telefono no puede superar 20 caracteres')
    .trim()
    .optional(),
});

export type CrearEmpleadoDto = z.infer<typeof CrearEmpleadoDto>;

/**
 * DTO de actualizacion de contacto de empleado (RF-ADM-01-07).
 * Solo se permite editar nombre y telefono; no correo ni permisos.
 */
export const ActualizarContactoEmpleadoDto = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150)
    .trim()
    .optional(),

  telefono: z
    .string()
    .max(20)
    .trim()
    .optional(),
}).refine(
  (data) => data.nombre !== undefined || data.telefono !== undefined,
  { message: 'Debe proporcionar al menos un campo para actualizar (nombre o telefono)' }
);

export type ActualizarContactoEmpleadoDto = z.infer<typeof ActualizarContactoEmpleadoDto>;

/**
 * DTO de desactivacion logica de empleado (RF-ADM-01-10).
 * La baja es logica: estado = inactivo. No se borra el registro.
 */
export const DesactivarEmpleadoDto = z.object({
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500)
    .trim(),
});

export type DesactivarEmpleadoDto = z.infer<typeof DesactivarEmpleadoDto>;

/**
 * DTO de filtros para el listado de empleados (RF-ADM-01-12).
 */
export const FiltroEmpleadosDto = z.object({
  estado: z.enum(['activo', 'inactivo', 'bloqueado', 'pendiente']).optional(),
  busqueda: z.string().max(100).trim().optional(),
  pagina: z.coerce.number().int().positive().default(1),
  por_pagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type FiltroEmpleadosDto = z.infer<typeof FiltroEmpleadosDto>;
