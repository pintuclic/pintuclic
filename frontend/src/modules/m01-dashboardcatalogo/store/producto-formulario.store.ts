import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { ProductoFormularioService } from '../services/producto-formulario.service';
import {
  OPCIONES_FORMULARIO_DEMO,
  FORMULARIO_PRODUCTO_DEMO,
  formularioProductoVacio,
} from '../services/producto-formulario.mock';
import { validarProductoFormulario } from '../dtos/producto-formulario.dto';
import type {
  FormularioProducto,
  OpcionesFormularioProducto,
  EstadoPublicacion,
  ModoFormulario,
  SeccionChecklist,
  ProgresoChecklist,
  ColorCatalogo,
  ApiErrorResponse,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioProducto = {
  categorias: [],
  subcategorias: [],
  tiposProducto: [],
  marcas: [],
  lineas: [],
  colores: [],
};

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE PRODUCTO (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/producto-formulario.store.ts
 *
 * Estado de la vista "ADMIN 03 - Productos · Crear / editar": modelo editable,
 * catálogos de los selectores, checklist de publicación derivado y guardado
 * (borrador / publicar). Ante fallo o ausencia de endpoint usa las semillas.
 * ==============================================================================
 */
export const useProductoFormularioStore = defineStore('m01-producto-formulario', () => {
  // --- Estado --------------------------------------------------------------
  const formulario = ref<FormularioProducto>(formularioProductoVacio());
  const opciones = ref<OpcionesFormularioProducto>({ ...OPCIONES_VACIAS });
  const modo = ref<ModoFormulario>('crear');
  const productoId = ref<string | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);

  // --- Getters: opciones dependientes --------------------------------------
  const subcategoriasDisponibles = computed(() =>
    opciones.value.subcategorias.filter((s) => s.categoriaId === formulario.value.categoriaId)
  );
  const lineasDisponibles = computed(() =>
    opciones.value.lineas.filter((l) => l.marcaId === formulario.value.marcaId)
  );
  const coloresDeLaMarca = computed<ColorCatalogo[]>(() =>
    opciones.value.colores.filter((c) => c.marcaId === formulario.value.marcaId)
  );
  const colorPrincipal = computed<ColorCatalogo | null>(
    () => opciones.value.colores.find((c) => c.id === formulario.value.colorPrincipalId) ?? null
  );
  const coloresDisponibles = computed<ColorCatalogo[]>(() =>
    formulario.value.coloresDisponiblesIds
      .map((id) => opciones.value.colores.find((c) => c.id === id))
      .filter((c): c is ColorCatalogo => c !== undefined)
  );

  /** RF-CAT-02-02: las pinturas exigen línea; un producto sin color puede no declararla. */
  const requiereLinea = computed(
    () => formulario.value.categoriaId === 'pinturas' || formulario.value.claseColor === 'entonable'
  );
  const usaColor = computed(() => formulario.value.claseColor !== 'sin_color');

  // --- Getters: checklist de publicación (RF-CAT-02-05) -------------------
  const checklist = computed<SeccionChecklist[]>(() => {
    const f = formulario.value;
    return [
      {
        clave: 'informacion_general',
        etiqueta: 'Información general',
        completa: f.nombre.trim().length >= 2,
        opcional: false,
      },
      {
        clave: 'clasificacion',
        etiqueta: 'Clasificación',
        completa: Boolean(f.categoriaId && f.subcategoriaId && f.tipoProductoId),
        opcional: false,
      },
      {
        clave: 'marca_linea',
        etiqueta: 'Marca y línea',
        completa: Boolean(f.marcaId) && (!requiereLinea.value || Boolean(f.lineaId)),
        opcional: false,
      },
      {
        clave: 'clase_color',
        etiqueta: 'Clase de color',
        completa: !usaColor.value || Boolean(f.colorPrincipalId),
        opcional: false,
      },
      {
        clave: 'imagenes',
        etiqueta: 'Imágenes del producto',
        completa: f.imagenes.length > 0,
        opcional: false,
      },
      {
        clave: 'informacion_comercial',
        etiqueta: 'Información comercial',
        completa:
          f.precioVenta !== null &&
          f.precioVenta > 0 &&
          f.sku.trim().length > 0 &&
          f.stockInicial !== null &&
          f.stockInicial >= 0,
        opcional: false,
      },
      {
        clave: 'etiquetas',
        etiqueta: 'Etiquetas',
        completa: f.etiquetas.length > 0,
        opcional: true,
      },
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
      const respuesta = await ProductoFormularioService.obtenerOpciones();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FORMULARIO_DEMO;
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
      productoId.value = id;
      try {
        const respuesta = await ProductoFormularioService.obtenerProducto(id);
        formulario.value = respuesta.data;
      } catch {
        formulario.value = { ...FORMULARIO_PRODUCTO_DEMO };
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      productoId.value = null;
      formulario.value = formularioProductoVacio();
    }

    cargando.value = false;
  }

  /** Aplica cambios y reajusta dependencias (subcategoría por categoría, línea/colores por marca). */
  function actualizar(parcial: Partial<FormularioProducto>): void {
    const anterior = formulario.value;
    const siguiente: FormularioProducto = { ...anterior, ...parcial };

    if (parcial.categoriaId !== undefined && parcial.categoriaId !== anterior.categoriaId) {
      const valida = opciones.value.subcategorias.some(
        (s) => s.categoriaId === siguiente.categoriaId && s.valor === siguiente.subcategoriaId
      );
      if (!valida) siguiente.subcategoriaId = null;
    }

    if (parcial.marcaId !== undefined && parcial.marcaId !== anterior.marcaId) {
      const lineaValida = opciones.value.lineas.some(
        (l) => l.marcaId === siguiente.marcaId && l.valor === siguiente.lineaId
      );
      if (!lineaValida) siguiente.lineaId = null;

      const coloresMarca = new Set(
        opciones.value.colores.filter((c) => c.marcaId === siguiente.marcaId).map((c) => c.id)
      );
      siguiente.coloresDisponiblesIds = siguiente.coloresDisponiblesIds.filter((cid) =>
        coloresMarca.has(cid)
      );
      if (siguiente.colorPrincipalId && !coloresMarca.has(siguiente.colorPrincipalId)) {
        siguiente.colorPrincipalId = null;
        siguiente.codigoColor = '';
      }
    }

    formulario.value = siguiente;
    // Limpia los errores de los campos tocados.
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  function definirColorPrincipal(colorId: string | null): void {
    const color = opciones.value.colores.find((c) => c.id === colorId) ?? null;
    actualizar({
      colorPrincipalId: colorId,
      codigoColor: color?.codigo ?? '',
    });
  }

  function alternarColorDisponible(colorId: string): void {
    const actuales = formulario.value.coloresDisponiblesIds;
    actualizar({
      coloresDisponiblesIds: actuales.includes(colorId)
        ? actuales.filter((id) => id !== colorId)
        : [...actuales, colorId],
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

  /** Alta de imagen simulada (el upload real es HU-CAT-07, endpoint aparte). */
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
    const { valido, errores } = validarProductoFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoPublicacion): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && productoId.value
          ? await ProductoFormularioService.actualizar(productoId.value, formulario.value)
          : await ProductoFormularioService.crear(formulario.value);
      productoId.value = respuesta.data.id;
      modo.value = 'editar';
      guardadoOk.value = true;
      return true;
    } catch (e) {
      if (usandoDatosDemo.value) {
        // Sin backend: simulamos el guardado para poder revisar el flujo.
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
  const publicar = () => guardar('publicado');

  function reiniciar(): void {
    formulario.value = formularioProductoVacio();
    opciones.value = { ...OPCIONES_VACIAS };
    modo.value = 'crear';
    productoId.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    // estado
    formulario,
    opciones,
    modo,
    productoId,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    // getters
    subcategoriasDisponibles,
    lineasDisponibles,
    coloresDeLaMarca,
    colorPrincipal,
    coloresDisponibles,
    requiereLinea,
    usaColor,
    checklist,
    progresoChecklist,
    puedePublicar,
    // acciones
    inicializar,
    actualizar,
    definirColorPrincipal,
    alternarColorDisponible,
    agregarEtiqueta,
    quitarEtiqueta,
    agregarImagen,
    quitarImagen,
    marcarImagenPrincipal,
    validar,
    guardarBorrador,
    publicar,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible guardar el producto.';
}
