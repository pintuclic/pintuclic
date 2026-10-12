/**
 * Cierre de un modal al pulsar su fondo, solo si el clic empezó Y terminó en el fondo.
 *
 * Con `@click.self` (o comparando `target === currentTarget` solo en el clic), el modal se
 * cerraba al seleccionar texto arrastrando y soltar fuera de la ventana: el navegador entrega
 * ese clic al ancestro común, que es el propio fondo.
 */
export function useCierrePorFondo(cerrar: () => void) {
  let pulsadoEnFondo = false;

  function alPulsarFondo(evento: MouseEvent): void {
    pulsadoEnFondo = evento.target === evento.currentTarget;
  }

  function alSoltarEnFondo(evento: MouseEvent): void {
    if (pulsadoEnFondo && evento.target === evento.currentTarget) cerrar();
    pulsadoEnFondo = false;
  }

  return { alPulsarFondo, alSoltarEnFondo };
}
