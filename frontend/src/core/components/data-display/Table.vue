<template>
  <div class="w-full" :aria-busy="loading">
    <caption v-if="caption" class="sr-only">{{ caption }}</caption>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate"></div>
    </div>
    
    <div v-else-if="rows.length === 0" class="py-12 text-center">
      <slot name="empty">
        <p class="text-neutral-medium">{{ emptyMessage || 'No hay datos disponibles.' }}</p>
      </slot>
    </div>
    
    <template v-else>
      <!-- Vista Desktop (Tabla real) -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-xs uppercase bg-neutral-lightest text-corporate border-b border-neutral-light">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                class="px-6 py-4 font-semibold"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-light">
            <tr
              v-for="(row, idx) in rows"
              :key="String(rowKey ? row[rowKey as keyof T] ?? idx : idx)"
              class="hover:bg-neutral-lightest/50 transition-colors"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-6 py-4 text-neutral-dark"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                <slot :name="`cell-${col.key}`" :row="row">
                  {{ row[col.key as keyof T] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Vista Mobile (Tarjetas) -->
      <div v-if="mobileCards" class="sm:hidden flex flex-col gap-4 p-4">
        <div
          v-for="(row, idx) in rows"
          :key="String(rowKey ? row[rowKey as keyof T] ?? idx : idx)"
          class="bg-white border border-neutral-light rounded-xl p-4 flex flex-col gap-3 shadow-sm"
        >
          <div v-for="col in columns" :key="col.key" class="flex flex-col">
            <span class="text-xs font-semibold text-corporate uppercase mb-1">{{ col.label }}</span>
            <div class="text-sm text-neutral-dark" :class="col.align === 'right' ? 'text-right' : ''">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ row[col.key as keyof T] }}
              </slot>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="sm:hidden overflow-x-auto">
        <!-- Fallback si no usan mobile-cards -->
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-xs uppercase bg-neutral-lightest text-corporate border-b border-neutral-light">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                class="px-4 py-3 font-semibold"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-light">
            <tr
              v-for="(row, idx) in rows"
              :key="String(rowKey ? row[rowKey as keyof T] ?? idx : idx)"
              class="hover:bg-neutral-lightest/50 transition-colors"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-neutral-dark"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                <slot :name="`cell-${col.key}`" :row="row">
                  {{ row[col.key as keyof T] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TableColumn } from '@/core/types/table.type';

withDefaults(
  defineProps<{
    columns: TableColumn[] | { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
    rows: T[];
    rowKey?: keyof T | string;
    caption?: string;
    loading?: boolean;
    mobileCards?: boolean;
    emptyMessage?: string;
  }>(),
  {
    rowKey: 'id',
    caption: '',
    loading: false,
    mobileCards: false,
    emptyMessage: 'No hay datos disponibles.'
  }
);
</script>
