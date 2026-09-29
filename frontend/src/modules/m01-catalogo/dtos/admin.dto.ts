import { z } from 'zod';
import { hexACielab } from '../composables/useColorCielab';
import type { ClaseColor } from '../interfaces';

/**
 * ==============================================================================
 * M01 - DTOs DEL PANEL ADMINISTRATIVO (Zod)
 * Ubicación: src/modules/m01-catalogo/dtos/admin.dto.ts
 *
 * Espejo de backend/src/modules/m01-catalogo/dtos/*.dto.ts. Cada esquema recibe
 * los valores crudos del formulario (strings de los inputs) y produce el payload
 * EXACTO que acepta el endpoint. El backend vuelve a validar todo; esto solo
 * adelanta los mensajes al usuario (ramas "Impedir…" de los diagramas M01).
 * ==============================================================================
 */

export type ModoFormulario = 'crear' | 'editar';
export type ErroresFormulario = Record<string, string>;
export type ResultadoValidacion<T> = { ok: true; data: T } | { ok: false; errores: ErroresFormulario };

/** Ejecuta un esquema y devuelve los errores indexados por el primer segmento de la ruta. */
export function validar<S extends z.ZodTypeAny>(esquema: S, datos: unknown): ResultadoValidacion<z.output<S>> {
  const resultado = esquema.safeParse(datos);
  if (resultado.success) return { ok: true, data: resultado.data };
  const errores: ErroresFormulario = {};
  for (const issue of resultado.error.issues) {
    const campo = String(issue.path[0] ?? '_general');
    errores[campo] ??= issue.message;
  }
  return { ok: false, errores };
}

// ------------------------------------------------------------------------------
// Primitivas (valores crudos de formulario → tipos del backend)
// ------------------------------------------------------------------------------

const texto = (mensaje: string, max = 100) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje).max(max, `No puede superar los ${max} caracteres`);

/** Texto opcional: vacío → `undefined` (no se envía). */
const textoOpcional = (max = 100) =>
  z.string().trim().max(max, `No puede superar los ${max} caracteres`).optional()
    .transform((v) => (v ? v : undefined));

/** Texto que al editar puede limpiarse: vacío → `null` (el backend lo interpreta como "borrar"). */
const textoAnulable = (max = 100) =>
  z.string().trim().max(max, `No puede superar los ${max} caracteres`).optional()
    .transform((v) => (v ? v : null));

const vacio = (v: unknown): boolean => v === '' || v === null || v === undefined;

const idRequerido = (mensaje: string) =>
  z.preprocess((v) => (vacio(v) ? undefined : Number(v)), z.number({ required_error: mensaje, invalid_type_error: mensaje }).int(mensaje).positive(mensaje));

const idOpcional = z.preprocess((v) => (vacio(v) ? undefined : Number(v)), z.number().int().positive().optional());

const numeroRequerido = (mensaje: string) =>
  z.preprocess((v) => (vacio(v) ? undefined : Number(v)), z.number({ required_error: mensaje, invalid_type_error: mensaje }));

const ordenOpcional = z.preprocess(
  (v) => (vacio(v) ? undefined : Number(v)),
  z.number({ invalid_type_error: 'El orden debe ser un número' }).int('El orden debe ser entero').min(0, 'El orden no puede ser negativo').optional(),
);

/** Los esquemas de edición del backend exigen al menos un dato: un objeto vacío nunca debe salir. */
const conCambios = <T extends Record<string, unknown>>(d: T): boolean => Object.values(d).some((v) => v !== undefined);

// ------------------------------------------------------------------------------
// HU-CAT-01 · Categorías y subcategorías
// ------------------------------------------------------------------------------

export const categoriaFormSchema = z.object({
  nombre: texto('El nombre de la categoría es obligatorio'),
  orden: ordenOpcional,
});

export const subcategoriaFormSchema = z.object({
  nombre: texto('El nombre de la subcategoría es obligatorio'),
  id_categoria: idRequerido('Debe indicar la categoría padre'),
  orden: ordenOpcional,
});

// ------------------------------------------------------------------------------
// HU-CAT-04 · Marcas (logotipo obligatorio al crear; opcional al editar)
// ------------------------------------------------------------------------------

export const FORMATOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PESO_MAXIMO_IMAGEN = 5 * 1024 * 1024;
const DATA_URL_IMAGEN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/** Validación previa a leer el archivo (mismos límites que el backend). */
export function errorArchivoImagen(archivo: File): string | null {
  if (!(FORMATOS_IMAGEN as readonly string[]).includes(archivo.type)) return 'Formato no admitido. Usa JPG, PNG o WEBP.';
  if (archivo.size > PESO_MAXIMO_IMAGEN) return 'La imagen no puede pesar más de 5 MB.';
  return null;
}

const imagenDataUrl = (mensaje: string) => z.string({ required_error: mensaje }).min(1, mensaje).regex(DATA_URL_IMAGEN, mensaje);

