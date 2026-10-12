import { z } from 'zod';
import { correoSchema } from '@/core/dtos/seguridad.dto';

/** Letras (con tildes y ñ), espacios, apóstrofo, punto y guion. Sin números ni otros símbolos. */
const NOMBRE_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;
const SOLO_DIGITOS = /^\d+$/;
/** Celulares y fijos en Colombia tienen 10 dígitos. */
export const TELEFONO_DIGITOS = 10;
/** Cédula de ciudadanía: entre 5 y 10 dígitos. */
export const DOCUMENTO_MIN = 5;
export const DOCUMENTO_MAX = 10;

const nombreSchema = z.string().trim()
  .min(1, 'Escribe el nombre completo.')
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(150, 'El nombre no puede superar 150 caracteres.')
  .regex(NOMBRE_REGEX, 'El nombre solo puede contener letras y espacios, sin números ni símbolos.');

const telefonoSchema = z.string().trim()
  .min(1, 'Escribe el teléfono de contacto.')
  .regex(SOLO_DIGITOS, 'El teléfono solo puede contener números.')
  .length(TELEFONO_DIGITOS, `El teléfono debe tener exactamente ${TELEFONO_DIGITOS} dígitos.`);

export const actualizarEmpleadoSchema = z.object({
  nombre: nombreSchema,
  telefono: telefonoSchema,
});
export const crearEmpleadoSchema = actualizarEmpleadoSchema.extend({
  correo: correoSchema.transform(value => value.toLowerCase()),
  doc_identidad: z.string().trim()
    .min(1, 'Escribe el número de documento.')
    .regex(SOLO_DIGITOS, 'El documento solo puede contener números.')
    .min(DOCUMENTO_MIN, `El documento debe tener al menos ${DOCUMENTO_MIN} dígitos.`)
    .max(DOCUMENTO_MAX, `El documento no puede tener más de ${DOCUMENTO_MAX} dígitos.`),
});
