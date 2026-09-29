import { z } from 'zod';
export const parameterMeta: Record<
  string,
  { label: string; min: number; max: number; default: number; unit: string }
> = {
  inactividad_admin_segundos: {
    label: "Inactividad del administrador",
    min: 60,
    max: 86400,
    default: 1800,
    unit: "segundos",
  },
  inactividad_cliente_segundos: {
    label: "Inactividad del cliente",
    min: 300,
    max: 7776000,
    default: 7776000,
    unit: "segundos",
  },
  intentos_fallidos_max: {
    label: "Intentos fallidos de acceso",
    min: 1,
    max: 20,
    default: 5,
    unit: "intentos",
  },
};

export const parametroSchema = z.object({
  clave: z.string(),
  valor: z.coerce.number().int(),
}).refine(data => {
  const bounds = parameterMeta[data.clave];
  return !!bounds && data.valor >= bounds.min && data.valor <= bounds.max;
}, { message: 'Revisa los valores y sus rangos permitidos.', path: ['valor'] });
