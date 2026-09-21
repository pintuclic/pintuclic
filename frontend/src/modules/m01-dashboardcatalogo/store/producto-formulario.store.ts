import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { ProductoFormularioService } from '../services/producto-formulario.service';
import {
  OPCIONES_FORMULARIO_DEMO,
  FORMULARIO_PRODUCTO_DEMO,
  EDICION_PRODUCTO_DEMO,
  formularioProductoVacio,
} from '../services/producto-formulario.mock';
import { PRODUCTOS_DEMO } from '../services/productos.mock';
import { validarProductoFormulario, validarImagenProducto } from '../dtos/producto-formulario.dto';
import type {
  FormularioProducto,
  OpcionesFormularioProducto,
  EstadoPublicacion,
  ModoFormulario,
  SeccionChecklist,
  ProgresoChecklist,
  ColorCatalogo,
  DetalleEdicionProducto,
  ApiErrorResponse,
  ProductoListado,
} from '../interfaces';

const OPCIONES_VACIAS: OpcionesFormularioProducto = {
  categorias: [],
  subcategorias: [],
  tiposResina: [],
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
  /** Auditoría / conteos que solo existen al editar (maqueta ADMIN 04). */
  const detalleEdicion = ref<DetalleEdicionProducto | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);
  const desactivado = ref<boolean>(false);

  // --- Getters: opciones dependientes --------------------------------------
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

  /** RF-CAT-02-02: las pinturas entonables exigen línea (y resina, validado en backend). */
  const requiereLinea = computed(() => formulario.value.claseColor === 'entonable');
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
        completa: f.subcategoriasIds.length > 0,
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
    desactivado.value = false;
    usandoDatosDemo.value = false;

    await cargarOpciones();

    if (id) {
      modo.value = 'editar';
      productoId.value = id;
      try {
        const [prod, det] = await Promise.all([
          ProductoFormularioService.obtenerProducto(id),
          ProductoFormularioService.obtenerDetalleEdicion(id),
        ]);
        formulario.value = prod.data;
        detalleEdicion.value = det.data;
      } catch {
        formulario.value = { ...FORMULARIO_PRODUCTO_DEMO };
        detalleEdicion.value = EDICION_PRODUCTO_DEMO;
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      productoId.value = null;
      detalleEdicion.value = null;
      formulario.value = formularioProductoVacio();
    }

    cargando.value = false;
  }

  /** Aplica cambios y reajusta dependencias (línea/colores por marca). */
  function actualizar(parcial: Partial<FormularioProducto>): void {
    const anterior = formulario.value;
    const siguiente: FormularioProducto = { ...anterior, ...parcial };

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

  /** Alterna una subcategoría en `subcategoriasIds` (RF-CAT-02-02: al menos una). */
  function alternarSubcategoria(subcategoriaId: string): void {
    const actuales = formulario.value.subcategoriasIds;
    actualizar({
      subcategoriasIds: actuales.includes(subcategoriaId)
        ? actuales.filter((id) => id !== subcategoriaId)
        : [...actuales, subcategoriaId],
    });
  }

  /** El archivo se lee en el navegador (data URL); el upload al backend es HU-CAT-07, endpoint aparte. */
  /**
   * Agrega una imagen a la galería. Valida formato y peso en el navegador con
   * las mismas reglas que aplica `CrearImagenDto` (jpeg/png/webp, ≤ 5MB) para
   * no esperar a que el servidor rechace la subida. Devuelve el mensaje de
   * error si la imagen no es aceptable, o `null` si se agregó.
   */
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
    // `orden` se recompacta: el backend lo usa para ordenar la galería.
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
    const { valido, errores } = validarProductoFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  /**
   * Sin backend real, `PRODUCTOS_DEMO` (services/productos.mock.ts) es la única
   * fuente que alimenta el listado. Si al guardar no reflejamos el cambio ahí,
   * el producto editado se ve "sin cambios" al volver a Productos. Deriva la
   * fila de listado a partir del formulario + las etiquetas de `opciones`.
   */
  function sincronizarListadoDemo(id: string): void {
    const marca = opciones.value.marcas.find((m) => m.valor === formulario.value.marcaId);
    const primeraSubcategoria = opciones.value.subcategorias.find((s) =>
      formulario.value.subcategoriasIds.includes(s.valor)
    );
    const categoriaPadre = primeraSubcategoria
      ? opciones.value.categorias.find((c) => c.valor === primeraSubcategoria.categoriaId)
      : undefined;
    const linea = opciones.value.lineas.find((l) => l.valor === formulario.value.lineaId);

    const fila: ProductoListado = {
      id,
      nombre: formulario.value.nombre,
      imagenUrl: formulario.value.imagenes[0]?.url ?? null,
      marca: marca?.etiqueta ?? '—',
      categoria: categoriaPadre?.etiqueta ?? '—',
      linea: linea?.etiqueta ?? null,
      claseColor: formulario.value.claseColor,
      totalVariantes: PRODUCTOS_DEMO.find((p) => p.id === id)?.totalVariantes ?? 0,
      estado: formulario.value.estado,
      actualizadoEn: new Date().toISOString(),
      actualizadoPor: 'Administrador',
    };

    const indice = PRODUCTOS_DEMO.findIndex((p) => p.id === id);
    if (indice === -1) PRODUCTOS_DEMO.unshift(fila);
    else PRODUCTOS_DEMO[indice] = fila;
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
      sincronizarListadoDemo(productoId.value);
      return true;
    } catch (e) {
      if (usandoDatosDemo.value) {
        // Sin backend: simulamos el guardado, pero igual reflejamos el cambio
        // en el listado de ejemplo para que no se vea "como si nada hubiera pasado".
        productoId.value ??= `prd-demo-${Date.now()}`;
        modo.value = 'editar';
        sincronizarListadoDemo(productoId.value);
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
  /** Guarda sin cambiar el estado efectivo (un producto inactivo sigue inactivo). */
  const guardarCambios = () => guardar(formulario.value.estado);

  /**
   * Desactiva / reactiva el producto (maqueta ADMIN 04). En el backend real es
   * el eje `/desactivar` · `/reactivar`, INDEPENDIENTE de publicar/despublicar:
   * un producto desactivado queda `'inactivo'`, nunca `'borrador'`.
   * Al reactivar vuelve a `'borrador'`, que es el estado no publicado por
   * defecto; publicarlo de nuevo es una acción aparte.
   */
  async function cambiarActivacion(estado: 'inactivo' | 'borrador'): Promise<boolean> {
    if (modo.value !== 'editar' || !productoId.value) return false;
    guardando.value = true;
    error.value = null;
    try {
      if (!usandoDatosDemo.value) {
        await ProductoFormularioService.actualizar(productoId.value, {
          ...formulario.value,
          estado,
        });
      }
      formulario.value = { ...formulario.value, estado };
      desactivado.value = estado === 'inactivo';
      sincronizarListadoDemo(productoId.value);
      return true;
    } catch (e) {
      error.value = extraerMensajeError(e);
      return false;
    } finally {
      guardando.value = false;
    }
  }

  const desactivar = () => cambiarActivacion('inactivo');
  const reactivar = () => cambiarActivacion('borrador');

  function reiniciar(): void {
    formulario.value = formularioProductoVacio();
    opciones.value = { ...OPCIONES_VACIAS };
    modo.value = 'crear';
    productoId.value = null;
    detalleEdicion.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    desactivado.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    // estado
    formulario,
    opciones,
    modo,
    productoId,
    detalleEdicion,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    desactivado,
    // getters
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
    alternarSubcategoria,
    agregarImagen,
    quitarImagen,
    marcarImagenPrincipal,
    validar,
    guardarBorrador,
    publicar,
    guardarCambios,
    desactivar,
    reactivar,
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
