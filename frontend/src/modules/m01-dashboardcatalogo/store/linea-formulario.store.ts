import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { LineaFormularioService } from '../services/linea-formulario.service';
import {
  OPCIONES_FORMULARIO_LINEA_DEMO,
  FORMULARIO_LINEA_DEMO,
  RESUMEN_IMPACTO_LINEA_DEMO,
  formularioLineaVacio,
} from '../services/linea-formulario.mock';
import { validarLineaFormulario } from '../dtos/linea-formulario.dto';
import type {
  FormularioLinea,
  OpcionesFormularioLinea,
  ModoFormularioLinea,
  SeccionChecklistLinea,
  ProgresoChecklist,
  ResumenImpactoLinea,
  EstadoLinea,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioLinea = {
  marcas: [],
  categorias: [],
  subcategorias: [],
  tiposLinea: [],
  productos: [],
};

const IMPACTO_VACIO: ResumenImpactoLinea = { productosAsociados: 0, reglasVigentes: 0 };

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE LÍNEA COMERCIAL (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/linea-formulario.store.ts
 *
 * Estado de la maqueta "ADMIN 16 - Crear / editar línea": modelo editable,
 * catálogos, checklist de publicación derivado, resumen de impacto y guardado.
 * Ante fallo o ausencia de endpoint usa las semillas locales.
 * ==============================================================================
 */
export const useLineaFormularioStore = defineStore('m01-linea-formulario', () => {
  const formulario = ref<FormularioLinea>(formularioLineaVacio());
  const opciones = ref<OpcionesFormularioLinea>({ ...OPCIONES_VACIAS });
  const impacto = ref<ResumenImpactoLinea>({ ...IMPACTO_VACIO });
  const modo = ref<ModoFormularioLinea>('crear');
  const lineaId = ref<string | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);

  const checklist = computed<SeccionChecklistLinea[]>(() => {
    const f = formulario.value;
    return [
      { clave: 'general', etiqueta: 'Información general', completa: f.nombre.trim().length >= 2 && f.descripcion.trim().length > 0, opcional: false },
      { clave: 'clasificacion', etiqueta: 'Clasificación y uso', completa: f.marca.trim().length > 0 && f.categoria.trim().length > 0, opcional: false },
      { clave: 'productos', etiqueta: 'Productos asociados', completa: f.productosAsociados.length > 0, opcional: false },
      { clave: 'visibilidad', etiqueta: 'Estado y visibilidad', completa: f.mostrarEnCatalogo || f.mostrarEnFiltros, opcional: false },
      { clave: 'seo', etiqueta: 'Etiquetas / SEO', completa: f.etiquetas.length > 0, opcional: true },
      { clave: 'notas', etiqueta: 'Notas internas', completa: f.notasInternas.trim().length > 0, opcional: true },
    ];
  });

  const progresoChecklist = computed<ProgresoChecklist>(() => ({
    completas: checklist.value.filter((s) => s.completa).length,
    total: checklist.value.length,
  }));

  const puedePublicar = computed(() =>
    checklist.value.filter((s) => !s.opcional).every((s) => s.completa)
  );

  // --- Acciones -----------------------------------------------------------
  async function cargarOpciones(): Promise<void> {
    try {
      const respuesta = await LineaFormularioService.obtenerOpciones();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FORMULARIO_LINEA_DEMO;
      usandoDatosDemo.value = true;
    }
  }

  async function inicializar(id?: string): Promise<void> {
    cargando.value = true;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;

    await cargarOpciones();

    if (id) {
      modo.value = 'editar';
      lineaId.value = id;
      try {
        const respuesta = await LineaFormularioService.obtenerLinea(id);
        formulario.value = respuesta.data;
        impacto.value = { ...RESUMEN_IMPACTO_LINEA_DEMO };
      } catch {
        formulario.value = { ...FORMULARIO_LINEA_DEMO };
        impacto.value = { ...RESUMEN_IMPACTO_LINEA_DEMO };
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      lineaId.value = null;
      formulario.value = formularioLineaVacio();
      impacto.value = { ...IMPACTO_VACIO };
    }

    cargando.value = false;
  }

  function actualizar(parcial: Partial<FormularioLinea>): void {
    formulario.value = { ...formulario.value, ...parcial };
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  function alternarProducto(valor: string): void {
    const actuales = formulario.value.productosAsociados;
    actualizar({
      productosAsociados: actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor],
    });
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
    const { valido, errores } = validarLineaFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoLinea): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && lineaId.value
          ? await LineaFormularioService.actualizar(lineaId.value, formulario.value)
          : await LineaFormularioService.crear(formulario.value);
      lineaId.value = respuesta.data.id;
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

  const guardarBorrador = () => guardar('pausada');
  const guardarCambios = () => guardar(formulario.value.estado === 'inactiva' ? 'inactiva' : 'activa');

  function reiniciar(): void {
    formulario.value = formularioLineaVacio();
    opciones.value = { ...OPCIONES_VACIAS };
    impacto.value = { ...IMPACTO_VACIO };
    modo.value = 'crear';
    lineaId.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    formulario,
    opciones,
    impacto,
    modo,
    lineaId,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    checklist,
    progresoChecklist,
    puedePublicar,
    inicializar,
    actualizar,
    alternarProducto,
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
  return 'No fue posible guardar la línea comercial.';
}
