import { CONFIG_SUBIDA, del, get, getBlob, patch, post, rutaApi } from './http';
import type {
  Base,
  Categoria,
  Color,
  Imagen,
  Impacto,
  ImpactoDesactivacionMarca,
  ImpactoDesactivacionProducto,
  Linea,
  Marca,
  Presentacion,
  Producto,
  RendimientoProducto,
  ResultadoDesactivacion,
  ResultadoReactivacion,
  Subcategoria,
  TipoResina,
  Variante,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP DEL PANEL ADMINISTRATIVO
 * Ubicación: src/modules/m01-catalogo/services/catalogo-admin.service.ts
 *
 * Espejo exacto de backend/src/modules/m01-catalogo/m01.routes.ts. Todas estas
 * rutas exigen Bearer + permisos `catalogo.ver|crear|editar|eliminar` (M20/M17),
 * verificados en el servidor. Los payloads se validan antes con dtos/admin.dto.ts.
 * ==============================================================================
 */

const C = '/catalogo';

/**
 * Ciclo de vida común a los recursos del catálogo (HU-CAT-09): obtener, crear,
 * editar (siempre PATCH), desactivar y reactivar. No existe eliminación física.
 *
 * `desactivar(id, confirmar)`: categorías, subcategorías y líneas responden sin
 * `confirmar` con el impacto (`requiere_confirmacion`) y solo aplican la cascada
 * al repetir con `confirmar: true`. El resto de recursos ignora el cuerpo.
 */
function recurso<T>(ruta: string) {
  return {
    obtener: (id: number) => get<T>(`${ruta}/${id}`),
    crear: (payload: object) => post<T>(ruta, payload),
    actualizar: (id: number, payload: object) => patch<T>(`${ruta}/${id}`, payload),
    desactivar: (id: number, confirmar = false) =>
      patch<Impacto | ResultadoDesactivacion>(`${ruta}/${id}/desactivar`, { confirmar }),
    reactivar: (id: number) => patch<ResultadoReactivacion>(`${ruta}/${id}/reactivar`),
  };
}

export type RecursoCatalogo<T> = ReturnType<typeof recurso<T>>;

export const CatalogoAdmin = {
  categorias: {
    ...recurso<Categoria>(`${C}/categorias`),
    listar: () => get<Categoria[]>(`${C}/categorias`),
  },

  subcategorias: {
    ...recurso<Subcategoria>(`${C}/subcategorias`),
    listarPorCategoria: (idCategoria: number) => get<Subcategoria[]>(`${C}/categorias/${idCategoria}/subcategorias`),
  },

  marcas: {
    ...recurso<Marca>(`${C}/marcas`),
    crear: (payload: object) => post<Marca>(`${C}/marcas`, payload, CONFIG_SUBIDA),
    actualizar: (id: number, payload: object) => patch<Marca>(`${C}/marcas/${id}`, payload, CONFIG_SUBIDA),
    listar: () => get<Marca[]>(`${C}/marcas`),
    impacto: (id: number) => get<ImpactoDesactivacionMarca>(`${C}/marcas/${id}/impacto-desactivacion`),
    logotipo: (id: number) => getBlob(`${C}/marcas/${id}/logotipo`),
  },

  lineas: {
    ...recurso<Linea>(`${C}/lineas`),
    listarPorMarca: (idMarca: number) => get<Linea[]>(`${C}/marcas/${idMarca}/lineas`),
  },

  bases: {
    ...recurso<Base>(`${C}/bases`),
    listarPorMarca: (idMarca: number) => get<Base[]>(`${C}/marcas/${idMarca}/bases`),
  },

  colores: {
    ...recurso<Color>(`${C}/colores`),
    /** RF-CAT-05-01: la búsqueda por nombre o código la resuelve el servidor (`?q=`). */
    listarPorMarca: (idMarca: number, q?: string) =>
      get<Color[]>(`${C}/marcas/${idMarca}/colores`, q ? { q } : undefined),
  },

  resinas: {
    ...recurso<TipoResina>(`${C}/tipos-resina`),
    listar: () => get<TipoResina[]>(`${C}/tipos-resina`),
  },

  presentaciones: {
    ...recurso<Presentacion>(`${C}/presentaciones`),
    listar: () => get<Presentacion[]>(`${C}/presentaciones`),
  },

  productos: {
    ...recurso<Producto>(`${C}/productos`),
    /** El backend filtra por texto (`q`) y marca (`marca`); devuelve la lista completa sin paginar. */
    listar: (filtros?: { q?: string; marca?: number }) => get<Producto[]>(`${C}/productos`, filtros),
    impacto: (id: number) => get<ImpactoDesactivacionProducto>(`${C}/productos/${id}/impacto-desactivacion`),
    publicar: (id: number) => patch<Producto>(`${C}/productos/${id}/publicar`),
    despublicar: (id: number) => patch<Producto>(`${C}/productos/${id}/despublicar`),
    rendimiento: (id: number) => get<RendimientoProducto>(`${C}/productos/${id}/rendimiento`),
    establecerRendimiento: (id: number, payload: object) =>
      patch<RendimientoProducto>(`${C}/productos/${id}/rendimiento`, payload),
    bases: (id: number) => get<Base[]>(`${C}/productos/${id}/bases`),
    asignarBase: (id: number, idBase: number) => post<Base[]>(`${C}/productos/${id}/bases`, { id_base: idBase }),
    quitarBase: (id: number, idBase: number) => del<Base[]>(`${C}/productos/${id}/bases/${idBase}`),
    variantes: (id: number) => get<Variante[]>(`${C}/productos/${id}/variantes`),
    imagenes: (id: number) => get<Imagen[]>(`${C}/productos/${id}/imagenes`),
    subirImagen: (id: number, payload: object) =>
      post<Imagen>(`${C}/productos/${id}/imagenes`, payload, CONFIG_SUBIDA),
  },

  variantes: recurso<Variante>(`${C}/variantes`),

  imagenes: {
    actualizar: (id: number, payload: object) => patch<Imagen>(`${C}/imagenes/${id}`, payload, CONFIG_SUBIDA),
    eliminar: (id: number) => del<unknown>(`${C}/imagenes/${id}`),
    contenido: (imagen: Imagen) => getBlob(rutaApi(imagen.contenido_url)),
  },
};
