<template>
  <div class="min-h-screen bg-neutral-white text-neutral-dark">
    <EncabezadoTiendaPublica @abrir-categorias="menuCategoriasAbierto = true" @informar="mostrarMensaje" />

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <button type="button" class="inline-flex items-center gap-2 rounded-button border border-action px-3 py-2 text-xs font-semibold text-action hover:bg-subaction" @click="router.back()"><ArrowLeft :size="15" /> Anterior</button>

      <div v-if="cargando" class="mt-6 grid gap-8 lg:grid-cols-2"><div class="aspect-[4/3] animate-pulse rounded-card bg-neutral-lightest" /><div class="h-96 animate-pulse rounded-card bg-neutral-lightest" /></div>
      <div v-else-if="error || !producto" class="mt-6 rounded-card border border-neutral-light p-12 text-center"><CircleAlert :size="36" class="mx-auto text-highlight" /><h1 class="mt-3 text-xl font-bold text-corporate">Producto no disponible</h1><p class="mt-2 text-sm text-neutral-medium">{{ error }}</p><router-link to="/catalogo" class="mt-5 inline-block rounded-button bg-action px-5 py-2 text-sm font-semibold text-white">Volver al catálogo</router-link></div>

      <template v-else>
        <nav class="mt-5 text-xs text-neutral-medium" aria-label="Migas de pan"><router-link to="/">Inicio</router-link> / <router-link to="/catalogo">Productos</router-link> / <span class="text-neutral-dark">{{ producto.nombre }}</span></nav>
        <section class="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div class="grid aspect-[4/3] place-items-center overflow-hidden rounded-card bg-neutral-lightest p-5">
              <img :src="imagenActiva" :alt="producto.nombre" class="h-full w-full object-contain" />
            </div>
            <div class="mt-3 flex gap-3">
              <button v-for="(imagen, indice) in galeria" :key="imagen" type="button" class="h-16 w-20 overflow-hidden rounded-button border bg-neutral-lightest p-1" :class="indiceGaleria === indice ? 'border-action' : 'border-neutral-light'" @click="indiceGaleria = indice"><img :src="imagen" alt="" class="h-full w-full object-contain" /></button>
            </div>
          </div>

          <div>
            <h1 class="text-3xl font-extrabold leading-tight text-corporate">{{ producto.nombre }}</h1>
            <p class="mt-2 text-2xl font-extrabold text-corporate">{{ precioActual }}</p>
            <div class="mt-5 rounded-card border border-neutral-light p-4"><h2 class="text-sm font-bold text-corporate">Descripción</h2><p class="mt-2 text-sm leading-6 text-neutral-medium">{{ producto.descripcion || 'Producto de calidad para completar tu proyecto.' }}</p></div>

            <div v-if="colores.length" class="mt-5"><h2 class="text-sm font-bold text-corporate">Elige un color:</h2><div class="mt-2 flex flex-wrap gap-2"><button v-for="(variante, indice) in colores" :key="variante.id_variante" type="button" class="rounded-full border px-3 py-2 text-xs font-semibold" :class="varianteSeleccionadaId === variante.id_variante ? 'border-action bg-subaction text-corporate' : 'border-neutral-light'" @click="varianteSeleccionadaId = variante.id_variante"><span class="mr-1 inline-block h-3 w-3 rounded-full align-middle" :class="claseMuestra(indice)" />{{ variante.color }}</button></div></div>

            <div class="mt-5"><h2 class="text-sm font-bold text-corporate">Elige un tamaño:</h2><div class="mt-2 grid grid-cols-2 gap-3"><button v-for="variante in presentaciones" :key="variante.id_presentacion" type="button" class="rounded-button border px-4 py-3 text-sm font-semibold" :class="varianteSeleccionada?.id_presentacion === variante.id_presentacion ? 'border-action bg-action text-white' : 'border-neutral-light'" @click="seleccionarPresentacion(variante.id_presentacion)">{{ variante.presentacion }}</button></div></div>

            <button type="button" class="mt-5 flex w-full items-center justify-between rounded-button border border-neutral-light px-4 py-3 text-sm font-semibold text-corporate hover:bg-neutral-lightest" @click="calculadoraAbierta = true"><span>Calcular cuánta pintura necesitas</span><Calculator :size="17" /></button>

            <div class="mt-5 grid grid-cols-[auto_1fr] gap-3"><div class="flex items-center rounded-button border border-neutral-light"><button type="button" class="px-3 py-3" aria-label="Reducir cantidad" @click="cantidad = Math.max(1, cantidad - 1)">−</button><span class="min-w-8 text-center text-sm">{{ cantidad }}</span><button type="button" class="px-3 py-3" aria-label="Aumentar cantidad" @click="cantidad += 1">+</button></div><button type="button" class="inline-flex items-center justify-center gap-2 rounded-button bg-conversion text-sm font-bold text-white hover:bg-conversion-hover" @click="mostrarMensaje('Agregar al carrito requiere la integración con M07.')"><ShoppingCart :size="17" /> Comprar</button></div>
            <p class="mt-5 flex items-center gap-2 text-xs font-semibold text-conversion-hover"><MapPin :size="14" /> Retiro hoy*</p>
          </div>
        </section>

        <section v-if="complementarios.length" class="mt-16"><h2 class="text-xl font-bold text-corporate">Productos que te pueden interesar</h2><div class="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"><TarjetaProductoPublico v-for="item in complementarios" :key="item.id_producto" :producto="item" @ver="irProducto" @agregar="mostrarMensaje('Agregar al carrito requiere M07.')" /></div></section>
      </template>

      <div v-if="mensaje" class="fixed bottom-5 left-1/2 z-40 flex w-[min(92%,520px)] -translate-x-1/2 justify-between rounded-card bg-subaction px-4 py-3 text-sm text-corporate shadow-lg" role="status"><span>{{ mensaje }}</span><button type="button" aria-label="Cerrar" @click="mensaje = null"><X :size="16" /></button></div>
    </main>

    <PieTiendaPublica :categorias="categorias" />
    <MenuCategoriasPublico :abierto="menuCategoriasAbierto" :cargando="cargando" :categorias="categorias" @cerrar="menuCategoriasAbierto = false" @seleccionar="irSubcategoria" />
    <CalculadoraPinturaPublica :abierta="calculadoraAbierta" :producto="producto" @cerrar="calculadoraAbierta = false" @agregar="mostrarMensaje('Agregar al carrito requiere la integración con M07.')" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Calculator, CircleAlert, MapPin, ShoppingCart, X } from 'lucide-vue-next';
