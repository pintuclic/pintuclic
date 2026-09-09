import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { ProductosService } from '../services/productos.service';
import { consultarProductosDemo, OPCIONES_FILTRO_DEMO } from '../services/productos.mock';
import {
  FILTROS_PRODUCTOS_INICIALES,
  hayFiltrosActivos as calcularFiltrosActivos,
} from '../dtos/productos.dto';
import type { FiltrosProductosDTO } from '../dtos/productos.dto';
import type {
  PaginaProductos,
  OpcionesFiltroProductos,
  ApiErrorResponse,
  OrdenProductos,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DEL LISTADO DE PRODUCTOS (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/productos.store.ts
 *
 * Mantiene los filtros vigentes, la página cargada y los catálogos de la barra
 * de filtros. El filtrado/paginado real ocurre en el backend; ante fallo o
 * ausencia del endpoint cae a la semilla local (services/productos.mock.ts).
 * ==============================================================================
 */
export const useProductosStore = defineStore('m01-productos', () => {
  // --- Estado --------------------------------------------------------------
  const filtros = ref<FiltrosProductosDTO>({ ...FILTROS_PRODUCTOS_INICIALES });
  const pagina = ref<PaginaProductos | null>(null);
  const opciones = ref<OpcionesFiltroProductos>({ categorias: [], marcas: [], lineas: [] });
  const cargando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  // --- Getters -----------------------------------------------------------------
  const items = computed(() => pagina.value?.items ?? []);
  const total = computed(() => pagina.value?.total ?? 0);
  const totalPaginas = computed(() => pagina.value?.totalPaginas ?? 1);
  const hayFiltrosActivos = computed(() => calcularFiltrosActivos(filtros.value));
  const cargado = computed(() => pagina.value !== null);

  // --- Acciones --------------------------------------------------------------
  async function cargarOpciones(): Promise<void> {
    if (opciones.value.categorias.length > 0) return;
    try {
      const respuesta = await ProductosService.opcionesFiltro();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FILTRO_DEMO;
    }
  }

  /** Pide al backend la página actual según `filtros`. */
  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const respuesta = await ProductosService.listar(filtros.value);
      pagina.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch (e) {
      error.value = extraerMensajeError(e);
      pagina.value = consultarProductosDemo(filtros.value);
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  /** Carga inicial: catálogos de filtro + primera página. */
  async function inicializar(): Promise<void> {
    await Promise.all([cargarOpciones(), cargar()]);
  }

  /** Aplica cambios de filtro y vuelve a la primera página. */
  async function aplicarFiltros(parcial: Partial<FiltrosProductosDTO>): Promise<void> {
    filtros.value = { ...filtros.value, ...parcial, pagina: 1 };
    await cargar();
  }

  async function ordenarPor(orden: OrdenProductos): Promise<void> {
    await aplicarFiltros({ orden });
  }

  async function irAPagina(numero: number): Promise<void> {
    const destino = Math.min(Math.max(1, numero), totalPaginas.value);
    if (destino === filtros.value.pagina) return;
    filtros.value = { ...filtros.value, pagina: destino };
    await cargar();
  }

  async function limpiarFiltros(): Promise<void> {
    filtros.value = { ...FILTROS_PRODUCTOS_INICIALES };
    await cargar();
  }

  function reiniciar(): void {
    filtros.value = { ...FILTROS_PRODUCTOS_INICIALES };
    pagina.value = null;
    error.value = null;
    usandoDatosDemo.value = false;
  }

  return {
    // estado
    filtros,
    pagina,
    opciones,
    cargando,
    error,
    usandoDatosDemo,
    // getters
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    cargado,
    // acciones
    inicializar,
    cargar,
    aplicarFiltros,
    ordenarPor,
    irAPagina,
    limpiarFiltros,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible cargar el listado de productos.';
}