export const marcaFormSchema = (modo: ModoFormulario) =>
  z.object({
    nombre: texto('El nombre de la marca es obligatorio'),
    logotipo: modo === 'crear'
      ? imagenDataUrl('Debe adjuntar el logotipo de la marca')
      : z.string().optional().transform((v) => (v ? v : undefined)),
  });

// ------------------------------------------------------------------------------
// HU-CAT-11 · Líneas · HU-CAT-12 · Bases · RF-CAT-02-04 · Resinas · RF-CAT-03-05 · Presentaciones
// ------------------------------------------------------------------------------

export const lineaFormSchema = z.object({
  nombre: texto('El nombre de la línea es obligatorio'),
  id_marca: idRequerido('Debe indicar la marca a la que pertenece la línea'),
  gama_comercial: textoOpcional(),
});

export const baseFormSchema = z.object({
  nombre: texto('El nombre o código de la base es obligatorio'),
  id_marca: idRequerido('Debe indicar la marca a la que pertenece la base'),
});

export const resinaFormSchema = z.object({
  nombre: texto('El nombre del tipo de resina es obligatorio'),
});

export const presentacionFormSchema = z.object({
  nombre: texto('El nombre de la presentación es obligatorio'),
  volumen: numeroRequerido('El volumen es obligatorio').pipe(z.number().positive('El volumen debe ser mayor que cero')),
});

// ------------------------------------------------------------------------------
// HU-CAT-05 · Colores (CIELAB obligatorio; la muestra se genera desde él)
// ------------------------------------------------------------------------------

export const cielabSchema = z.object({
  l: z.number().min(0, 'L* debe ser ≥ 0').max(100, 'L* debe ser ≤ 100'),
  a: z.number().min(-128, 'a* debe ser ≥ -128').max(128, 'a* debe ser ≤ 128'),
  b: z.number().min(-128, 'b* debe ser ≥ -128').max(128, 'b* debe ser ≤ 128'),
});

export const colorFormSchema = (modo: ModoFormulario) =>
  z.object({
    nombre: texto('El nombre comercial del color es obligatorio'),
    id_marca: idRequerido('Debe indicar la marca a la que pertenece el color'),
    codigo: modo === 'crear' ? textoOpcional(60) : textoAnulable(60),
    l: numeroRequerido('L* es obligatorio'),
    a: numeroRequerido('a* es obligatorio'),
    b: numeroRequerido('b* es obligatorio'),
  })
    .superRefine((d, ctx) => {
      const r = cielabSchema.safeParse({ l: d.l, a: d.a, b: d.b });
      if (!r.success) for (const i of r.error.issues) ctx.addIssue({ code: 'custom', path: i.path, message: i.message });
    })
    .transform(({ l, a, b, ...resto }) => ({ ...resto, cielab: { l, a, b } }));

/** Ayuda de captura: convierte el HEX del selector a CIELAB para rellenar L*, a*, b*. */
export function cielabDesdeHex(hex: string): { l: number; a: number; b: number } | null {
  return hexACielab(hex);
}

// ------------------------------------------------------------------------------
// HU-CAT-02 · Productos (diagrama "Gestión de productos")
// ------------------------------------------------------------------------------

export const CLASES_COLOR: { valor: ClaseColor; etiqueta: string }[] = [
  { valor: 'entonable', etiqueta: 'Entonable (carta de colores sobre bases)' },
  { valor: 'colores_fijos', etiqueta: 'Colores fijos (cada color es una variante)' },
  { valor: 'sin_color', etiqueta: 'Sin color (brochas, rodillos, estuco…)' },
];

export const productoFormSchema = (modo: ModoFormulario) =>
  z.object({
    nombre: texto('El nombre del producto es obligatorio', 150),
    id_marca: idRequerido('Debe seleccionar la marca'),
    clase_color: z.enum(['entonable', 'colores_fijos', 'sin_color'], { errorMap: () => ({ message: 'La clase de color es obligatoria' }) }),
    id_subcategorias: z.array(z.number().int().positive())
      .min(1, 'El producto debe pertenecer al menos a una subcategoría'),
    id_linea: idOpcional,
    id_tipo_resina: idOpcional,
    descripcion: z.string().trim().max(5000, 'La descripción es demasiado larga').optional(),
    id_categoria_complementaria: idOpcional,
    patrocinado: z.boolean().default(false),
  })
    .superRefine((d, ctx) => {
      // RF-CAT-02-02: entonable o colores fijos → producto de pintura → exige línea y resina.
      if (d.clase_color !== 'sin_color') {
        if (d.id_linea === undefined) ctx.addIssue({ code: 'custom', path: ['id_linea'], message: 'Las pinturas exigen línea' });
        if (d.id_tipo_resina === undefined) ctx.addIssue({ code: 'custom', path: ['id_tipo_resina'], message: 'Las pinturas exigen tipo de resina' });
      }
    })
    .transform((d) => {
      const descripcion = d.descripcion ? d.descripcion : undefined;
      if (modo === 'crear') return { ...d, descripcion };
      // Al editar: `null` limpia; la marca no es editable en el backend.
      return {
        nombre: d.nombre,
        clase_color: d.clase_color,
        id_subcategorias: d.id_subcategorias,
        patrocinado: d.patrocinado,
        descripcion: descripcion ?? null,
        id_linea: d.id_linea ?? null,
        id_tipo_resina: d.id_tipo_resina ?? null,
        id_categoria_complementaria: d.id_categoria_complementaria ?? null,
      };
    });

