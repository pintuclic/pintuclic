<template>
  <div class="font-sans space-y-6">
    <PageHeader
      title="Categorías y Subcategorías"
      description="Estructura jerárquica a dos niveles: Administra las categorías raíz y sus subcategorías directamente en contexto."
    >
      <Button variant="action" icon="plus" @click="nuevaCategoria">Nueva categoría</Button>
    </PageHeader>

    <!-- Barra de Búsqueda y Control de Árbol -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm">
      <div class="relative flex-1 max-w-md">
        <Input
          v-model="busqueda"
          placeholder="Buscar por categoría o subcategoría…"
          aria-label="Buscar categorías"
        />
      </div>
      <div class="flex items-center gap-2">
        <Button variant="neutral" size="sm" @click="expandirTodas">
          Expandir todas
        </Button>
        <Button variant="neutral" size="sm" @click="colapsarTodas">
          Colapsar todas
        </Button>
        <Button variant="outline" size="sm" :disabled="cargando" @click="recargarTodo">
          Actualizar
        </Button>
      </div>
    </div>

    <!-- Feedback de Estado -->
    <Alert v-if="errorGeneral" variant="danger" class="mb-4">
      {{ errorGeneral }}
      <Button variant="danger-outline" size="sm" class="mt-2" @click="recargarTodo">Reintentar</Button>
    </Alert>

    <!-- Estado de Carga -->
    <div v-if="cargando && !categoriasConSub.length" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-20 bg-neutral-lightest rounded-xl animate-pulse"></div>
    </div>

    <!-- Estado Vacío -->
    <SinResultados
      v-else-if="!categoriasFiltradas.length"
      icon="grid"
      :title="busqueda ? 'No se encontraron categorías ni subcategorías' : 'Aún no hay categorías registradas'"
      :description="busqueda ? 'Intenta con otro término de búsqueda.' : 'Crea la primera categoría para organizar el portafolio de productos.'"
    >
      <Button v-if="!busqueda" variant="action" icon="plus" class="mt-4" @click="nuevaCategoria">
        Crear primera categoría
      </Button>
    </SinResultados>

    <!-- Árbol Jerárquico de Categorías y Subcategorías -->
    <div v-else class="space-y-4">
      <div
        v-for="cat in categoriasFiltradas"
        :key="cat.id_categoria"
        class="bg-neutral-white rounded-xl border border-neutral-light shadow-sm overflow-hidden transition-all duration-200"
      >
        <!-- CABECERA DE CATEGORÍA RAÍZ -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 p-4 bg-neutral-lightest/40 hover:bg-neutral-lightest/70 transition-colors border-b border-neutral-light cursor-pointer select-none"
          @click="alternarExpansion(cat.id_categoria)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-medium hover:text-action hover:bg-subaction transition-colors"
              :aria-label="expandidas.has(cat.id_categoria) ? 'Colapsar subcategorías' : 'Expandir subcategorías'"
            >
              <ChevronDownIcon
                class="w-5 h-5 transition-transform duration-200"
                :class="{ '-rotate-90': !expandidas.has(cat.id_categoria) }"
              />
            </button>
            <FolderIcon class="w-5 h-5 text-action shrink-0" />
            <div>
              <span class="font-bold text-base text-corporate">{{ cat.nombre }}</span>
              <span class="ml-2.5 text-xs px-2 py-0.5 rounded-full bg-subaction text-action font-medium">
                {{ (subcategoriasMap[cat.id_categoria] ?? []).length }} subcategorías
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 ml-auto" @click.stop>
            <span class="text-xs text-neutral-medium tabular-nums hidden sm:inline">
              Orden: <strong>{{ cat.orden }}</strong>
            </span>
            <Badge :estado="cat.estado" table />
            <div class="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                icon="plus"
                class="!py-1 !px-2.5 !text-xs font-medium"
                @click="nuevaSubcategoria(cat)"
              >
                Subcategoría
              </Button>
              <AccionesFila
                :nombre="cat.nombre"
                :estado="cat.estado"
                @editar="editarCategoria(cat)"
                @desactivar="abrirDesactivar(cat.nombre, () => CatalogoAdmin.categorias.desactivar(cat.id_categoria, true), () => CatalogoAdmin.categorias.desactivar(cat.id_categoria, false))"
                @reactivar="abrirReactivar(cat.nombre, () => CatalogoAdmin.categorias.reactivar(cat.id_categoria))"
              />
            </div>
          </div>
        </div>

        <!-- CUERPO ANIDADO: SUBCATEGORÍAS -->
        <div v-show="expandidas.has(cat.id_categoria)" class="p-4 bg-neutral-white">
          <div v-if="!subcategoriasMap[cat.id_categoria]?.length" class="p-6 text-center border-2 border-dashed border-neutral-light rounded-xl">
            <p class="text-sm text-neutral-medium mb-3">Esta categoría aún no tiene subcategorías asociadas.</p>
            <Button variant="action" size="sm" icon="plus" @click="nuevaSubcategoria(cat)">
              Crear primera subcategoría
            </Button>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-neutral-light text-xs font-semibold text-neutral-medium uppercase tracking-wider">
                  <th class="py-2.5 px-3">Subcategoría</th>
                  <th class="py-2.5 px-3 text-center w-24">Orden</th>
                  <th class="py-2.5 px-3 w-32">Estado</th>
                  <th class="py-2.5 px-3 text-right w-28">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-light">
                <tr
                  v-for="sub in subcategoriasMap[cat.id_categoria]"
                  :key="sub.id_subcategoria"
                  class="hover:bg-neutral-lightest/40 transition-colors group"
                >
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-2">
                      <span class="text-neutral-medium text-xs font-mono">↳</span>
                      <span class="font-medium text-neutral-dark">{{ sub.nombre }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-center tabular-nums text-neutral-medium">
                    {{ sub.orden }}
                  </td>
                  <td class="py-3 px-3">
                    <Badge :estado="sub.estado" table />
                  </td>
                  <td class="py-3 px-3 text-right">
                    <AccionesFila
                      :nombre="sub.nombre"
                      :estado="sub.estado"
                      @editar="editarSubcategoria(sub)"
                      @desactivar="abrirDesactivar(sub.nombre, () => CatalogoAdmin.subcategorias.desactivar(sub.id_subcategoria, true), () => CatalogoAdmin.subcategorias.desactivar(sub.id_subcategoria, false))"
                      @reactivar="abrirReactivar(sub.nombre, () => CatalogoAdmin.subcategorias.reactivar(sub.id_subcategoria))"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales de Edición y Desactivación -->
    <ModalFormularioCatalogo
      v-model="formulario.abierto"
      :titulo="formulario.titulo"
      :modo="formulario.modo"
      :campos="esSubcategoria ? camposSubcategoria : camposCategoria"
      :esquema="esSubcategoria ? subcategoriaFormSchema : categoriaFormSchema"
      :valores-iniciales="formulario.valores"
      :guardar="formulario.guardar"
      @guardado="refrescar"
    />
    <ModalDesactivar
      v-model="cicloVida.abierto"
      :nombre="cicloVida.nombre"
      :modo="cicloVida.modo"
      :ejecutar="cicloVida.ejecutar"
      :consultar-impacto="cicloVida.consultarImpacto"
      @completado="refrescar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  ChevronDown as ChevronDownIcon,
  Folder as FolderIcon,
} from 'lucide-vue-next';
import { Alert, Badge, Button, Input, PageHeader, SinResultados } from '@/core/components';
import AccionesFila from '../../components/admin/AccionesFila.vue';
import ModalFormularioCatalogo from '../../components/admin/ModalFormularioCatalogo.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { useTaxonomias } from '../../store/useTaxonomias';
import { categoriaFormSchema, subcategoriaFormSchema } from '../../dtos/admin.dto';
import type { CampoFormulario, Categoria, Subcategoria } from '../../interfaces';

