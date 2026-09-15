<template>
  <div class="w-full">
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate"></div>
    </div>
    
    <div v-else-if="rows.length === 0" class="py-12 text-center">
      <slot name="empty">
        <p class="text-neutral-medium">No hay datos disponibles.</p>
      </slot>
    </div>
    
    <template v-else>
      <!-- Vista Desktop (Tabla real) -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-xs uppercase bg-neutral-lightest text-corporate border-b border-neutral-light">
            <tr>
              <th v-for="col in columns" :key="col.key" scope="col" class="px-6 py-4 font-semibold">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-light">
            <tr v-for="row in rows" :key="row[rowKey] as PropertyKey" class="hover:bg-neutral-lightest/50 transition-colors">
              <td v-for="col in columns" :key="col.key" class="px-6 py-4 text-neutral-dark">
                <slot :name="`cell-${col.key}`" :row="row">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Vista Mobile (Tarjetas) -->
      <div v-if="mobileCards" class="sm:hidden flex flex-col gap-4 p-4">
        <div v-for="row in rows" :key="row[rowKey] as PropertyKey" class="bg-white border border-neutral-light rounded-xl p-4 flex flex-col gap-3 shadow-sm">
          <div v-for="col in columns" :key="col.key" class="flex flex-col">
            <span class="text-xs font-semibold text-corporate uppercase mb-1">{{ col.label }}</span>
            <div class="text-sm text-neutral-dark">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ row[col.key] }}
              </slot>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="sm:hidden overflow-x-auto">
        <!-- Fallback si no usan mobile-cards -->
        <table class="w-full text-left text-sm whitespace-nowrap">
          <!-- Igual que desktop pero con scroll -->
          <thead class="text-xs uppercase bg-neutral-lightest text-corporate border-b border-neutral-light">
            <tr>
              <th v-for="col in columns" :key="col.key" scope="col" class="px-4 py-3 font-semibold">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-light">
            <tr v-for="row in rows" :key="row[rowKey] as PropertyKey" class="hover:bg-neutral-lightest/50 transition-colors">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-neutral-dark">
                <slot :name="`cell-${col.key}`" :row="row">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    columns: { key: string; label: string }[];
    rows: Record<string, unknown>[];
    rowKey?: string;
    loading?: boolean;
    mobileCards?: boolean;
  }>(),
  { rowKey: 'id' }
);
</script>
