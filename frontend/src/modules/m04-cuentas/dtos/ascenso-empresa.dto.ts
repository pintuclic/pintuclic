import { z } from 'zod';

export const ascensoEmpresaSchema = z.object({
  nombre_empresa: z.string().min(2, 'La razón social debe tener al menos 2 caracteres'),
  nombre_representante: z.string().min(2, 'El representante debe tener al menos 2 caracteres'),
  nit: z.string().min(5, 'El NIT o RUT debe tener al menos 5 caracteres').regex(/^[0-9-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  telefono: z.string().min(7, 'El teléfono es muy corto')
});

export type AscensoEmpresaDTO = z.infer<typeof ascensoEmpresaSchema>;