const taxonomias = useTaxonomias();
const { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar } = useEdicion();

const cargando = ref(false);
const errorGeneral = ref<string | null>(null);
const busqueda = ref('');
const categorias = ref<Categoria[]>([]);
const subcategoriasMap = reactive<Record<number, Subcategoria[]>>({});
const expandidas = ref<Set<number>>(new Set());
const esSubcategoria = ref(false);

const porOrden = <T extends { orden: number; nombre: string }>(lista: T[]) =>
  [...lista].sort((x, y) => x.orden - y.orden || x.nombre.localeCompare(y.nombre));

async function recargarTodo(): Promise<void> {
  cargando.value = true;
  errorGeneral.value = null;
  try {
    const cats = porOrden(await CatalogoAdmin.categorias.listar());
    categorias.value = cats;

    // Cargar subcategorías en paralelo para cada categoría
    await Promise.all(
      cats.map(async (cat) => {
        try {
          const subs = porOrden(await CatalogoAdmin.subcategorias.listarPorCategoria(cat.id_categoria));
          subcategoriasMap[cat.id_categoria] = subs;
        } catch {
          subcategoriasMap[cat.id_categoria] = [];
        }
      })
    );

    // Expandir todas por defecto si está vacío
    if (!expandidas.value.size) {
      expandirTodas();
    }
  } catch (err: unknown) {
    const error = err as Error;
    errorGeneral.value = error.message || 'Error al cargar las categorías y subcategorías.';
  } finally {
    cargando.value = false;
  }
}

