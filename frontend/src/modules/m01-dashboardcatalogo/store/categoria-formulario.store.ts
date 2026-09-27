import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { CategoriaFormularioService } from '../services/categoria-formulario.service';
import {
  OPCIONES_FORMULARIO_CATEGORIA_DEMO,
  CATEGORIA_FORMULARIO_DEMO,
  RESUMEN_IMPACTO_CATEGORIA_DEMO,
  formularioCategoriaVacio,
} from '../services/categoria-formulario.mock';
import {
  validarCategoriaFormulario,
  slugificar,
} from '../dtos/categoria-formulario.dto';
import type {
  FormularioCategoria,
  OpcionesFormularioCategoria,
  ResumenImpactoCategoria,
  ModoFormularioCategoria,
  TipoNodoCategoria,
  EstadoCategoria,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioCategoria = {
  categoriasPadre: [],
  filtros: [],
  lineas: [],
  arbolPreview: [],
};

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE CATEGORÍA / SUBCATEGORÍA (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/categoria-formulario.store.ts
 *
 * Estado de las maquetas "ADMIN 10" y "ADMIN 11": modelo editable, catálogos,
 * resumen de impacto y guardado. Ante fallo o ausencia de endpoint usa las
 * semillas.
 * ==============================================================================
 */
export const useCategoriaFormularioStore = defineStore('m01-categoria-formulario', () => {
  const formulario = ref<FormularioCategoria>(formularioCategoriaVacio('categoria'));
  const opciones = ref<OpcionesFormularioCategoria>({ ...OPCIONES_VACIAS });
  const resumenImpacto = ref<ResumenImpactoCategoria | null>(null);
  const modo = ref<ModoFormularioCategoria>('crear');
  const categoriaId = ref<string | null>(null);
  /** El usuario editó el slug a mano → dejar de autoderivarlo del nombre. */
  const slugManual = ref<boolean>(false);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);

  const esSubcategoria = computed(() => formulario.value.tipo === 'subcategoria');

  /** Ruta jerárquica legible: "Pinturas › Pinturas Interiores". */
  const rutaJerarquia = computed<string>(() => {
    const padre = opciones.value.categoriasPadre.find((c) => c.valor === formulario.value.padreId);
    const nombre = formulario.value.nombre || (esSubcategoria.value ? 'Nueva subcategoría' : 'Nueva categoría');
    return padre ? `${padre.etiqueta} › ${nombre}` : nombre;
  });

  // --- Acciones -----------------------------------------------------------
  async function cargarOpciones(): Promise<void> {
    try {
      const respuesta = await CategoriaFormularioService.obtenerOpciones();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FORMULARIO_CATEGORIA_DEMO;
      usandoDatosDemo.value = true;
    }
  }

  async function inicializar(opts: { id?: string | null; tipo: TipoNodoCategoria }): Promise<void> {
    cargando.value = true;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
    slugManual.value = Boolean(opts.id);

    await cargarOpciones();

    if (opts.id) {
      modo.value = 'editar';
      categoriaId.value = opts.id;
      try {
        const [cat, impacto] = await Promise.all([
          CategoriaFormularioService.obtenerCategoria(opts.id),
          CategoriaFormularioService.obtenerResumenImpacto(opts.id),
        ]);
        formulario.value = cat.data;
        resumenImpacto.value = impacto.data;
      } catch {
        formulario.value = { ...CATEGORIA_FORMULARIO_DEMO };
        resumenImpacto.value = RESUMEN_IMPACTO_CATEGORIA_DEMO;
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      categoriaId.value = null;
      resumenImpacto.value = {
        productosAsociados: 0,
        subcategorias: 0,
        visibilidadPublica: true,
        herenciaFiltros: 0,
        nivel: opts.tipo === 'subcategoria' ? 2 : 1,
      };
      formulario.value = formularioCategoriaVacio(opts.tipo);
    }

    cargando.value = false;
  }

  function actualizar(parcial: Partial<FormularioCategoria>): void {
    const siguiente = { ...formulario.value, ...parcial };
    // Autoderivar el slug del nombre mientras no se haya editado a mano.
    if (parcial.nombre !== undefined && !slugManual.value) {
      siguiente.slug = slugificar(parcial.nombre);
    }
    if (parcial.slug !== undefined) slugManual.value = true;
    formulario.value = siguiente;
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  function alternarLista(campo: 'filtros' | 'lineas', valor: string): void {
    const actuales = formulario.value[campo];
    actualizar({
      [campo]: actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor],
    } as Partial<FormularioCategoria>);
  }

  function agregarEtiqueta(texto: string): void {
    const limpia = texto.trim().toLowerCase();
    if (!limpia || formulario.value.etiquetas.includes(limpia)) return;
    actualizar({ etiquetas: [...formulario.value.etiquetas, limpia] });
  }
  function quitarEtiqueta(texto: string): void {
    actualizar({ etiquetas: formulario.value.etiquetas.filter((t) => t !== texto) });
  }

  function validar(): boolean {
    const { valido, errores } = validarCategoriaFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoCategoria): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && categoriaId.value
          ? await CategoriaFormularioService.actualizar(categoriaId.value, formulario.value)
          : await CategoriaFormularioService.crear(formulario.value);
      categoriaId.value = respuesta.data.id;
      modo.value = 'editar';
      guardadoOk.value = true;
      return true;
    } catch (e) {
      if (usandoDatosDemo.value) {
        guardadoOk.value = true;
        return true;
      }
      error.value = extraerMensajeError(e);
      return false;
    } finally {
      guardando.value = false;
    }
  }

  const guardarBorrador = () => guardar('inactivo');
  const guardarCambios = () => guardar(formulario.value.estado === 'inactivo' ? 'inactivo' : 'publicado');

  function reiniciar(): void {
    formulario.value = formularioCategoriaVacio('categoria');
    opciones.value = { ...OPCIONES_VACIAS };
    resumenImpacto.value = null;
    modo.value = 'crear';
    categoriaId.value = null;
    slugManual.value = false;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    formulario,
    opciones,
    resumenImpacto,
    modo,
    categoriaId,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    esSubcategoria,
    rutaJerarquia,
    inicializar,
    actualizar,
    alternarLista,
    agregarEtiqueta,
    quitarEtiqueta,
    validar,
    guardarBorrador,
    guardarCambios,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible guardar la categoría.';
}
