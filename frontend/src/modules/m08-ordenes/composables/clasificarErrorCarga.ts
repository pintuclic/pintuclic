/**
 * ==============================================================================
 * M08 - CLASIFICACIÓN DE ERRORES AL CARGAR DATOS
 * Ubicación: src/modules/m08-ordenes/composables/clasificarErrorCarga.ts
 *
 * Decide qué estado pinta una vista cuando una consulta falla. Lo importante es lo
 * que NO hace: un error del servidor o de red nunca se presenta como «no encontrado»
 * ni se rellena con datos de ejemplo. Se muestra como error y se ofrece reintentar.
 *
 *   - 'sesion'        → 401: la sesión caducó; hay que volver a autenticarse.
 *   - 'no_encontrado' → 403 / 404: el backend responde igual para lo ajeno y lo
 *                       inexistente (CA-SEG-03-06), y la vista también.
 *   - 'servidor'      → cualquier otro caso: 5xx, sin respuesta (red caída,
 *                       timeout, CORS) o un error inesperado.
 * ==============================================================================
 */

export type TipoErrorCarga = 'sesion' | 'no_encontrado' | 'servidor';

export function clasificarErrorCarga(e: unknown): TipoErrorCarga {
  const estado = (e as { response?: { status?: number } } | null | undefined)?.response?.status;
  if (estado === 401) return 'sesion';
  if (estado === 403 || estado === 404) return 'no_encontrado';
  return 'servidor';
}
