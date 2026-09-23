import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { seedAccounts } from './seed-reader.mjs';

test('integración: rutas bajo /admin, DTOs compartidos y aislamiento de Pinia', async () => {
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  const vite = await createServer({
    mode: 'test',
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
    const admin = seedAccounts().find(account => account.id_rol === 1);
    assert.ok(admin);
    const { apiClient } = await vite.ssrLoadModule('/src/core/api/axios.ts');
    apiClient.defaults.adapter = async config => ({
      data: { success: true, data: config.url === '/seguridad/sesion' ? { id_usuario: admin.id_usuario, id_rol: admin.id_rol, permisos: [] } : [] },
      status: 200, statusText: 'OK', headers: {}, config,
    });
    setActivePinia(createPinia());
    const first = useM17Store();
    const facade = useM17();
    await first.refresh();
    assert.equal(facade.isAdmin.value, true);
    first.state.session = { id_usuario: 20, id_rol: 2, permisos: ['personal.ver'] };
    assert.equal(facade.isAdmin.value, false);
    assert.equal(facade.canAttend.value, true);

    first.state.employees = Array.from({ length: 6 }, (_, index) => ({
      id_usuario: index + 10,
      nombre: `Empleado ${index + 1}`,
      correo: `empleado${index + 1}@example.test`,
      telefono: null,
      estado: 'activo',
    }));
    let permissionCalls = 0;
    let activePermissionCalls = 0;
    let maximumConcurrency = 0;
    apiClient.defaults.adapter = async config => {
      if (config.url?.endsWith('/permisos')) {
        permissionCalls++;
        activePermissionCalls++;
        maximumConcurrency = Math.max(maximumConcurrency, activePermissionCalls);
        await delay(5);
        activePermissionCalls--;
        const id = Number(config.url.split('/').at(-2));
        return {
          data: {
            success: true,
            data: { permisos: id % 2 === 0 ? ['personal.ver'] : [] },
          },
          status: 200, statusText: 'OK', headers: {}, config,
        };
      }
      return {
        data: { success: true, data: [] },
        status: 200, statusText: 'OK', headers: {}, config,
      };
    };
    assert.deepEqual(
      await first.permissionHolders('personal.ver'),
      ['Empleado 1', 'Empleado 3', 'Empleado 5'],
    );
    assert.equal(permissionCalls, 6);
    assert.ok(maximumConcurrency <= 4);
    await first.permissionHolders('catalogo.ver');
    assert.equal(permissionCalls, 6);
    first.cachePermissions(10, ['catalogo.ver']);
    assert.deepEqual(await first.permissions(10), ['catalogo.ver']);
    assert.equal(permissionCalls, 6);

    first.message({ isAxiosError: true, response: { status: 403 } });
    assert.equal(first.state.ready, false);
    assert.deepEqual(first.state.clients, []);
    assert.notEqual(first.state.session, null);
    await first.permissions(10);
    assert.equal(permissionCalls, 7);
    first.message({ isAxiosError: true, response: { status: 401 } });
    assert.equal(first.state.session, null);
    first.clearPermissionCache();
    const staleRead = first.permissions(10);
    first.clearPermissionCache();
    await assert.rejects(staleRead, /caducado/);
    const callsAfterStaleRead = permissionCalls;
    await first.permissions(10);
    assert.equal(permissionCalls, callsAfterStaleRead + 1);
    first.clearPermissionCache();
    const oldRead = first.permissions(10);
    first.cachePermissions(10, ['catalogo.ver']);
    assert.deepEqual(await oldRead, ['catalogo.ver']);
    assert.deepEqual(await first.permissions(10), ['catalogo.ver']);
    first.clearPermissionCache();
    await Promise.all(Array.from({ length: 12 }, (_, index) => first.permissions(index + 10)));
    assert.ok(maximumConcurrency <= 4);
    setActivePinia(createPinia());
    const second = useM17Store();
    assert.notEqual(first, second);
    assert.equal(second.state.error, '');
  } finally {
    await vite.close();
    if (storage) Object.defineProperty(globalThis, 'localStorage', storage);
    else delete globalThis.localStorage;
  }
});
