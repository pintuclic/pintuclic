import { defineStore } from 'pinia';
import { ref } from 'vue';
import { MarcaDetalleService } from '../services/marca-detalle.service';
import { detalleMarcaDemo } from '../services/marca-detalle.mock';
import type { DetalleAdministrativoMarca, PestanaDetalleMarca } from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DEL DETALLE ADMINISTRATIVO DE MARCA (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/marca-detalle.store.ts
 *
 * Estado de la maqueta "ADMIN 14 - Detalle de marca": ficha cargada, pestaña
 * activa y acción de desactivar. Respaldo transparente a la semilla local.
 * ==============================================================================
 */
export const useMarcaDetalleStore = defineStore('m01-marca-detalle', () => {
  const detalle = ref<DetalleAdministrativoMarca | null>(null);
  const pestanaActiva = ref<PestanaDetalleMarca>('general');
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
      const respuesta = await MarcaDetalleService.obtener(id);
      detalle.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch {
      detalle.value = detalleMarcaDemo(id);
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  const inicializar = (id: string) => cargar(id);

  function setPestana(pestana: PestanaDetalleMarca): void {
    pestanaActiva.value = pestana;
  }

  async function desactivar(): Promise<boolean> {
    if (!detalle.value) return false;
    guardando.value = true;
    error.value = null;
    try {
      if (!usandoDatosDemo.value) {
        await MarcaDetalleService.cambiarEstado(detalle.value.id, 'inactiva');
      }
      detalle.value = { ...detalle.value, estado: 'inactiva', visibleEnTienda: false };
      desactivado.value = true;
      return true;
    } catch {
      error.value = 'No fue posible desactivar la marca.';
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
