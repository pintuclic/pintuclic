<script setup lang="ts" generic="T extends object">
import type { TableColumn } from '@/core/types/table.type';
withDefaults(defineProps<{ rows: T[]; columns: TableColumn[]; rowKey: keyof T; caption: string; loading?: boolean; mobileCards?: boolean }>(), { loading: false, mobileCards: false });
</script>
<template>
  <div class="overflow-x-auto" :aria-busy="loading">
    <table role="table" class="w-full text-left text-sm text-neutral-medium" :class="mobileCards ? 'max-sm:block sm:min-w-[680px]' : 'min-w-[680px]'">
      <caption class="sr-only">{{ caption }}</caption>
      <thead role="rowgroup" class="bg-neutral-lightest text-xs text-corporate" :class="mobileCards ? 'max-sm:sr-only' : ''">
        <tr><th v-for="column in columns" :key="column.key" scope="col" class="px-6 py-4" :class="column.align === 'right' ? 'text-right' : ''">{{ column.label }}</th></tr>
      </thead>
      <tbody role="rowgroup" class="divide-y divide-neutral-light" :class="mobileCards ? 'max-sm:block' : ''">
        <tr v-for="row in rows" :key="String(row[rowKey])" role="row" class="bg-neutral-white transition-colors hover:bg-subaction/30" :class="mobileCards ? 'max-sm:block max-sm:p-4' : ''">
          <td v-for="column in columns" :key="column.key" role="cell" :class="[mobileCards ? 'max-sm:block max-sm:py-2 max-sm:break-words max-sm:[overflow-wrap:anywhere] sm:px-6 sm:py-5' : 'px-6 py-5', column.align === 'right' ? 'text-right' : '']">
            <span v-if="mobileCards" aria-hidden="true" class="mb-2 block text-xs font-semibold text-corporate sm:hidden">{{ column.label }}</span>
            <slot :name="`cell-${column.key}`" :row="row">{{ row[column.key as keyof T] }}</slot>
          </td>
        </tr>
        <tr v-if="!rows.length" role="row" :class="mobileCards ? 'max-sm:block' : ''"><td role="cell" :colspan="columns.length" class="px-6 py-16 text-center" :class="mobileCards ? 'max-sm:block' : ''"><slot name="empty">{{ loading ? 'Cargando…' : 'No hay resultados.' }}</slot></td></tr>
      </tbody>
    </table>
  </div>
</template>
