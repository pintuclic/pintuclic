import { describe, it, expect } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useMenuFlotante } from './useMenuFlotante';

interface Fila {
  id: string;
  nombre: string;
}

/** Componente anfitrión mínimo: `useMenuFlotante` necesita contexto de setup (useTemplateRef, onBeforeUnmount). */
function crearHost() {
  return defineComponent({
    setup() {
      return { ...useMenuFlotante<Fila>() };
    },
    render() {
      return h('div', [
        h(
          'button',
          {
            class: 'boton-fila-1',
            onClick: (e: Event) => this.abrir({ id: '1', nombre: 'Uno' }, e, (f: Fila) => f.id),
          },
          'fila 1'
        ),
        h(
          'button',
          {
            class: 'boton-fila-2',
            onClick: (e: Event) => this.abrir({ id: '2', nombre: 'Dos' }, e, (f: Fila) => f.id),
          },
          'fila 2'
        ),
        this.activo ? h('div', { ref: 'menu-flotante', class: 'menu' }, 'menú abierto') : null,
      ]);
    },
  });
}

describe('useMenuFlotante', () => {
  it('empieza cerrado', () => {
    const wrapper = mount(crearHost());
    expect(wrapper.vm.activo).toBeNull();
  });

  it('abrir() marca el ítem como activo', async () => {
    const wrapper = mount(crearHost());
    await wrapper.find('.boton-fila-1').trigger('click');
    expect(wrapper.vm.activo).toEqual({ id: '1', nombre: 'Uno' });
  });

  it('abrir() sobre la misma fila hace toggle (la cierra)', async () => {
    const wrapper = mount(crearHost());
    await wrapper.find('.boton-fila-1').trigger('click');
    await wrapper.find('.boton-fila-1').trigger('click');
    expect(wrapper.vm.activo).toBeNull();
  });

  it('abrir() sobre otra fila cambia el activo sin cerrarlo', async () => {
    const wrapper = mount(crearHost());
    await wrapper.find('.boton-fila-1').trigger('click');
    await wrapper.find('.boton-fila-2').trigger('click');
    expect(wrapper.vm.activo).toEqual({ id: '2', nombre: 'Dos' });
  });

  it('cerrar() resetea el activo', async () => {
    const wrapper = mount(crearHost());
    await wrapper.find('.boton-fila-1').trigger('click');
    wrapper.vm.cerrar();
    await nextTick();
    expect(wrapper.vm.activo).toBeNull();
  });

  it('Escape cierra el menú abierto', async () => {
    const wrapper = mount(crearHost(), { attachTo: document.body });
    await wrapper.find('.boton-fila-1').trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(wrapper.vm.activo).toBeNull();
    wrapper.unmount();
  });

  it('un clic fuera del botón y del menú lo cierra', async () => {
    const wrapper = mount(crearHost(), { attachTo: document.body });
    await wrapper.find('.boton-fila-1').trigger('click');

    const fuera = document.createElement('div');
    document.body.appendChild(fuera);
    fuera.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    expect(wrapper.vm.activo).toBeNull();
    fuera.remove();
    wrapper.unmount();
  });

  it('un clic dentro del propio botón de la fila no lo cierra por "afuera"', async () => {
    const wrapper = mount(crearHost(), { attachTo: document.body });
    const boton = wrapper.find('.boton-fila-1');
    await boton.trigger('click');
    boton.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(wrapper.vm.activo).toEqual({ id: '1', nombre: 'Uno' });
    wrapper.unmount();
  });

  it('calcula la posición del menú a partir del rect del botón', async () => {
    const wrapper = mount(crearHost());
    // jsdom no calcula layout real: getBoundingClientRect() da todo en 0.
    // top = bottom(0) + 4; left = max(8, right(0) - 176).
    await wrapper.find('.boton-fila-1').trigger('click');
    expect(wrapper.vm.pos).toEqual({ top: 4, left: 8 });
  });
});