import { GALERIA_PRODUCTO_DEMO, obtenerImagenPublicaRespaldo } from '../assets/imagenes-catalogo';
import CalculadoraPinturaPublica from '../components/publicas/CalculadoraPinturaPublica.vue';
import EncabezadoTiendaPublica from '../components/publicas/EncabezadoTiendaPublica.vue';
import MenuCategoriasPublico from '../components/publicas/MenuCategoriasPublico.vue';
import PieTiendaPublica from '../components/publicas/PieTiendaPublica.vue';
import TarjetaProductoPublico from '../components/publicas/TarjetaProductoPublico.vue';
import { useDetalleProductoPublico } from '../composables/useDetalleProductoPublico';

const props = defineProps<{ productoId: string }>();
const router = useRouter();
const idProducto = computed(() => Number(props.productoId));
const { cargando, categorias, complementarios, error, producto, varianteSeleccionada, varianteSeleccionadaId } = useDetalleProductoPublico(toRef(idProducto));
const menuCategoriasAbierto = ref(false);
const calculadoraAbierta = ref(false);
const mensaje = ref<string | null>(null);
const cantidad = ref(1);
const indiceGaleria = ref(0);
const colores = computed(() => producto.value?.variantes.filter((item) => item.color) ?? []);
const presentaciones = computed(() => {
  const unicas = new Map<number, NonNullable<typeof producto.value>['variantes'][number]>();
  for (const variante of producto.value?.variantes ?? []) {
    if (!unicas.has(variante.id_presentacion)) unicas.set(variante.id_presentacion, variante);
  }
  return Array.from(unicas.values());
});
const galeria = computed(() => {
  const remotas = producto.value?.imagenes.map((imagen) => imagen.contenido_url) ?? [];
  if (remotas.length) return remotas;
  return [obtenerImagenPublicaRespaldo(idProducto.value), GALERIA_PRODUCTO_DEMO.lateral, GALERIA_PRODUCTO_DEMO.ambiente];
});
const imagenActiva = computed(() => galeria.value[indiceGaleria.value] ?? obtenerImagenPublicaRespaldo(idProducto.value));
const precioActual = computed(() => varianteSeleccionada.value ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(varianteSeleccionada.value.precio_vigente) : 'Consultar precio');

function claseMuestra(indice: number): string { return ['bg-highlight', 'bg-action', 'bg-corporate', 'bg-conversion', 'bg-neutral-light'][indice % 5] ?? 'bg-neutral-light'; }
function mostrarMensaje(texto: string): void { mensaje.value = texto; }
function seleccionarPresentacion(idPresentacion: number): void {
  const colorActual = varianteSeleccionada.value?.id_color ?? null;
  const opciones = producto.value?.variantes.filter((item) => item.id_presentacion === idPresentacion) ?? [];
  varianteSeleccionadaId.value = (opciones.find((item) => item.id_color === colorActual) ?? opciones[0])?.id_variante ?? null;
}
function irProducto(id: number): void { indiceGaleria.value = 0; cantidad.value = 1; void router.push({ name: 'DetalleProductoPublico', params: { productoId: id } }); }
function irSubcategoria(id: number): void { menuCategoriasAbierto.value = false; void router.push({ name: 'CatalogoPublico', query: { subcategoria: id } }); }
</script>
