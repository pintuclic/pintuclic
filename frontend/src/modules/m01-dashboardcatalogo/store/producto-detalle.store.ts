import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ProductoDetalleService } from '../services/producto-detalle.service';
import { detalleProductoDemo } from '../services/producto-detalle.mock';
import type {
  DetalleAdministrativoProducto,
  PestanaDetalleProducto,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DEL DETALLE ADMINISTRATIVO DEL PRODUCTO (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/producto-detalle.store.ts
 *
 * Estado de la vista "ADMIN 05 - Detalle administrativo del producto": ficha
 * cargada, pestaña activa y acción de desactivar. Ante fallo o ausencia de
 * endpoint cae de forma transparente a la semilla local.
 * ==============================================================================
 */
export const useProductoDetalleStore = defineStore('m01-producto-detalle', () => {
  const detalle = ref<DetalleAdministrativoProducto | null>(null);
  const pestanaActiva = ref<PestanaDetalleProducto>('general');
  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);
  const desactivado = ref<boolean>(false);

  async function cargar(id: string): Promise<void> {
    cargando.value = true;
    error.value = null;
    desactivado.value = false;
    try {
      const respuesta = await ProductoDetalleService.obtener(id);
      detalle.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch {
      // Respaldo transparente a la semilla local, sin mostrar aviso.
      detalle.value = detalleProductoDemo(id);
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  const inicializar = (id: string) => cargar(id);

  function setPestana(pestana: PestanaDetalleProducto): void {
    pestanaActiva.value = pestana;
  }

  /** Desactiva el producto (maqueta ADMIN 05). Sin backend simula el cambio. */
  async function desactivar(): Promise<boolean> {
    if (!detalle.value) return false;
    guardando.value = true;
    error.value = null;
    try {
      if (!usandoDatosDemo.value) {
        await ProductoDetalleService.cambiarEstado(detalle.value.id, 'inactivo');
      }
      detalle.value = { ...detalle.value, estado: 'inactivo', disponibleEnCatalogo: false };
      desactivado.value = true;
      return true;
    } catch {
      error.value = 'No fue posible desactivar el producto.';
      return false;
    } finally {
      guardando.value = false;
    }
  }

  function reiniciar(): void {
    detalle.value = null;
    pestanaActiva.value = 'general';
    error.value = null;
    usandoDatosDemo.value = false;
    desactivado.value = false;
  }

  return {
    detalle,
    pestanaActiva,
    cargando,
    guardando,
    error,
    usandoDatosDemo,
    desactivado,
    inicializar,
    cargar,
    setPestana,
    desactivar,
    reiniciar,
  };
});
