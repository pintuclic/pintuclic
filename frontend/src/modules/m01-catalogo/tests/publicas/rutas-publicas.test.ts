import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { routes } from '@/core/routes';

/** Regresión de integración: cargar las vistas reales desde el router global tras mover M01. */
describe('integración de las rutas públicas y administrativas de M01', () => {
  it('mantiene navegación, parámetros y layout público al cargar las cuatro vistas', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    for (const [url, nombre] of [
      ['/', 'InicioTiendaPublica'],
      ['/catalogo?subcategoria=1', 'CatalogoPublico'],
      ['/productos/1?color=2', 'DetalleProductoPublico'],
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
      if (nombre === 'CatalogoPublico') expect(actual.query.subcategoria).toBe('1');
    }
  });

  it('monta el panel actualizado bajo LayoutAdmin sin reutilizar las vistas antiguas', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    await router.push('/admin');
    expect(router.currentRoute.value.name).toBe('M01Productos');
    expect(router.currentRoute.value.path).toBe('/admin/catalogo/productos');
    for (const [url, nombre] of [
      ['/admin/catalogo/productos/1', 'M01ProductoDetalle'],
      ['/admin/catalogo/variantes', 'M01Variantes'],
      ['/admin/catalogo/categorias', 'M01Categorias'],
      ['/admin/catalogo/marcas', 'M01Marcas'],
      ['/admin/catalogo/marcas/1', 'M01MarcaDetalle'],
      ['/admin/catalogo/lineas', 'M01Lineas'],
      ['/admin/catalogo/colores', 'M01Colores'],
      ['/admin/catalogo/configuracion', 'M01CatalogosBase'],
    ]) {
      await router.push(url!);
      expect(router.currentRoute.value.name).toBe(nombre);
      expect(router.currentRoute.value.matched[0]?.name).toBe('Administracion');
      expect(router.currentRoute.value.matched.at(-1)?.components?.default).toBeTypeOf('object');
    }
  });
});
