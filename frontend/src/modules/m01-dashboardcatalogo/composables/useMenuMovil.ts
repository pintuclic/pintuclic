import { ref } from 'vue';
import type { Ref } from 'vue';

/**
 * ==============================================================================
 * M01 - ESTADO DEL MENÚ LATERAL EN MÓVIL / TABLET
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useMenuMovil.ts
 *
 * En escritorio (lg+) la barra lateral es fija y siempre visible. Por debajo de
 * ese punto se comporta como un panel deslizable (off-canvas) que se abre con el
 * botón hamburguesa de la barra superior y se cierra con el backdrop, la tecla
 * Esc o al navegar.
 *
 * El estado se comparte como singleton a nivel de módulo para que la barra
 * superior (que tiene el botón) y la barra lateral (que se muestra/oculta)
 * hablen entre sí sin tener que cablear props a través de las 14 vistas del
 * panel. Cada vista simplemente monta ambas barras como hasta ahora.
 * ==============================================================================
 */
const abierto: Ref<boolean> = ref(false);

export function useMenuMovil(): {
  abierto: Ref<boolean>;
  abrir: () => void;
  cerrar: () => void;
  alternar: () => void;
} {
  return {
    abierto,
    abrir: () => {
      abierto.value = true;
    },
    cerrar: () => {
      abierto.value = false;
    },
    alternar: () => {
      abierto.value = !abierto.value;
    },
  };
}
