<template>
  <section class="flex flex-col gap-4">
    <!-- Encabezado -->
    <div v-if="titulo" class="flex items-center justify-between gap-4 flex-wrap">
      <h2 class="font-semibold text-neutral-black text-xl">Mis pedidos</h2>
      <RouterLink
        v-if="enlaceVerTodos"
        to="/pedidos"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
      >
        Ver todos
        <ChevronRightIcon class="w-4 h-4" />
      </RouterLink>
    </div>

    <!--
      Esta sección solo lista. El detalle vive en su propia pantalla
      («Seguimiento de Pedido», /pedidos/:codigo), tal como lo plantea el diseño.
    -->
    <div class="grid grid-cols-1 gap-5 items-start">
      <!--
        ---------- Lista de pedidos ----------
        «Ver detalle» navega a /pedidos/:codigo, que en el diseño es una pantalla propia
        («Seguimiento de Pedido», con su encabezado y su ruta de navegación). Esta sección
        se limita por tanto a listar.
      -->
      <div class="flex flex-col gap-4 min-w-0">
        <!-- Buscador -->
        <div v-if="conBuscador" class="relative">
          <SearchIcon
            class="w-5 h-5 text-neutral-medium absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            id="buscador-pedidos"
            type="search"
            :value="busqueda"
            placeholder="Buscar por número de pedido o producto…"
            class="w-full bg-white border border-neutral-light rounded-input pl-10 pr-4 py-3 text-sm text-neutral-black placeholder:text-neutral-medium focus:border-action focus:outline-none focus:ring-4 focus:ring-subaction"
            @input="buscar(($event.target as HTMLInputElement).value)"
          />
        </div>

        <FiltrosPedidos v-model="filtro" />

        <!-- Avisos -->
        <div
          v-if="usandoMock"
          class="flex items-start gap-2 rounded-xl bg-highlight/15 px-4 py-3 text-sm text-corporate"
        >
          <AlertIcon class="w-4 h-4 shrink-0 mt-0.5" />
          <span>No se pudo conectar con el servidor. Estás viendo datos de ejemplo.</span>
        </div>
        <div
          v-else-if="error"
          class="flex items-start gap-2 rounded-xl bg-neutral-lightest px-4 py-3 text-sm text-neutral-dark"
        >
          <AlertIcon class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <!-- Cargando -->
        <div v-if="cargando" class="flex flex-col gap-3" aria-busy="true">
          <div
            v-for="n in 3"
            :key="n"
            class="h-[136px] rounded-2xl bg-white border border-neutral-light animate-pulse"
          />
        </div>

        <template v-else>
          <!-- Sin ningún pedido -->
          <div
            v-if="sinPedidos"
            class="rounded-2xl border border-dashed border-neutral-light bg-white px-6 py-12 text-center"
          >
            <PackageIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" />
            <h3 class="font-semibold text-neutral-black text-lg">
              Todavía no tienes pedidos
            </h3>
            <p class="text-neutral-medium text-sm mt-1 mb-5">
              Cuando hagas tu primera compra, aparecerá aquí.
            </p>
            <RouterLink
              to="/"
              class="inline-flex items-center rounded-button bg-action px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-hover"
            >
              Ver catálogo
            </RouterLink>
          </div>

          <!-- Hay pedidos, pero el filtro o la búsqueda no encuentra -->
          <div
            v-else-if="sinResultados"
            class="rounded-2xl border border-dashed border-neutral-light bg-white px-6 py-12 text-center"
          >
            <SearchIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" />
            <h3 class="font-semibold text-neutral-black text-lg">Sin resultados</h3>
            <p class="text-neutral-medium text-sm mt-1 mb-5">
              Ningún pedido coincide con lo que buscas.
            </p>
            <button
              type="button"
              class="inline-flex items-center rounded-button border border-action px-5 py-2.5 text-sm font-medium text-action transition-colors hover:bg-subaction"
              @click="limpiar"
            >
              Limpiar búsqueda
            </button>
          </div>

          <template v-else>
            <div v-if="enCurso.length" class="flex flex-col gap-3">
              <h3 v-if="conGrupos" class="flex items-center gap-2.5">
                <span class="font-semibold text-neutral-black">En curso</span>
                <span
                  class="rounded-full bg-subaction px-2.5 py-0.5 text-xs font-semibold text-corporate tabular-nums"
                >
                  {{ enCurso.length }}
                </span>
              </h3>
              <TarjetaPedido
                v-for="p in enCurso"
                :key="p.codigo"
                :pedido="p"
                @abrir="abrir"
              />
            </div>

            <div v-if="finalizados.length" class="flex flex-col gap-3">
              <h3 v-if="conGrupos" class="flex items-center gap-2.5">
                <span class="font-semibold text-neutral-black">Finalizados</span>
                <span
                  class="rounded-full bg-subaction px-2.5 py-0.5 text-xs font-semibold text-corporate tabular-nums"
                >
                  {{ finalizados.length }}
                </span>
              </h3>
              <TarjetaPedido
                v-for="p in finalizados"
                :key="p.codigo"
                :pedido="p"
                @abrir="abrir"
              />
            </div>

            <PaginacionPedidos v-model="pagina" :total-paginas="totalPaginas" />
          </template>
        </template>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  Search as SearchIcon,
  Package as PackageIcon,
  AlertCircle as AlertIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-vue-next';
import FiltrosPedidos from './FiltrosPedidos.vue';
import TarjetaPedido from './TarjetaPedido.vue';
import PaginacionPedidos from './PaginacionPedidos.vue';
import { useMisPedidos } from '../composables/useMisPedidos';

/**
 * Sección «Mis pedidos» del mockup «Mi-Perfil_Usuario natural».
 *
 * Se usa en dos sitios y en ambos el detalle se abre EN LA MISMA PANTALLA:
 *  - dentro de /perfil, bajo la información personal
 *  - como contenido de /pedidos
 */
const props = withDefaults(
  defineProps<{
    /** Muestra el encabezado «Mis pedidos». */
    titulo?: boolean;
    /** Muestra el enlace «Ver todos» hacia /pedidos. */
    enlaceVerTodos?: boolean;
    /** Muestra el buscador que consulta al servidor. */
    conBuscador?: boolean;
    /** Separa en «En curso» y «Finalizados». */
    conGrupos?: boolean;
    /** Tarjetas por página. */
    porPagina?: number;
  }>(),
  {
    titulo: false,
    enlaceVerTodos: false,
    conBuscador: true,
    conGrupos: true,
    porPagina: 5,
  }
);

const router = useRouter();

/**
 * «Ver detalle» lleva a /pedidos/:codigo, que es la pantalla «Seguimiento de Pedido»
 * del diseño: tiene su propio encabezado y su ruta de navegación, así que no puede
 * vivir incrustada dentro del listado.
 */
function abrir(codigo: string): void {
  void router.push({ name: 'DetallePedido', params: { codigo } });
}

const {
  enCurso,
  finalizados,
  totalPaginas,
  pagina,
  cargando,
  error,
  usandoMock,
  busqueda,
  filtro,
  sinPedidos,
  sinResultados,
  cargar,
  buscar,
} = useMisPedidos({ porPagina: props.porPagina });

function limpiar(): void {
  filtro.value = 'todos';
  buscar('');
}

onMounted(() => void cargar());
</script>
