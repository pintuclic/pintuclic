import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { ColorFormularioService } from '../services/color-formulario.service';
import {
  OPCIONES_FORMULARIO_COLOR_DEMO,
  FORMULARIO_COLOR_DEMO,
  RESUMEN_COLOR_PREVIA_DEMO,
  formularioColorVacio,
} from '../services/color-formulario.mock';
import { validarColorFormulario, hexARgb } from '../dtos/color-formulario.dto';
import type {
  FormularioColor,
  OpcionesFormularioColor,
  ModoFormularioColor,
  ResumenColorPrevia,
  ImpactoColor,
  EstadoColor,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioColor = { familias: [], bases: [] };
const PREVIA_VACIA: ResumenColorPrevia = { productos: 0, variantes: 0, coloresRelacionados: [] };

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE COLOR (Pinia, sintaxis setup)
 * Maqueta "ADMIN 18 - Crear / editar color".
 * ==============================================================================
 */
export const useColorFormularioStore = defineStore('m01-color-formulario', () => {
  const formulario = ref<FormularioColor>(formularioColorVacio());
  const opciones = ref<OpcionesFormularioColor>({ ...OPCIONES_VACIAS });
  const previa = ref<ResumenColorPrevia>({ ...PREVIA_VACIA });
  const modo = ref<ModoFormularioColor>('crear');
  const colorId = ref<string | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);

  const rgb = computed(() => hexARgb(formulario.value.hex));
  const familiaNombre = computed(
    () => opciones.value.familias.find((f) => f.valor === formulario.value.familiaClave)?.etiqueta ?? '—'
  );

  const impacto = computed<ImpactoColor[]>(() => {
    const f = formulario.value;
    return [
      { clave: 'tienda', etiqueta: 'Disponible para productos', detalle: 'Visible en la tienda y buscadores', cumple: f.mostrarEnTienda },
      { clave: 'bases', etiqueta: `Compatible con ${f.basesCompatibles.length} base(s)`, detalle: 'Bases sobre las que se prepara', cumple: f.basesCompatibles.length > 0 },
      { clave: 'seo', etiqueta: 'Optimizado para SEO', detalle: 'Título y meta descripción definidos', cumple: f.tituloSeo.trim().length > 0 },
      { clave: 'cromatico', etiqueta: 'Valor cromático válido', detalle: 'Se visualiza igual en todos los dispositivos', cumple: rgb.value !== null },
    ];
  });

  async function cargarOpciones(): Promise<void> {
    try {
      const respuesta = await ColorFormularioService.obtenerOpciones();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FORMULARIO_COLOR_DEMO;
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
      colorId.value = id;
      try {
        const respuesta = await ColorFormularioService.obtenerColor(id);
        formulario.value = respuesta.data;
        previa.value = { ...RESUMEN_COLOR_PREVIA_DEMO };
      } catch {
        formulario.value = { ...FORMULARIO_COLOR_DEMO };
        previa.value = { ...RESUMEN_COLOR_PREVIA_DEMO };
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      colorId.value = null;
      formulario.value = formularioColorVacio();
      previa.value = { ...PREVIA_VACIA };
    }

    cargando.value = false;
  }

  function actualizar(parcial: Partial<FormularioColor>): void {
    formulario.value = { ...formulario.value, ...parcial };
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  /** Ajusta el HEX desde componentes RGB (para los inputs R/G/B). */
  function actualizarRgb(canal: 'r' | 'g' | 'b', valor: number): void {
    const actual = rgb.value ?? { r: 0, g: 0, b: 0 };
    const limitado = Math.max(0, Math.min(255, Math.round(valor) || 0));
    const siguiente = { ...actual, [canal]: limitado };
    const hex =
      '#' +
      [siguiente.r, siguiente.g, siguiente.b]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    actualizar({ hex });
  }

  function alternarBase(valor: string): void {
    const actuales = formulario.value.basesCompatibles;
    actualizar({
      basesCompatibles: actuales.includes(valor)
        ? actuales.filter((b) => b !== valor)
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
    const { valido, errores } = validarColorFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoColor): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }
    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && colorId.value
          ? await ColorFormularioService.actualizar(colorId.value, formulario.value)
          : await ColorFormularioService.crear(formulario.value);
      colorId.value = respuesta.data.id;
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

  const guardarBorrador = () => guardar('borrador');
  const guardarCambios = () => guardar(formulario.value.estado === 'borrador' ? 'borrador' : 'publicado');

  function reiniciar(): void {
    formulario.value = formularioColorVacio();
    opciones.value = { ...OPCIONES_VACIAS };
    previa.value = { ...PREVIA_VACIA };
    modo.value = 'crear';
    colorId.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    formulario,
    opciones,
    previa,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    rgb,
    familiaNombre,
    impacto,
    inicializar,
    actualizar,
    actualizarRgb,
    alternarBase,
    agregarEtiqueta,
    quitarEtiqueta,
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
  return 'No fue posible guardar el color.';
}
