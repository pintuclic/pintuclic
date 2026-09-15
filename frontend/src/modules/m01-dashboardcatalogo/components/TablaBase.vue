<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" :aria-label="etiqueta">
    <header v-if="$slots.encabezado" class="border-b border-neutral-light p-4">
      <slot name="encabezado" />
    </header>

    <div v-if="cargando" class="space-y-3 p-5">
      <div
        v-for="n in filasSkeleton"
        :key="n"
        class="animate-pulse rounded-input bg-neutral-lightest"
        :class="altoFilaSkeleton"
      />
    </div>

    <p v-else-if="vacio" class="p-10 text-center text-sm text-neutral-medium">
      {{ mensajeVacio }}
    </p>

    <div v-else class="overflow-x-auto">
      <slot />
    </div>

    <template v-if="!cargando && !vacio">
      <slot name="pie" />
    </template>
  </section>
</template>

<script lang="ts">
/**
 * Encabezado de columnas (`<thead><tr>`) compartido por las 8 tablas: fondo
 * azul claro (`subaction`, el mismo tono de la maqueta ADMIN 02/06/09/15/20)
 * en vez del gris plano que tenían antes. Se exporta desde aquí para que cada
 * tabla lo aplique con `:class="CLASE_ENCABEZADO_TABLA"` sin repetir el string.
 */
export const CLASE_ENCABEZADO_TABLA =
  'border-b border-neutral-light bg-subaction text-xs uppercase tracking-wide text-corporate';
</script>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - CHROME COMÚN DE LAS TABLAS DE LISTADO
 * Ubicación: src/modules/m01-dashboardcatalogo/components/TablaBase.vue
 *
 * Unifica lo que las 8 tablas del panel repetían idéntico: tarjeta contenedora,
 * skeleton de carga, mensaje de vacío y envoltorio con scroll horizontal. Las
 * columnas y celdas siguen siendo de cada tabla (slot por defecto = `<table>`
 * completo) porque su contenido es genuinamente distinto entre dominios.
 *
 * `#encabezado` es opcional (título/búsqueda/orden/exportar, distintos por
 * tabla) y `#pie` se muestra solo cuando hay datos — ahí va `PaginacionTabla`
 * o un pie a medida (p. ej. el selector de "por página" de variantes).
 * ==============================================================================
 */
withDefaults(
  defineProps<{
    /** `aria-label` de la sección (p. ej. "Listado de colores"). */
    etiqueta: string;
    cargando?: boolean;
    /** true cuando no hay filas que mostrar (y no está cargando). */
    vacio: boolean;
    mensajeVacio: string;
    filasSkeleton?: number;
    /** Clase de alto Tailwind para cada fila del skeleton (p. ej. "h-11"). */
    altoFilaSkeleton?: string;
  }>(),
  { cargando: false, filasSkeleton: 6, altoFilaSkeleton: 'h-11' }
);
</script>
