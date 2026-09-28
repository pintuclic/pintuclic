import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { routes } from '@/core/routes';

/** Regresión de integración de las rutas públicas de M01. */
describe('integración de las rutas públicas de M01', () => {
  it('mantiene navegación, parámetros y layout público al cargar las vistas públicas', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    for (const [url, nombre] of [
      ['/', 'InicioTiendaPublica'],
      ['/catalogo?subcategoria=1', 'CatalogoPublico'],
      ['/productos/1?color=2', 'DetalleProductoPublico'],
      ['/productos/1/calculadora', 'CalculadoraPinturaProductoPublica'],
      ['/paleta-colores', 'PaletaColoresPublica'],
    ]) {
      await router.push(url!);

      const actual = router.currentRoute.value;

      expect(actual.name).toBe(nombre);
      expect(actual.matched[0]?.name).toBe('Tienda');
      expect(actual.meta.requiereAuth).toBe(false);
      expect(actual.matched.at(-1)?.components?.default).toBeTypeOf('object');

      if (nombre === 'DetalleProductoPublico') {
        expect(actual.params.productoId).toBe('1');
        expect(actual.query.color).toBe('2');
        expect(actual.matched.at(-1)?.props.default).toBe(true);
      }

      if (nombre === 'CalculadoraPinturaProductoPublica') {
        expect(actual.params.productoId).toBe('1');
        expect(actual.matched.at(-1)?.props.default).toBe(true);
      }

      if (nombre === 'CatalogoPublico') {
        expect(actual.query.subcategoria).toBe('1');
      }
    }
  }, 20000);
});