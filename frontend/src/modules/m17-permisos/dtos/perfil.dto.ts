import { z } from 'zod';
import { contrasenaSchema } from '@/core/dtos/seguridad.dto';
export const cambiarContrasenaSchema = z.object({
  current: z.string().min(1, 'Ingresa la contraseña actual.'),
  next: contrasenaSchema,
  repeat: z.string(),
}).refine(data => data.next === data.repeat, {
  message: 'Las contraseñas nuevas no coinciden.', path: ['repeat'],
}).refine(data => data.current !== data.next, {
  message: 'La contraseña nueva debe ser distinta de la actual.', path: ['next'],
});
