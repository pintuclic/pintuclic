import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';

test('integración: rutas bajo /admin, DTOs compartidos y aislamiento de Pinia', async () => {
  const vite = await createServer({
    mode: 'test',
    define: { 'import.meta.env.VITE_M17_DEMO': JSON.stringify('true') },
    server: { middlewareMode: true, watch: null, ws: false },
  });
  try {
    const { m17Routes } = await vite.ssrLoadModule('/src/modules/m17-permisos/m17.routes.ts');
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/admin', component: { template: '<router-view />' }, children: m17Routes }],
    });
    for (const [path, title] of [
      ['/admin', 'Dashboard'],
      ['/admin/empleados', 'Empleados'],
      ['/admin/usuarios', 'Empleados'],
      ['/admin/empleados/nuevo', 'Nuevo empleado'],
      ['/admin/empleados/100/editar', 'Editar empleado'],
      ['/admin/clientes/2', 'Ficha del cliente'],
      ['/admin/permisos', 'Permisos y accesos'],
      ['/admin/roles', 'Permisos y accesos'],
      ['/admin/perfil', 'Mi perfil'],
      ['/admin/desconocida', 'Página no encontrada'],
    ]) {
      const resolved = router.resolve(path);
      assert.equal(resolved.meta.title, title, path);
      assert.equal(resolved.matched[0].path, '/admin');
    }
    await router.push('/admin/administrador');
    assert.equal(router.currentRoute.value.fullPath, '/admin/perfil');

    const { crearEmpleadoSchema, actualizarEmpleadoSchema } = await vite.ssrLoadModule('/src/modules/m17-permisos/dtos/empleado.dto.ts');
    const employee = { nombre: ' Prueba local ', correo: 'QA@example.test', telefono: '3001234567', doc_identidad: 'TEST12345' };
    assert.equal(crearEmpleadoSchema.parse(employee).correo, 'qa@example.test');
    assert.equal(crearEmpleadoSchema.safeParse({ ...employee, telefono: 'no valido' }).success, false);
    assert.equal(actualizarEmpleadoSchema.safeParse({ nombre: 'Prueba', telefono: '3001234567' }).success, true);
    const { cambiarContrasenaSchema } = await vite.ssrLoadModule('/src/modules/m17-permisos/dtos/perfil.dto.ts');
    assert.equal(cambiarContrasenaSchema.safeParse({ current: 'Anterior1', next: 'Nueva123', repeat: 'Nueva123' }).success, true);
    assert.equal(cambiarContrasenaSchema.safeParse({ current: 'Nueva123', next: 'Nueva123', repeat: 'Nueva123' }).success, false);
    assert.equal(cambiarContrasenaSchema.safeParse({ current: 'Anterior1', next: 'corta', repeat: 'corta' }).success, false);

    const { useM17Store, useM17 } = await vite.ssrLoadModule('/src/modules/m17-permisos/store/useM17.ts');
    setActivePinia(createPinia());
    const first = useM17Store();
    const facade = useM17();
    await first.refresh();
    assert.equal(facade.isAdmin.value, true);
    first.state.session = { id_usuario: 20, id_rol: 2, permisos: ['personal.ver'] };
    assert.equal(facade.isAdmin.value, false);
    assert.equal(facade.canAttend.value, true);
    first.message({ isAxiosError: true, response: { status: 403 } });
    assert.equal(first.state.ready, false);
    assert.deepEqual(first.state.clients, []);
    assert.notEqual(first.state.session, null);
    first.message({ isAxiosError: true, response: { status: 401 } });
    assert.equal(first.state.session, null);
    setActivePinia(createPinia());
    const second = useM17Store();
    assert.notEqual(first, second);
    assert.equal(second.state.error, '');
  } finally {
    await vite.close();
  }
});
