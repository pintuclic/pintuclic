import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { Ref } from 'vue';

/**
 * ==============================================================================
 * M01 - MENÚ FLOTANTE DE ACCIONES POR FILA
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useMenuFlotante.ts
 *
 * El menú de "⋮" de una fila se pinta con `position: fixed` (para que no lo
 * recorte el `overflow-x-auto` de la tabla) y se reposiciona en cada scroll o
 * resize para quedar pegado a su botón. Extraído de `TablaProductos.vue` y
 * `TablaVariantes.vue`, que tenían esta misma lógica duplicada.
 * ==============================================================================
 */
export function useMenuFlotante<T>() {
  const activo = ref<T | null>(null) as Ref<T | null>;
  const pos = ref<{ top: number; left: number }>({ top: 0, left: 0 });
  /** El consumidor enlaza el contenedor del menú con `ref="menu-flotante"`. */
  const menuEl = useTemplateRef<HTMLElement>('menu-flotante');
  let botonActivo: HTMLElement | null = null;

  function situar(): void {
    if (!botonActivo) return;
    const r = botonActivo.getBoundingClientRect();
    pos.value = { top: r.bottom + 4, left: Math.max(8, r.right - 176) };
  }

  function cerrar(): void {
    activo.value = null;
    botonActivo = null;
  }

  /** Abre el menú de `item` anclado a `evento.currentTarget`; si ya estaba abierto, lo cierra. */
  function abrir(item: T, evento: Event, idDe: (item: T) => string): void {
    if (activo.value && idDe(activo.value) === idDe(item)) {
      cerrar();
      return;
    }
    botonActivo = evento.currentTarget as HTMLElement;
    activo.value = item;
    situar();
  }

  function alHacerClicFuera(e: Event): void {
    const t = e.target as HTMLElement;
    if (menuEl.value?.contains(t) || botonActivo?.contains(t)) return;
    cerrar();
  }

  function alPresionarTecla(e: KeyboardEvent): void {
    if (e.key === 'Escape') cerrar();
  }

  function escuchar(activar: boolean): void {
    if (activar) {
      window.addEventListener('scroll', situar, true);
      window.addEventListener('resize', situar);
      window.addEventListener('mousedown', alHacerClicFuera);
      window.addEventListener('keydown', alPresionarTecla);
    } else {
      window.removeEventListener('scroll', situar, true);
      window.removeEventListener('resize', situar);
      window.removeEventListener('mousedown', alHacerClicFuera);
      window.removeEventListener('keydown', alPresionarTecla);
    }
  }

  watch(activo, (item) => escuchar(item !== null));
  onBeforeUnmount(() => escuchar(false));

  return { activo, pos, menuEl, abrir, cerrar };
}
