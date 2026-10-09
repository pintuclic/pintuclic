<template>
  <nav v-if="abierto" class="absolute inset-x-3 top-full z-50 overflow-hidden rounded-b-2xl border border-neutral-white/30 bg-neutral-black/50 text-neutral-white shadow-2xl ring-1 ring-inset ring-neutral-white/10 backdrop-blur-2xl xl:hidden" aria-label="Menú principal móvil">
    <div class="mx-auto max-h-[calc(100vh-7rem)] max-w-7xl overflow-y-auto px-4 py-3 sm:px-6">
      <template v-if="!categoriaSeleccionada">
        <router-link to="/" class="block min-h-11 rounded-button px-3 py-3 text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" @click="emit('cerrar')">Inicio</router-link>
        <button type="button" class="flex min-h-11 w-full items-center justify-between rounded-button px-3 py-3 text-left text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" :aria-expanded="productosAbiertos" aria-controls="opciones-productos-movil" @click="productosAbiertos = !productosAbiertos">
          Productos
          <ChevronDown :size="18" class="transition-transform" :class="productosAbiertos ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
        <div v-if="productosAbiertos" id="opciones-productos-movil" class="ml-3 border-l border-neutral-white/25 pl-3">
          <button type="button" class="flex min-h-11 w-full items-center justify-between rounded-button px-3 py-3 text-left text-sm text-neutral-white hover:bg-neutral-white/20" @click="emit('seleccionarTodos')">
            Ver todos los productos <ChevronRight :size="17" aria-hidden="true" />
          </button>
          <p v-if="cargando" class="px-3 py-3 text-sm text-neutral-white/80" role="status">Cargando categorías...</p>
          <div v-else-if="error" class="px-3 py-3 text-sm text-neutral-white/80" role="alert">
            <p>No fue posible cargar las categorías.</p>
            <button type="button" class="mt-2 font-semibold text-neutral-white underline" @click="emit('recargarCategorias')">Reintentar</button>
          </div>
          <p v-else-if="!categorias.length" class="px-3 py-3 text-sm text-neutral-white/80">No hay categorías disponibles.</p>
          <template v-else>
            <button v-for="categoria in categorias" :key="categoria.id_categoria" type="button" class="flex min-h-11 w-full items-center justify-between rounded-button px-3 py-3 text-left text-sm text-neutral-white hover:bg-neutral-white/20" @click="categoriaSeleccionada = categoria">
              {{ categoria.nombre }} <ChevronRight :size="17" aria-hidden="true" />
            </button>
          </template>
        </div>
        <a href="#" class="block min-h-11 rounded-button px-3 py-3 text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" @click="emit('cerrar')">Ofertas</a>
        <a href="#" class="block min-h-11 rounded-button px-3 py-3 text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" @click="emit('cerrar')">Servicios</a>
        <router-link to="/paleta-colores" class="block min-h-11 rounded-button px-3 py-3 text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" @click="emit('cerrar')">Paleta de Color</router-link>
        <a href="#" class="block min-h-11 rounded-button px-3 py-3 text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" @click="emit('cerrar')">Sobre Nosotros</a>
      </template>
      <template v-else>
        <button type="button" class="mb-3 flex min-h-11 items-center gap-2 rounded-button px-3 text-sm font-semibold text-neutral-white hover:bg-neutral-white/20" @click="categoriaSeleccionada = null">
          <ChevronLeft :size="18" aria-hidden="true" /> {{ categoriaSeleccionada.nombre }}
        </button>
        <p class="mb-2 px-3 text-sm text-neutral-white/80">Selecciona una subcategoría</p>
        <button v-for="subcategoria in categoriaSeleccionada.subcategorias" :key="subcategoria.id_subcategoria" type="button" class="flex min-h-11 w-full items-center justify-between rounded-button px-3 py-3 text-left text-sm text-neutral-white hover:bg-neutral-white/20" :class="subcategoriaActual === subcategoria.id_subcategoria ? 'bg-neutral-white/20' : ''" @click="emit('seleccionar', subcategoria.id_subcategoria)">
          {{ subcategoria.nombre }} <ChevronRight :size="17" aria-hidden="true" />
        </button>
        <p v-if="!categoriaSeleccionada.subcategorias.length" class="px-3 py-3 text-sm text-neutral-white/80">Esta categoría no tiene subcategorías disponibles.</p>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { CategoriaPublica } from '../../interfaces/publicas/catalogo-publico.interface';

const props = defineProps<{
  abierto: boolean;
  cargando: boolean;
  error: boolean;
  categorias: readonly CategoriaPublica[];
  subcategoriaActual?: number;
}>();

const emit = defineEmits<{
  cerrar: [];
  recargarCategorias: [];
  seleccionarTodos: [];
  seleccionar: [idSubcategoria: number];
}>();

const productosAbiertos = ref(false);
const categoriaSeleccionada = ref<CategoriaPublica | null>(null);

watch([() => props.abierto, () => props.categorias, () => props.subcategoriaActual], ([abierto, categorias, subcategoriaActual]) => {
  if (!abierto) {
    productosAbiertos.value = false;
    categoriaSeleccionada.value = null;
    return;
  }
  const categoria = categorias.find((item) => item.subcategorias.some((subcategoria) => subcategoria.id_subcategoria === subcategoriaActual));
  if (categoria) {
    productosAbiertos.value = true;
    categoriaSeleccionada.value = categoria;
  }
});
</script>
