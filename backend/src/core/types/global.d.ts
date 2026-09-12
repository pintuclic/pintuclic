// ==============================================================================
// PINTU CLIC - DECLARACIONES DE TIPOS GLOBALES (AMBIENT TYPES)
// Disponibles en todo el proyecto backend sin necesidad de imports
// Conforme a AGENTS.md (Cero tolerancia a tipos 'any')
// ==============================================================================

declare global {
  /**
   * Detector matemático de tipos 'any'.
   * Evalúa estrictamente a true si T es 'any' y a false para cualquier otro tipo
   * (incluyendo 'never', 'unknown', primitivos u objetos).
   */
  type IsAny<T> = 0 extends (1 & T) ? true : false;

  /**
   * Mensaje de error tipado que emite TypeScript en el editor al detectar 'any'.
   */
  type ErrorAnyProhibido =
    '⛔ [ERROR DE ARQUITECTURA]: El tipo "any" está prohibido en Pintuclic. Usa una interfaz concreta, un DTO tipado o "unknown".';

  /**
   * Guarda de tipo global: Si T es 'any', colapsa en el mensaje de error de arquitectura.
   * Si T es un tipo válido, preserva T intacto.
   *
   * @example
   * type ParametroValido = SinAny<string>; // string
   * type ParametroInvalido = SinAny<any>;  // ErrorAnyProhibido
   */
  type SinAny<T> = IsAny<T> extends true ? ErrorAnyProhibido : T;

  /**
   * Restricción genérica para funciones o clases que prohíbe el paso de 'any'.
   *
   * @example
   * function guardar<T extends ProhibirAny<T>>(datos: T): T {
   *   return datos;
   * }
   */
  type ProhibirAny<T> = IsAny<T> extends true ? never : unknown;
}

export {};
