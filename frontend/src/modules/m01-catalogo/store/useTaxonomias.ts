import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { CatalogoAdmin } from '../services/catalogo-admin.service';
import { mensajeError } from '../services/http';
import type { Categoria, Marca, Presentacion, Subcategoria, TipoResina } from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DE TAXONOMÍAS (Pinia)
 * Ubicación: src/modules/m01-catalogo/store/useTaxonomias.ts
 *
 * Caché de los catálogos maestros que usan varios formularios y tablas a la vez:
 * marcas, categorías con sus subcategorías, tipos de resina y presentaciones.
 * Todo viene del backend; tras crear/editar alguno de ellos se llama a
 * `invalidar()` para que la próxima vista lo pida de nuevo.
 * ==============================================================================
 */
export const useTaxonomias = defineStore('m01-taxonomias', () => {
  const marcas = shallowRef<Marca[]>([]);
  const categorias = shallowRef<Categoria[]>([]);
  const subcategorias = shallowRef<Subcategoria[]>([]);
  const resinas = shallowRef<TipoResina[]>([]);
  const presentaciones = shallowRef<Presentacion[]>([]);
  const cargado = ref(false);
  const error = ref<string | null>(null);
  let enCurso: Promise<void> | null = null;

  const porId = <T>(lista: T[], clave: keyof T) => new Map(lista.map((item) => [item[clave] as number, item]));
  const mapaMarcas = computed(() => porId(marcas.value, 'id_marca'));
  const mapaSubcategorias = computed(() => porId(subcategorias.value, 'id_subcategoria'));
  const mapaCategorias = computed(() => porId(categorias.value, 'id_categoria'));
  const mapaResinas = computed(() => porId(resinas.value, 'id_tipo_resina'));
  const mapaPresentaciones = computed(() => porId(presentaciones.value, 'id_presentacion'));

  const nombreMarca = (id: number | null) => (id === null ? '—' : mapaMarcas.value.get(id)?.nombre ?? `#${id}`);
  const nombreSubcategoria = (id: number) => mapaSubcategorias.value.get(id)?.nombre ?? `#${id}`;
  const nombreCategoria = (id: number | null) => (id === null ? '—' : mapaCategorias.value.get(id)?.nombre ?? `#${id}`);
  const nombreResina = (id: number | null) => (id === null ? '—' : mapaResinas.value.get(id)?.nombre ?? `#${id}`);
  const nombrePresentacion = (id: number) => mapaPresentaciones.value.get(id)?.nombre ?? `#${id}`;

  async function cargarTodo(): Promise<void> {
    error.value = null;
    try {
      const [m, c, r, p] = await Promise.all([
        CatalogoAdmin.marcas.listar(),
        CatalogoAdmin.categorias.listar(),
        CatalogoAdmin.resinas.listar(),
        CatalogoAdmin.presentaciones.listar(),
      ]);
      // El backend expone las subcategorías por categoría (RF-CAT-01-02).
      const subs = await Promise.all(c.map((cat) => CatalogoAdmin.subcategorias.listarPorCategoria(cat.id_categoria)));
      marcas.value = m;
      categorias.value = c;
      subcategorias.value = subs.flat();
      resinas.value = r;
      presentaciones.value = p;
      cargado.value = true;
    } catch (e) {
      error.value = mensajeError(e);
    }
  }

  /** Carga una única vez (o de nuevo tras `invalidar`) aunque varias vistas lo pidan a la vez. */
  function asegurar(): Promise<void> {
    if (cargado.value) return Promise.resolve();
    enCurso ??= cargarTodo().finally(() => { enCurso = null; });
    return enCurso;
  }

  function invalidar(): void {
    cargado.value = false;
  }

  return {
    marcas, categorias, subcategorias, resinas, presentaciones, cargado, error,
    nombreMarca, nombreSubcategoria, nombreCategoria, nombreResina, nombrePresentacion,
    asegurar, invalidar,
  };
});
