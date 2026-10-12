import { z } from 'zod';

/** Medida en metros: el mismo rango que anuncian los campos (0,1 a 100). Vacío o 0 no son válidos. */
const medidaSchema = (nombre: string) =>
  z
    .number({ required_error: `Ingresa el ${nombre} en metros.`, invalid_type_error: `Ingresa el ${nombre} en metros.` })
    .finite(`Ingresa el ${nombre} en metros.`)
    .min(0.1, `El ${nombre} debe ser de al menos 0,1 m.`)
    .max(100, `El ${nombre} no puede superar 100 m.`);

export const calculadoraPinturaSchema = z.object({
  superficie: z.enum(['paredes', 'techos', 'puertas', 'muebles']),
  ancho: medidaSchema('ancho'),
  alto: medidaSchema('alto'),
  cantidad: z.number().int().min(1).max(50),
});

export type CalculadoraPinturaDTO = z.infer<typeof calculadoraPinturaSchema>;

/** Primer mensaje de error por campo, para mostrarlo junto a cada medida. */
export type ErroresCalculadoraPintura = Partial<Record<keyof CalculadoraPinturaDTO, string>>;
