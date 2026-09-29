import { z } from 'zod';

export const cambiarPasswordSchema = z
  .object({
    contrasenaActual: z.string().min(1, 'Debe ingresar su contraseña actual'),
    contrasenaNueva: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(128, 'La contraseña no puede superar 128 caracteres')
      .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
      .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmarContrasena: z.string().min(1, 'Debe confirmar su nueva contraseña'),
  })
  .refine((data) => data.contrasenaActual !== data.contrasenaNueva, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['contrasenaNueva'],
  })
  .refine((data) => data.contrasenaNueva === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  });

export type CambiarPasswordDTO = z.infer<typeof cambiarPasswordSchema>;
