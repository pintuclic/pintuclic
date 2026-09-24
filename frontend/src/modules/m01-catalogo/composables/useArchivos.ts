import { onBeforeUnmount, ref, watch } from 'vue';
import type { WatchSource } from 'vue';

/**
 * ==============================================================================
 * M01 - ARCHIVOS E IMÁGENES
 * Ubicación: src/modules/m01-catalogo/composables/useArchivos.ts
 *
 * - `leerDataUrl`: el backend recibe logotipos e imágenes como data URL base64
 *   dentro del JSON (no hay multipart en el proyecto).
 * - `useImagenProtegida`: los binarios (`/marcas/:id/logotipo`,
 *   `/imagenes/:id/contenido`) exigen Bearer; un `<img src>` directo no lo envía,
 *   así que se descargan como blob y se exponen como object URL.
 * ==============================================================================
 */

/** Descarga de un binario protegido (logotipo o imagen) con `apiClient`. */
export type CargarBinario = () => Promise<Blob>;

export function leerDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error ?? new Error('No fue posible leer el archivo.'));
    lector.readAsDataURL(archivo);
  });
}

/**
 * @param clave Identidad del recurso (id de marca/imagen). Solo cuando cambia se
 *              vuelve a descargar; así un loader inline no provoca descargas en bucle.
 * @param cargar Descarga el binario con `apiClient` (Bearer incluido).
 */
export function useImagenProtegida(clave: WatchSource<string | number | null>, cargar: CargarBinario) {
  const url = ref<string | null>(null);
  const fallo = ref(false);

  function liberar(): void {
    if (url.value) URL.revokeObjectURL(url.value);
    url.value = null;
  }

  watch(
    clave,
    async (actual) => {
      liberar();
      fallo.value = false;
      if (actual === null) return;
      try {
        url.value = URL.createObjectURL(await cargar());
      } catch {
        fallo.value = true;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(liberar);
  return { url, fallo };
}
