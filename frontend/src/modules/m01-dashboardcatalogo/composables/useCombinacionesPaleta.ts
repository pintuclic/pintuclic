import { computed, type ComputedRef } from 'vue';
import type { ColorPaletaPublica } from '../interfaces/catalogo-publico.interface';

export interface EsquemaColorPublico {
  readonly nombre: string;
  readonly descripcion: string;
  readonly colores: readonly ColorPaletaPublica[];
}

const complementarias: Readonly<Record<string, readonly string[]>> = {
  amarillos: ['azules'],
  azules: ['amarillos'],
  verdes: ['rojos'],
  rojos: ['verdes'],
  grises: ['azules', 'amarillos'],
};

function completar(
  preferidos: readonly ColorPaletaPublica[],
  todos: readonly ColorPaletaPublica[],
  cantidad: number
): ColorPaletaPublica[] {
  const unicos = new Map<number, ColorPaletaPublica>();
  [...preferidos, ...todos].forEach((color) => unicos.set(color.id_color, color));
  return [...unicos.values()].slice(0, cantidad);
}

export function useCombinacionesPaleta(
  colores: ComputedRef<readonly ColorPaletaPublica[]>,
  seleccionado: ComputedRef<ColorPaletaPublica | null>
) {
  const esquemas = computed<EsquemaColorPublico[]>(() => {
    const todos = colores.value;
    const actual = seleccionado.value;
    if (!actual) return [];

    const mismaFamilia = todos.filter((color) => color.familia === actual.familia);
    const familiasComplementarias = complementarias[actual.familia ?? ''] ?? [];
    const opuestos = todos.filter((color) => familiasComplementarias.includes(color.familia ?? ''));
    const indice = todos.findIndex((color) => color.id_color === actual.id_color);
    const rotados = todos.map((_, desplazamiento) => todos[(indice + desplazamiento) % todos.length]).filter(Boolean);
    const tercio = Math.max(1, Math.floor(todos.length / 3));
    const triadicos = [actual, todos[(indice + tercio) % todos.length], todos[(indice + tercio * 2) % todos.length]].filter(Boolean);

    return [
      {
        nombre: 'Complementario',
        descripcion: 'Contraste claro para destacar elementos del espacio.',
        colores: completar([actual, ...opuestos], rotados, 2),
      },
      {
        nombre: 'Análogos',
        descripcion: 'Combinación suave con tonos cercanos.',
        colores: completar([actual, ...mismaFamilia], rotados, 4),
      },
      {
        nombre: 'Triádico',
        descripcion: 'Tres familias equilibradas para un ambiente dinámico.',
        colores: completar(triadicos, rotados, 3),
      },
      {
        nombre: 'Monocromático',
        descripcion: 'Variaciones de claridad dentro de una misma familia.',
        colores: completar([actual, ...mismaFamilia], rotados, 5),
      },
    ];
  });

  return { esquemas };
}