// ------------------------------------------------------------------------------
// HU-CAT-03 · Variantes (RF-CAT-03-02: la forma depende de la clase del producto)
// ------------------------------------------------------------------------------

export const varianteFormSchema = (modo: ModoFormulario, clase: ClaseColor) =>
  z.object({
    id_producto: idRequerido('Producto inválido'),
    id_presentacion: idRequerido('Debe seleccionar la presentación'),
    precio_vigente: numeroRequerido('El precio es obligatorio').pipe(z.number().min(0, 'El precio no puede ser negativo')),
    existencia_referencial: z.preprocess(
      (v) => (vacio(v) ? undefined : Number(v)),
      z.number({ invalid_type_error: 'La existencia debe ser un número' }).int('La existencia debe ser entera')
        .min(0, 'La existencia referencial no puede ser negativa').optional(),
    ),
    id_base: idOpcional,
    id_color: idOpcional,
    codigo_proveedor: modo === 'crear' ? textoOpcional() : textoAnulable(),
  })
    .superRefine((d, ctx) => {
      if (clase === 'entonable' && d.id_base === undefined) ctx.addIssue({ code: 'custom', path: ['id_base'], message: 'Un producto entonable exige la base' });
      if (clase === 'colores_fijos' && d.id_color === undefined) ctx.addIssue({ code: 'custom', path: ['id_color'], message: 'Un producto de colores fijos exige el color' });
    })
    .transform((d) => {
      // Cada clase solo envía el eje que le corresponde.
      const id_base = clase === 'entonable' ? d.id_base : undefined;
      const id_color = clase === 'colores_fijos' ? d.id_color : undefined;
      if (modo === 'crear') return { ...d, id_base, id_color };
      return {
        id_presentacion: d.id_presentacion,
        precio_vigente: d.precio_vigente,
        existencia_referencial: d.existencia_referencial,
        codigo_proveedor: d.codigo_proveedor,
        id_base: id_base ?? null,
        id_color: id_color ?? null,
      };
    });

// ------------------------------------------------------------------------------
// HU-CAT-10 · Rendimiento (m² por galón por mano; ambos o ninguno; mín ≤ máx)
// ------------------------------------------------------------------------------

const rendimientoValor = z.preprocess(
  (v) => (vacio(v) ? null : Number(v)),
  z.number({ invalid_type_error: 'Debe ser un número' }).positive('El rendimiento debe ser mayor que cero').nullable(),
);

export const rendimientoFormSchema = z.object({
  rendimiento_min: rendimientoValor,
  rendimiento_max: rendimientoValor,
}).superRefine((d, ctx) => {
  if ((d.rendimiento_min === null) !== (d.rendimiento_max === null)) {
    ctx.addIssue({ code: 'custom', path: ['rendimiento_max'], message: 'Debe indicar ambos valores de rendimiento o ninguno' });
  } else if (d.rendimiento_min !== null && d.rendimiento_max !== null && d.rendimiento_min > d.rendimiento_max) {
    ctx.addIssue({ code: 'custom', path: ['rendimiento_min'], message: 'El rendimiento mínimo no puede superar al máximo' });
  }
});

// ------------------------------------------------------------------------------
// HU-CAT-07 · Imágenes (asociables a variante o a color)
// ------------------------------------------------------------------------------

export const imagenFormSchema = z.object({
  imagen: imagenDataUrl('Debe adjuntar la imagen'),
  id_variante: idOpcional,
  id_color: idOpcional,
  es_principal: z.boolean().optional(),
});

export const imagenEdicionSchema = z.object({
  id_variante: z.preprocess((v) => (vacio(v) ? null : Number(v)), z.number().int().positive().nullable()),
  id_color: z.preprocess((v) => (vacio(v) ? null : Number(v)), z.number().int().positive().nullable()),
  orden: ordenOpcional,
  es_principal: z.boolean().optional(),
}).refine(conCambios, { message: 'Debe indicar al menos un dato a actualizar' });

// ------------------------------------------------------------------------------
// HU-CAT-12 · Asignación de bases a un producto entonable
// ------------------------------------------------------------------------------

export const asignarBaseSchema = z.object({
  id_base: idRequerido('Debe indicar la base a asignar'),
});
