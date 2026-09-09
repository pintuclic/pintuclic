import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CategoriasService } from '../services/categorias.service';
import {
  ARBOL_CATEGORIAS_DEMO,
  CATEGORIA_INICIAL_DEMO,
  detalleCategoriaDemo,
} from '../services/categorias.mock';
import { FILTROS_ELEMENTOS_INICIALES } from '../dtos/categorias.dto';
import type { FiltrosElementosCategoriaDTO } from '../dtos/categorias.dto';
import type {
  CategoriaConHijos,
  DetalleCategoria,
  NodoCategoria,
  CampoOrdenElementoCategoria,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DE CATEGORÍAS Y SUBCATEGORÍAS (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/categorias.store.ts
 *
 * Árbol de estructura (izquierda), categoría seleccionada y su detalle
 * (derecha), con búsqueda en el árbol y filtro/orden local de la tabla de
 * elementos (HU-CAT-01).
 * ==============================================================================
 */
export const useCategoriasStore = defineStore('m01-categorias', () => {
  const arbol = ref<CategoriaConHijos[]>([]);
  const seleccionadaId = ref<string | null>(null);
  const detalle = ref<DetalleCategoria | null>(null);
  const busquedaArbol = ref<string>('');
  const expandidas = ref<Set<string>>(new Set());
  const filtrosElementos = ref<FiltrosElementosCategoriaDTO>({
    ...FILTROS_ELEMENTOS_INICIALES,
    orden: { ...FILTROS_ELEMENTOS_INICIALES.orden },
  });

  const cargando = ref<boolean>(false);
  const cargandoDetalle = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  // --- Getters ---------------------------------------------------------------
  const arbolFiltrado = computed<CategoriaConHijos[]>(() => {
    const q = busquedaArbol.value.trim().toLowerCase();
    if (!q) return arbol.value;
    return arbol.value
      .map((cat) => {
        const hijos = cat.hijos.filter((h) => h.nombre.toLowerCase().includes(q));
        if (cat.nombre.toLowerCase().includes(q) || hijos.length > 0) {
          return { ...cat, hijos: cat.nombre.toLowerCase().includes(q) ? cat.hijos : hijos };
        }
        return null;
      })
      .filter((c): c is CategoriaConHijos => c !== null);
  });

  const elementosFiltrados = computed<NodoCategoria[]>(() => {
    if (!detalle.value) return [];
    const f = filtrosElementos.value;
    const q = f.busqueda.trim().toLowerCase();

    const filtrados = detalle.value.elementos.filter((el) => {
      if (q && !el.nombre.toLowerCase().includes(q)) return false;
      if (f.tipo && el.tipo !== f.tipo) return false;
      if (f.estado && el.estado !== f.estado) return false;
      return true;
    });

    const dir = f.orden.direccion === 'asc' ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      switch (f.orden.campo) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre, 'es') * dir;
        case 'tipo':
          return a.tipo.localeCompare(b.tipo, 'es') * dir;
        case 'padre':
          return (a.padreNombre ?? '').localeCompare(b.padreNombre ?? '', 'es') * dir;
        case 'productos':
          return (a.productosAsociados - b.productosAsociados) * dir;
        case 'estado':
          return a.estado.localeCompare(b.estado, 'es') * dir;
        case 'orden':
        default:
          return (a.orden - b.orden) * dir;
      }
    });
  });

  const totalElementos = computed(() => detalle.value?.elementos.length ?? 0);

  // --- Acciones ------------------------------------------------------------
  async function cargarArbol(): Promise<void> {
    try {
      const respuesta = await CategoriasService.obtenerArbol();
      arbol.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch {
      arbol.value = ARBOL_CATEGORIAS_DEMO;
      usandoDatosDemo.value = true;
    }
  }

  async function seleccionar(id: string): Promise<void> {
    seleccionadaId.value = id;
    expandidas.value = new Set(expandidas.value).add(id);
    cargandoDetalle.value = true;
    try {
      const respuesta = await CategoriasService.obtenerDetalle(id);
      detalle.value = respuesta.data;
    } catch {
      detalle.value = detalleCategoriaDemo(id);
      usandoDatosDemo.value = true;
    } finally {
      cargandoDetalle.value = false;
    }
  }

  async function inicializar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    await cargarArbol();
    const primera = arbol.value[0]?.id ?? CATEGORIA_INICIAL_DEMO;
    await seleccionar(primera);
    cargando.value = false;
  }

  function alternarExpandida(id: string): void {
    const copia = new Set(expandidas.value);
    if (copia.has(id)) copia.delete(id);
    else copia.add(id);
    expandidas.value = copia;
  }

  function buscarEnArbol(texto: string): void {
    busquedaArbol.value = texto;
  }

  function aplicarFiltroElementos(parcial: Partial<FiltrosElementosCategoriaDTO>): void {
    filtrosElementos.value = { ...filtrosElementos.value, ...parcial };
  }

  function ordenarElementosPor(campo: CampoOrdenElementoCategoria): void {
    const actual = filtrosElementos.value.orden;
    const direccion = actual.campo === campo && actual.direccion === 'asc' ? 'desc' : 'asc';
    filtrosElementos.value = { ...filtrosElementos.value, orden: { campo, direccion } };
  }

  function limpiarFiltroElementos(): void {
    filtrosElementos.value = {
      ...FILTROS_ELEMENTOS_INICIALES,
      orden: { ...filtrosElementos.value.orden },
    };
  }

  function reiniciar(): void {
    arbol.value = [];
    seleccionadaId.value = null;
    detalle.value = null;
    busquedaArbol.value = '';
    expandidas.value = new Set();
    error.value = null;
    usandoDatosDemo.value = false;
  }

  return {
    arbol,
    seleccionadaId,
    detalle,
    busquedaArbol,
    expandidas,
    filtrosElementos,
    cargando,
    cargandoDetalle,
    error,
    usandoDatosDemo,
    arbolFiltrado,
    elementosFiltrados,
    totalElementos,
    inicializar,
    seleccionar,
    alternarExpandida,
    buscarEnArbol,
    aplicarFiltroElementos,
    ordenarElementosPor,
    limpiarFiltroElementos,
    reiniciar,
  };
});
