import { z } from 'zod';
import { correoSchema, telefonoSchema } from '@/core/dtos/seguridad.dto';
export const actualizarEmpleadoSchema = z.object({
  nombre: z.string().trim().min(2, 'Completa el nombre.').max(150),
  telefono: telefonoSchema,
});
export const crearEmpleadoSchema = actualizarEmpleadoSchema.extend({
  correo: correoSchema.transform(value => value.toLowerCase()),
  doc_identidad: z.string().trim().min(5, 'El documento debe tener al menos 5 caracteres.').max(20),
});
