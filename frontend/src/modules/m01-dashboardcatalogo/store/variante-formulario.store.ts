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
import { validarImagenProducto } from '../dtos/producto-formulario.dto';
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
  bases: [],
  colores: [],
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

  const checklist = computed<SeccionChecklistVariante[]>(() => {
    const f = formulario.value;
    const producto = productoAsociado.value;
    const requierePresentacion = producto?.requierePresentacion ?? true;
    const requiereColor = producto?.requiereColor ?? true;
    const baseOColor = !requiereColor || Boolean(f.baseId) || Boolean(f.colorId);
    return [
      { clave: 'producto', etiqueta: 'Producto asociado', completa: Boolean(f.productoId), opcional: false },
      {
        clave: 'presentacion',
        etiqueta: 'Presentación',
        completa: !requierePresentacion || Boolean(f.presentacionId),
        opcional: false,
      },
      { clave: 'base_color', etiqueta: 'Base y color', completa: baseOColor, opcional: !requiereColor },
      {
        clave: 'comercial',
        etiqueta: 'Precio y existencia',
        completa: f.precioVigente !== null && f.precioVigente >= 0,
        opcional: false,
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

  /**
   * Aplica cambios al formulario. Al cambiar de producto, normaliza los campos
   * que no aplican a ese producto (p. ej. una herramienta no tiene presentación
   * ni base/color) para que no queden huérfanos ni bloqueen el checklist de
   * publicación.
   */
  function actualizar(parcial: Partial<FormularioVariante>): void {
    let cambios: Partial<FormularioVariante> = parcial;
    if ('productoId' in parcial) {
      const producto = opciones.value.productos.find((p) => p.valor === parcial.productoId) ?? null;
      if (producto && !producto.requierePresentacion) {
        cambios = { ...cambios, presentacionId: null };
      }
      if (producto && !producto.requiereColor) {
        cambios = { ...cambios, baseId: null, colorId: null };
      }
    }
    formulario.value = { ...formulario.value, ...cambios };
    for (const campo of Object.keys(cambios)) delete erroresValidacion.value[campo];
  }

  function definirColor(colorId: string | null): void {
    actualizar({ colorId });
  }

  function definirBase(baseId: string | null): void {
    actualizar({ baseId });
  }

  /** Mismas reglas de `CrearImagenDto` que en el formulario de producto. */
  function agregarImagen(nombre: string, url = ''): string | null {
    const mensaje = validarImagenProducto(url);
    if (mensaje) {
      erroresValidacion.value = { ...erroresValidacion.value, imagenes: mensaje };
      return mensaje;
    }
    const nueva = {
      id: `img-${Date.now()}`,
      url,
      nombre,
      orden: formulario.value.imagenes.length,
      esPrincipal: formulario.value.imagenes.length === 0,
    };
    actualizar({ imagenes: [...formulario.value.imagenes, nueva] });
    return null;
  }

  function quitarImagen(id: string): void {
    const restantes = formulario.value.imagenes.filter((img) => img.id !== id);
    const necesitaPrincipal = restantes.length > 0 && !restantes.some((img) => img.esPrincipal);
    actualizar({
      imagenes: restantes.map((img, i) => ({
        ...img,
        orden: i,
        esPrincipal: necesitaPrincipal ? i === 0 : img.esPrincipal,
      })),
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
    checklist,
    progresoChecklist,
    puedePublicar,
    inicializar,
    actualizar,
    definirColor,
    definirBase,
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
