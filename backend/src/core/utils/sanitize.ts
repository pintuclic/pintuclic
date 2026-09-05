/**
 * Utilidades de saneamiento de respuestas (M20 - HU-SEG-06).
 *
 * Regla transversal: al navegador viajan únicamente los datos necesarios para la
 * operación solicitada (RF-SEG-06-01) y jamás la contraseña, en claro ni derivada
 * (RF-SEG-01-04, CA-SEG-01-04).
 */

/** Campos que nunca deben abandonar el servidor en una respuesta HTTP. */
const CAMPOS_PROHIBIDOS: readonly string[] = ['contrasena', 'password', 'hash', 'passwordHash'];

/**
 * Devuelve una copia del objeto sin las claves indicadas.
 */
export function omitirCampos<T extends object, K extends keyof T>(
  origen: T,
  claves: readonly K[]
): Omit<T, K> {
  const copia = { ...origen };
  for (const clave of claves) {
    delete copia[clave];
  }
  return copia;
}

/**
 * Elimina de forma recursiva todo campo sensible de un objeto o colección antes de
 * serializarlo. Actúa como última red de seguridad frente a un `select *` olvidado.
 */
export function sanearRespuesta<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor.map((elemento) => sanearRespuesta(elemento)) as unknown as T;
  }

  if (valor === null || typeof valor !== 'object' || valor instanceof Date) {
    return valor;
  }

  const resultado: Record<string, unknown> = {};
  for (const [clave, contenido] of Object.entries(valor as Record<string, unknown>)) {
    if (CAMPOS_PROHIBIDOS.includes(clave)) {
      continue;
    }
    resultado[clave] = sanearRespuesta(contenido);
  }

  return resultado as unknown as T;
}
