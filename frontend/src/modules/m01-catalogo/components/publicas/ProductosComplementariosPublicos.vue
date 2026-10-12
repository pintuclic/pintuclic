<template>
  <!-- Sin resultados no se renderiza nada: ni título ni espacio (CA-CAT-08-03). -->
  <section v-if="productos.length" :aria-labelledby="idTitulo">
    <h2 :id="idTitulo" class="font-poppins text-xl font-bold text-corporate">{{ titulo }}</h2>
    <div class="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <TarjetaProductoPublico
        v-for="producto in productos"
        :key="producto.id_producto"
        :producto="producto"
        @ver="emit('ver', $event)"
        @agregar="emit('agregar', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import TarjetaProductoPublico from './TarjetaProductoPublico.vue';
import type { ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

/**
 * Presentación de una lista de productos sugeridos con la tarjeta pública del
 * catálogo. No sabe de dónde salen los productos: otra fuente de sugerencias solo
 * tiene que entregar `productos` y su `titulo`.
 */
withDefaults(
  defineProps<{
    productos: readonly ProductoDestacadoPublico[];
    titulo?: string;
    idTitulo?: string;
  }>(),
  { titulo: 'Productos que te pueden interesar', idTitulo: 'titulo-productos-complementarios' }
);

const emit = defineEmits<{ ver: [idProducto: number]; agregar: [idProducto: number] }>();
</script>
