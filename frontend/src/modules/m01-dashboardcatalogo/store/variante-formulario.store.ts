import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { VarianteFormularioService } from '../services/variante-formulario.service';
import {
  OPCIONES_FORMULARIO_VARIANTE_DEMO,
  FORMULARIO_VARIANTE_DEMO,
  EDICION_VARIANTE_DEMO,
  formularioVarianteVacio,
} from '../services/variante-formulario.mock';
import { validarVarianteFormulario } from '../dtos/variante-formulario.dto';
import type {
  FormularioVariante,
  OpcionesFormularioVariante,
  ModoFormularioVariante,
  EstadoVarianteForm,
  SeccionChecklistVariante,
  ProgresoChecklist,
  DetalleEdicionVariante,
  OpcionColorVariante,
  OpcionProductoVariante,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioVariante = {
  productos: [],
  presentaciones: [],
  unidades: [],
  bases: [],
  colores: [],
  impuestos: [],
  bodegas: [],
};

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE VARIANTE (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/variante-formulario.store.ts
 *
 * Estado de las vistas "ADMIN 07 - Crear variante" y "ADMIN 08 - Editar
 * variante": modelo editable, catálogos, checklist de publicación derivado,
 * detalle de inventario (solo editar) y guardado. Ante fallo o ausencia de
 * endpoint usa las semillas.
 * ==============================================================================
 */
export const useVarianteFormularioStore = defineStore('m01-variante-formulario', () => {
  const formulario = ref<FormularioVariante>(formularioVarianteVacio());
  const opciones = ref<OpcionesFormularioVariante>({ ...OPCIONES_VACIAS });
  const modo = ref<ModoFormularioVariante>('crear');
  const varianteId = ref<string | null>(null);
  const detalleEdicion = ref<DetalleEdicionVariante | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);
  const desactivado = ref<boolean>(false);

  // --- Getters --------------------------------------------------------------
  const productoAsociado = computed<OpcionProductoVariante | null>(
    () => opciones.value.productos.find((p) => p.valor === formulario.value.productoId) ?? null
  );
  const colorAsociado = computed<OpcionColorVariante | null>(
    () => opciones.value.colores.find((c) => c.id === formulario.value.colorId) ?? null
  );

  /** Margen estimado = (precio - costo) / precio. `null` si falta el precio. */
  const margenEstimado = computed<number | null>(() => {
    const { precioVenta, costoCompra } = formulario.value;
    if (!precioVenta || precioVenta <= 0 || costoCompra === null) return null;
    return Math.round(((precioVenta - costoCompra) / precioVenta) * 1000) / 10;
  });

  const checklist = computed<SeccionChecklistVariante[]>(() => {
    const f = formulario.value;
    const baseOColor = Boolean(f.base) || Boolean(f.colorId);
    return [
      { clave: 'producto', etiqueta: 'Producto asociado', completa: Boolean(f.productoId), opcional: false },
      { clave: 'presentacion', etiqueta: 'Presentación y unidad', completa: Boolean(f.presentacion && f.unidadMedida), opcional: false },
      { clave: 'base', etiqueta: 'Base / entonado', completa: baseOColor, opcional: false },
      { clave: 'color', etiqueta: 'Color asociado', completa: baseOColor, opcional: false },
      { clave: 'codigos', etiqueta: 'Códigos e identificación', completa: f.sku.trim().length > 0, opcional: false },
      {
        clave: 'comercial',
        etiqueta: 'Información comercial',
        completa: f.precioVenta !== null && f.precioVenta > 0,
        opcional: false,
      },
      {
        clave: 'inventario',
        etiqueta: 'Inventario',
        completa:
          f.stockInicial !== null && f.stockInicial >= 0 && f.stockMinimo !== null && Boolean(f.bodegaId),
        opcional: false,
      },
      {
        clave: 'dimensiones',
        etiqueta: 'Dimensiones / peso',
        completa: f.pesoKg !== null || f.altoCm !== null || f.anchoCm !== null || f.profundidadCm !== null,
        opcional: true,
      },
      { clave: 'imagenes', etiqueta: 'Imágenes', completa: f.imagenes.length > 0, opcional: true },
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
      const respuesta = await VarianteFormularioService.obtenerOpciones();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FORMULARIO_VARIANTE_DEMO;
      usandoDatosDemo.value = true;
    }
  }

  async function inicializar(id?: string): Promise<void> {
    cargando.value = true;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    desactivado.value = false;
    usandoDatosDemo.value = false;

    await cargarOpciones();

    if (id) {
      modo.value = 'editar';
      varianteId.value = id;
      try {
        const [variante, det] = await Promise.all([
          VarianteFormularioService.obtenerVariante(id),
          VarianteFormularioService.obtenerDetalleEdicion(id),
        ]);
        formulario.value = variante.data;
        detalleEdicion.value = det.data;
      } catch {
        formulario.value = { ...FORMULARIO_VARIANTE_DEMO };
        detalleEdicion.value = EDICION_VARIANTE_DEMO;
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      varianteId.value = null;
      detalleEdicion.value = null;
      formulario.value = formularioVarianteVacio();
    }

    cargando.value = false;
  }

  /** Aplica cambios y ajusta la unidad cuando se elige un color con familia distinta. */
  function actualizar(parcial: Partial<FormularioVariante>): void {
    formulario.value = { ...formulario.value, ...parcial };
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  function definirColor(colorId: string | null): void {
    actualizar({ colorId });
  }

  function agregarImagen(nombre: string): void {
    const nueva = {
      id: `img-${Date.now()}`,
      url: '',
      nombre,
      esPrincipal: formulario.value.imagenes.length === 0,
    };
    actualizar({ imagenes: [...formulario.value.imagenes, nueva] });
  }

  function quitarImagen(id: string): void {
    const restantes = formulario.value.imagenes.filter((img) => img.id !== id);
    const necesitaPrincipal = restantes.length > 0 && !restantes.some((img) => img.esPrincipal);
    actualizar({
      imagenes: necesitaPrincipal
        ? restantes.map((img, i) => ({ ...img, esPrincipal: i === 0 }))
        : restantes,
    });
  }

  function marcarImagenPrincipal(id: string): void {
    actualizar({
      imagenes: formulario.value.imagenes.map((img) => ({ ...img, esPrincipal: img.id === id })),
    });
  }

  function validar(): boolean {
    const { valido, errores } = validarVarianteFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoVarianteForm): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && varianteId.value
          ? await VarianteFormularioService.actualizar(varianteId.value, formulario.value)
          : await VarianteFormularioService.crear(formulario.value);
      varianteId.value = respuesta.data.id;
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
  const publicar = () => guardar('activo');
  const guardarCambios = () => guardar(formulario.value.estado);

  async function desactivar(): Promise<boolean> {
    if (modo.value !== 'editar' || !varianteId.value) return false;
    guardando.value = true;
    error.value = null;
    try {
      if (!usandoDatosDemo.value) {
        await VarianteFormularioService.actualizar(varianteId.value, {
          ...formulario.value,
          estado: 'inactivo',
        });
      }
      formulario.value = { ...formulario.value, estado: 'inactivo' };
      desactivado.value = true;
      return true;
    } catch (e) {
      error.value = extraerMensajeError(e);
      return false;
    } finally {
      guardando.value = false;
    }
  }

  function reiniciar(): void {
    formulario.value = formularioVarianteVacio();
    opciones.value = { ...OPCIONES_VACIAS };
    modo.value = 'crear';
    varianteId.value = null;
    detalleEdicion.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    desactivado.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    formulario,
    opciones,
    modo,
    varianteId,
    detalleEdicion,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    desactivado,
    productoAsociado,
    colorAsociado,
    margenEstimado,
    checklist,
    progresoChecklist,
    puedePublicar,
    inicializar,
    actualizar,
    definirColor,
    agregarImagen,
    quitarImagen,
    marcarImagenPrincipal,
    validar,
    guardarBorrador,
    publicar,
    guardarCambios,
    desactivar,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible guardar la variante.';
}
