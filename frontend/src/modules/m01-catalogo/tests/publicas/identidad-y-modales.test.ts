import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import CalculadoraPinturaContenido from '../../components/publicas/CalculadoraPinturaContenido.vue';
import CartaColoresProductoPublica from '../../components/publicas/CartaColoresProductoPublica.vue';
import MenuCategoriasPublico from '../../components/publicas/MenuCategoriasPublico.vue';
import VistaDetalleProductoPublico from '../../views/publicas/VistaDetalleProductoPublico.vue';
import { useCierrePorFondo } from '../../composables/publicas/useCierrePorFondo';
import type { CategoriaPublica, FichaProductoPublico, VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

const variante = (id: number, idColor: number, color: string, hex: string) => ({
  id_variante: id, id_presentacion: 1, presentacion: 'Galón', volumen: '3.785', id_color: idColor, color,
  codigo_color: null, muestra_hex: hex, familia_color: null, precio_vigente: 50000, existencia_referencial: 5,
}) as unknown as VariantePublica;

/** Esmalte de colores fijos con una imagen general y otra asociada al color Azul. */
const FICHA = {
  id_producto: 9,
  nombre: 'Esmalte de prueba',
  descripcion: null,
  id_marca: 1,
  clase_color: 'colores_fijos',
  rendimiento_min: null,
  rendimiento_max: null,
  variantes: [variante(90, 5, 'Rojo', '#C0392B'), variante(91, 6, 'Azul', '#1F4E9C')],
  imagenes: [
    { id_imagen: 1, id_producto: 9, id_variante: null, id_color: null, mime_type: 'image/png', orden: 0, es_principal: true, contenido_url: '/img/general' },
    { id_imagen: 2, id_producto: 9, id_variante: null, id_color: 6, mime_type: 'image/png', orden: 1, es_principal: false, contenido_url: '/img/azul' },
  ],
} as unknown as FichaProductoPublico;

vi.mock('../../services/publicas/catalogo-publico.service', async (original) => {
  const real = await original<typeof import('../../services/publicas/catalogo-publico.service')>();
  return {
    ...real,
    CatalogoPublicoService: {
      listarCategorias: async () => [],
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 16 }),
      obtenerFicha: async () => FICHA,
      listarComplementarios: async () => [],
    },
  };
});

async function montarFicha() {
  setActivePinia(createPinia());
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/catalogo', name: 'CatalogoPublico', component: { render: () => null } },
      { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: VistaDetalleProductoPublico, props: true },
      { path: '/calculadora', name: 'CalculadoraPinturaPublica', component: { render: () => null } },
    ],
  });
  await router.push('/productos/9');
  await router.isReady();
  const wrapper = mount(VistaDetalleProductoPublico, {
    props: { productoId: '9' },
    global: {
      plugins: [router],
      stubs: { ProductosComplementariosPublicos: true, CartaColoresProductoPublica: true, CalculadoraPinturaPublica: true },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('CA-CAT-07-03 · imagen del color elegido', () => {
  it('al seleccionar un color con imagen propia, la ficha muestra esa imagen', async () => {
    const wrapper = await montarFicha();
    // Imagen principal (la galería de miniaturas muestra todas las imágenes a la vez).
    const principal = () => wrapper.find('img[alt="Esmalte de prueba"].object-contain').attributes('src');
    expect(principal()).toBe('/img/general');

    await wrapper.find('button[aria-label="Seleccionar color Azul"]').trigger('click');

    expect(principal()).toBe('/img/azul');
    wrapper.unmount();
  });

  it('el precio de la ficha usa la tipografía de marca (Poppins)', async () => {
    const wrapper = await montarFicha();
    const precio = wrapper.findAll('p').find((p) => p.text().includes('50.000'));
    expect(precio?.classes()).toContain('font-poppins');
    wrapper.unmount();
  });
});

describe('cierre de modales al pulsar el fondo', () => {
  /** Simula pulsar en `origen` y soltar en `destino`: el clic llega al ancestro común. */
  async function pulsarYSoltar(origen: Element, destinoClic: Element) {
    origen.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    destinoClic.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
  }

  it('la función solo cierra si el clic empezó y terminó en el fondo', () => {
    const cerrar = vi.fn();
    const { alPulsarFondo, alSoltarEnFondo } = useCierrePorFondo(cerrar);
    const fondo = document.createElement('div');
    const contenido = document.createElement('div');
    fondo.appendChild(contenido);
    const evento = (tipo: string, target: Element) => ({ type: tipo, target, currentTarget: fondo }) as unknown as MouseEvent;

    alPulsarFondo(evento('mousedown', contenido));
    alSoltarEnFondo(evento('click', fondo));
    expect(cerrar).not.toHaveBeenCalled();

    alPulsarFondo(evento('mousedown', fondo));
    alSoltarEnFondo(evento('click', fondo));
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  const CATEGORIAS: CategoriaPublica[] = [{ id_categoria: 1, nombre: 'Pinturas', subcategorias: [{ id_subcategoria: 1, nombre: 'Interiores' }] }];

  it('menú de categorías: seleccionar dentro y soltar fuera no lo cierra; pulsar el fondo sí', async () => {
    const wrapper = mount(MenuCategoriasPublico, {
      props: { abierto: true, cargando: false, categorias: CATEGORIAS },
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    });
    const fondo = wrapper.find('[role="presentation"]').element;
    const ventana = wrapper.find('[role="dialog"]').element;

    await pulsarYSoltar(ventana, fondo);
    expect(wrapper.emitted('cerrar')).toBeUndefined();

    await pulsarYSoltar(fondo, fondo);
    expect(wrapper.emitted('cerrar')).toHaveLength(1);
    wrapper.unmount();
  });

  it('carta de colores: arrastrar desde el buscador y soltar fuera no la cierra', async () => {
    const wrapper = mount(CartaColoresProductoPublica, {
      props: { abierta: true, nombreProducto: 'Esmalte', variantes: FICHA.variantes, varianteSeleccionadaId: 90 },
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    });
    const fondo = wrapper.find('[role="presentation"]').element;

    await pulsarYSoltar(wrapper.find('input').element, fondo);
    expect(wrapper.emitted('cerrar')).toBeUndefined();

    await pulsarYSoltar(fondo, fondo);
    expect(wrapper.emitted('cerrar')).toHaveLength(1);
    wrapper.unmount();
  });
});

describe('errores con el color de peligro (danger), no el amarillo de destacados', () => {
  it('los errores de la calculadora usan danger en el texto y en el borde', async () => {
    const wrapper = mount(CalculadoraPinturaContenido);
    const [ancho] = wrapper.findAll('input[type="number"]');
    await ancho.setValue(0);

    expect(wrapper.find('#error-calculadora-ancho').classes()).toContain('text-danger');
    expect(ancho.classes()).toContain('border-danger');
    expect(wrapper.html()).not.toContain('text-highlight" role="alert"');
  });
});
