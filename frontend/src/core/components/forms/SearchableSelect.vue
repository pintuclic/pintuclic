<template>
  <div ref="containerRef" class="relative flex flex-col w-full">
    <!-- Etiqueta opcional -->
    <label
      v-if="label"
      class="mb-1.5 text-xs font-semibold text-corporate tracking-wide select-none"
    >
      {{ label }}
    </label>

    <!-- Botón disparador -->
    <button
      type="button"
      :disabled="disabled"
      @click="toggleDropdown"
      class="flex items-center justify-between gap-2.5 w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors outline-none cursor-pointer text-left bg-neutral-white font-sans"
      :class="[
        isOpen
          ? 'border-action ring-1 ring-action'
          : error
            ? 'border-danger focus:border-danger'
            : 'border-neutral-light hover:border-action/60 focus:border-action',
        disabled ? 'opacity-60 cursor-not-allowed bg-neutral-lightest' : ''
      ]"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
    >
      <span
        class="truncate"
        :class="selectedOption ? 'text-corporate font-medium' : 'text-neutral-medium'"
      >
        {{ selectedOption ? selectedOption.label : (placeholder || 'Seleccionar opción…') }}
      </span>
      <ChevronDownIcon
        class="w-4 h-4 text-neutral-medium shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Error si existe -->
    <p v-if="error" class="mt-1 text-xs text-danger font-medium">
      {{ error }}
    </p>

    <!-- Panel Desplegable con Buscador Integrado -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-neutral-light bg-neutral-white shadow-lg overflow-hidden flex flex-col max-h-72"
    >
      <!-- Barra de Búsqueda Integrada -->
      <div class="p-2.5 border-b border-neutral-light bg-neutral-lightest/50 shrink-0">
        <div class="relative flex items-center">
          <SearchIcon class="absolute left-3 w-4 h-4 text-neutral-medium pointer-events-none" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder || 'Buscar opción…'"
            class="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-neutral-light bg-neutral-white text-corporate placeholder:text-neutral-medium focus:border-action focus:outline-none transition-colors font-sans"
            @keydown.esc="closeDropdown"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 text-neutral-medium hover:text-corporate p-1 cursor-pointer"
            @click="searchQuery = ''"
          >
            <XIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Lista de Opciones Filtradas -->
      <ul
        role="listbox"
        class="overflow-y-auto p-1.5 flex flex-col gap-0.5 custom-scrollbar text-sm"
      >
        <li
          v-for="opt in filteredOptions"
          :key="String(opt.value)"
          role="option"
          :aria-selected="opt.value === modelValue"
          @click="selectOption(opt)"
          class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm"
          :class="[
            opt.value === modelValue
              ? 'bg-subaction text-action font-semibold'
              : 'text-neutral-dark hover:bg-neutral-lightest hover:text-corporate'
          ]"
        >
          <div class="flex flex-col min-w-0">
            <span class="truncate">{{ opt.label }}</span>
            <span v-if="opt.description" class="text-[11px] text-neutral-medium truncate mt-0.5 font-normal">
              {{ opt.description }}
            </span>
          </div>
          <CheckIcon
            v-if="opt.value === modelValue"
            class="w-4 h-4 text-action shrink-0"
          />
        </li>

        <li
          v-if="!filteredOptions.length"
          class="py-6 px-4 text-center text-xs text-neutral-medium"
        >
          No hay opciones que coincidan con "{{ searchQuery }}"
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  X as XIcon
} from 'lucide-vue-next';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: (SelectOption | string | number)[];
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    error?: string;
  }>(),
  {
    placeholder: 'Seleccionar opción…',
    searchPlaceholder: 'Buscar…',
    disabled: false,
    error: ''
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

// Normalizar opciones a SelectOption[]
const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt as SelectOption;
    }
    return {
      value: opt,
      label: String(opt)
    };
  });
});

const selectedOption = computed(() => {
  return normalizedOptions.value.find((o) => o.value === props.modelValue);
});

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return normalizedOptions.value;
  return normalizedOptions.value.filter((opt) => {
    const l = opt.label.toLowerCase();
    const d = opt.description?.toLowerCase() || '';
    return l.includes(query) || d.includes(query);
  });
});

async function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    await nextTick();
    searchInputRef.value?.focus();
  }
}

function closeDropdown() {
  isOpen.value = false;
  searchQuery.value = '';
}

function selectOption(opt: SelectOption) {
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  closeDropdown();
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(() => props.disabled, (dis) => {
  if (dis && isOpen.value) closeDropdown();
});
</script>
