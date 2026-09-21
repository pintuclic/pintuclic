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
import { hexACielab } from '../composables/useColorCielab';
import type {
  FormularioColor,
  OpcionesFormularioColor,
  ModoFormularioColor,
  PayloadColor,
  ResumenColorPrevia,
  ImpactoColor,
  EstadoColor,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioColor = { marcas: [], familias: [] };
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
  /** Valor cromático que realmente viaja al backend (RF-CAT-05-02). */
  const cielab = computed(() => hexACielab(formulario.value.hex));
  const familiaNombre = computed(
    () => opciones.value.familias.find((f) => f.valor === formulario.value.familiaClave)?.etiqueta ?? '—'
  );
  const marcaNombre = computed(
    () => opciones.value.marcas.find((m) => m.valor === formulario.value.marcaId)?.etiqueta ?? '—'
  );

  const impacto = computed<ImpactoColor[]>(() => {
    const f = formulario.value;
    return [
      { clave: 'marca', etiqueta: 'Marca asignada', detalle: 'Todo color pertenece a una marca', cumple: f.marcaId.trim().length > 0 },
      { clave: 'familia', etiqueta: 'Familia cromática asignada', detalle: 'Permite filtrar el catálogo por familia', cumple: f.familiaClave.trim().length > 0 },
      { clave: 'codigo', etiqueta: 'Código interno definido', detalle: 'Facilita la trazabilidad con proveedores (opcional)', cumple: f.codigo.trim().length > 0 },
      { clave: 'cromatico', etiqueta: 'Valor cromático válido', detalle: 'CIELAB derivado del HEX; igual en todos los dispositivos', cumple: cielab.value !== null },
    ];
  });

  /** Construye el payload real: deriva `cielab` del HEX y omite el código vacío. */
  function construirPayload(): PayloadColor | null {
    const f = formulario.value;
    const valorCielab = hexACielab(f.hex);
    if (!valorCielab) return null;
    const codigo = f.codigo.trim();
    return {
      nombre: f.nombre.trim(),
      marcaId: f.marcaId,
      ...(codigo ? { codigo } : {}),
      cielab: valorCielab,
      familiaClave: f.familiaClave,
      estado: f.estado,
    };
  }

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
    const payload = construirPayload();
    if (!payload) {
      erroresValidacion.value = { hex: 'Usa un HEX válido, p. ej. #FFC928' };
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && colorId.value
          ? await ColorFormularioService.actualizar(colorId.value, payload)
          : await ColorFormularioService.crear(payload);
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
    cielab,
    familiaNombre,
    marcaNombre,
    impacto,
    inicializar,
    actualizar,
    actualizarRgb,
    construirPayload,
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
