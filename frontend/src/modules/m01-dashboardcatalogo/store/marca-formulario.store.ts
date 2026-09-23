import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { MarcaFormularioService } from '../services/marca-formulario.service';
import {
  OPCIONES_FORMULARIO_MARCA_DEMO,
  FORMULARIO_MARCA_DEMO,
  formularioMarcaVacio,
} from '../services/marca-formulario.mock';
import { validarMarcaFormulario } from '../dtos/marca-formulario.dto';
import type {
  FormularioMarca,
  OpcionesFormularioMarca,
  ModoFormularioMarca,
  SeccionChecklistMarca,
  ProgresoChecklist,
  ResumenPreviaMarca,
  EstadoMarca,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioMarca = {
  paises: [],
  lineas: [],
  bases: [],
  politicasColor: [],
};

const PREVIA_VACIA: ResumenPreviaMarca = { productos: 0, lineas: 0, colores: 0 };

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE MARCA (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/marca-formulario.store.ts
 *
 * Estado de la maqueta "ADMIN 13 - Crear / editar marca": modelo editable,
 * catálogos, checklist de publicación derivado, resumen de la vista previa y
 * guardado. Ante fallo o ausencia de endpoint usa las semillas.
 * ==============================================================================
 */
export const useMarcaFormularioStore = defineStore('m01-marca-formulario', () => {
  const formulario = ref<FormularioMarca>(formularioMarcaVacio());
  const opciones = ref<OpcionesFormularioMarca>({ ...OPCIONES_VACIAS });
  const resumenPrevia = ref<ResumenPreviaMarca>({ ...PREVIA_VACIA });
  const modo = ref<ModoFormularioMarca>('crear');
  const marcaId = ref<string | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);

  const checklist = computed<SeccionChecklistMarca[]>(() => {
    const f = formulario.value;
    return [
      { clave: 'general', etiqueta: 'Información general', completa: f.nombre.trim().length >= 2 && f.descripcion.trim().length > 0, opcional: false },
      { clave: 'identidad', etiqueta: 'Identidad visual (logo)', completa: Boolean(f.logoUrl), opcional: false },
      { clave: 'datos', etiqueta: 'Datos de la marca', completa: f.sitioWeb.trim().length > 0 || f.paisOrigen.trim().length > 0, opcional: false },
      { clave: 'relaciones', etiqueta: 'Relaciones del catálogo', completa: f.lineas.length > 0, opcional: false },
      { clave: 'seo', etiqueta: 'SEO y etiquetas', completa: f.tituloSeo.trim().length > 0 || f.etiquetas.length > 0, opcional: false },
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
      const respuesta = await MarcaFormularioService.obtenerOpciones();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FORMULARIO_MARCA_DEMO;
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
      marcaId.value = id;
      try {
        const respuesta = await MarcaFormularioService.obtenerMarca(id);
        formulario.value = respuesta.data;
        resumenPrevia.value = { productos: 245, lineas: respuesta.data.lineas.length, colores: 72 };
      } catch {
        formulario.value = { ...FORMULARIO_MARCA_DEMO };
        resumenPrevia.value = { productos: 245, lineas: 5, colores: 72 };
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      marcaId.value = null;
      formulario.value = formularioMarcaVacio();
      resumenPrevia.value = { ...PREVIA_VACIA };
    }

    cargando.value = false;
  }

  function actualizar(parcial: Partial<FormularioMarca>): void {
    formulario.value = { ...formulario.value, ...parcial };
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  function alternarLista(campo: 'lineas' | 'basesCompatibles', valor: string): void {
    const actuales = formulario.value[campo];
    actualizar({
      [campo]: actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor],
    } as Partial<FormularioMarca>);
  }

  function agregarEtiqueta(texto: string): void {
    const limpia = texto.trim().toLowerCase();
    if (!limpia || formulario.value.etiquetas.includes(limpia)) return;
    actualizar({ etiquetas: [...formulario.value.etiquetas, limpia] });
  }
  function quitarEtiqueta(texto: string): void {
    actualizar({ etiquetas: formulario.value.etiquetas.filter((t) => t !== texto) });
  }
  function quitarLogo(): void {
    actualizar({ logoUrl: null });
  }

  function validar(): boolean {
    const { valido, errores } = validarMarcaFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoMarca): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && marcaId.value
          ? await MarcaFormularioService.actualizar(marcaId.value, formulario.value)
          : await MarcaFormularioService.crear(formulario.value);
      marcaId.value = respuesta.data.id;
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

  const guardarBorrador = () => guardar('inactiva');
  const guardarCambios = () => guardar(formulario.value.estado === 'inactiva' ? 'inactiva' : 'activa');

  function reiniciar(): void {
    formulario.value = formularioMarcaVacio();
    opciones.value = { ...OPCIONES_VACIAS };
    resumenPrevia.value = { ...PREVIA_VACIA };
    modo.value = 'crear';
    marcaId.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    formulario,
    opciones,
    resumenPrevia,
    modo,
    marcaId,
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
    alternarLista,
    agregarEtiqueta,
    quitarEtiqueta,
    quitarLogo,
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
  return 'No fue posible guardar la marca.';
}