function alternarExpansion(idCategoria: number): void {
  if (expandidas.value.has(idCategoria)) {
    expandidas.value.delete(idCategoria);
  } else {
    expandidas.value.add(idCategoria);
  }
  // Forzar reactividad del Set
  expandidas.value = new Set(expandidas.value);
}

function expandirTodas(): void {
  expandidas.value = new Set(categorias.value.map((c) => c.id_categoria));
}

function colapsarTodas(): void {
  expandidas.value = new Set();
}

const categoriasConSub = computed(() => categorias.value);

const categoriasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  if (!q) return categorias.value;

  return categorias.value.filter((cat) => {
    const coincideCategoria = cat.nombre.toLowerCase().includes(q);
    const subcats = subcategoriasMap[cat.id_categoria] ?? [];
    const coincideSub = subcats.some((s) => s.nombre.toLowerCase().includes(q));
    return coincideCategoria || coincideSub;
  });
});

const camposCategoria: CampoFormulario[] = [
  { clave: 'nombre', etiqueta: 'Nombre de la categoría', tipo: 'texto', placeholder: 'Ej. Pinturas Arquitectónicas' },
  { clave: 'orden', etiqueta: 'Orden de presentación (opcional)', tipo: 'numero' },
];

const camposSubcategoria: CampoFormulario[] = [
  { clave: 'nombre', etiqueta: 'Nombre de la subcategoría', tipo: 'texto', placeholder: 'Ej. Vinilos Tipo 1 Interiores' },
  { clave: 'orden', etiqueta: 'Orden de presentación (opcional)', tipo: 'numero' },
];

function nuevaCategoria(): void {
  esSubcategoria.value = false;
  abrirFormulario({
    modo: 'crear',
    titulo: 'Nueva categoría raíz',
    guardar: (p) => CatalogoAdmin.categorias.crear(p),
  });
}

function editarCategoria(c: Categoria): void {
  esSubcategoria.value = false;
  abrirFormulario({
    modo: 'editar',
    titulo: `Editar categoría: ${c.nombre}`,
    valores: { nombre: c.nombre, orden: c.orden },
    guardar: (p) => CatalogoAdmin.categorias.actualizar(c.id_categoria, p),
  });
}

function nuevaSubcategoria(cat: Categoria): void {
  esSubcategoria.value = true;
  abrirFormulario({
    modo: 'crear',
    titulo: `Nueva subcategoría en "${cat.nombre}"`,
    valores: { id_categoria: cat.id_categoria },
    guardar: (p) => CatalogoAdmin.subcategorias.crear(p),
  });
}

function editarSubcategoria(s: Subcategoria): void {
  esSubcategoria.value = true;
  abrirFormulario({
    modo: 'editar',
    titulo: `Editar subcategoría: ${s.nombre}`,
    valores: { id_categoria: s.id_categoria, nombre: s.nombre, orden: s.orden },
    guardar: (p) => CatalogoAdmin.subcategorias.actualizar(s.id_subcategoria, p),
  });
}

async function refrescar(): Promise<void> {
  taxonomias.invalidar();
  await recargarTodo();
}

onMounted(recargarTodo);
</script>
