import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { apiClient } from '@/core/api/axios';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';

// El catálogo público envía categorías y subcategorías múltiples a través del servicio de
// búsqueda de M02: estas pruebas fijan el formato que acepta la API (`?categoria=1,2`).
vi.mock('@/core/api/axios', () => ({ apiClient: { get: vi.fn() } }));

const getMock = vi.mocked(apiClient.get);
const paramsEnviados = () => (getMock.mock.lastCall?.[1] as { params: Record<string, unknown> }).params;

describe('servicio de búsqueda: filtros de categoría y subcategoría', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: { success: true, data: { items: [], total: 0, pagina: 1, limite: 16, total_paginas: 1 } } });
  });

  it('serializa varias categorías y subcategorías separadas por comas', async () => {
    await BusquedaService.buscar({ categoria: [1, 2], subcategoria: [3, 4] });
    expect(paramsEnviados()).toMatchObject({ categoria: '1,2', subcategoria: '3,4' });
  });

  it('mantiene la compatibilidad con un solo id', async () => {
    await BusquedaService.buscar({ categoria: 5 });
    expect(paramsEnviados()).toMatchObject({ categoria: '5' });
    await BusquedaService.facetas({ subcategoria: [7] });
    expect(paramsEnviados()).toMatchObject({ subcategoria: '7' });
  });

  it('omite las listas vacías', async () => {
    await BusquedaService.buscar({ categoria: [], subcategoria: [] });
    expect(paramsEnviados()).not.toHaveProperty('categoria');
    expect(paramsEnviados()).not.toHaveProperty('subcategoria');
  });

  it('la URL final no usa corchetes (`categoria[]=`), que la API ignoraría', async () => {
    await BusquedaService.buscar({ categoria: [1, 2], subcategoria: [3, 4], marca: [4, 5] });
    const url = axios.getUri({ url: '/busqueda/productos', params: paramsEnviados() });
    expect(url).toBe('/busqueda/productos?categoria=1,2&subcategoria=3,4&marca=4,5');
  });
});
