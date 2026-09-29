import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { seedAccounts } from './seed-reader.mjs';

test('M17 usa HTTP incluso si el flag demo anterior está activado; conserva contratos y errores', async () => {
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  const vite = await createServer({ mode: 'test', define: { 'import.meta.env.VITE_M17_DEMO': 'true' }, server: { middlewareMode: true, watch: null, ws: false } });
  try {
    const { service } = await vite.ssrLoadModule('/src/modules/m17-permisos/services/m17.service.ts');
    const { apiClient } = await vite.ssrLoadModule('/src/core/api/axios.ts');
    const accounts = seedAccounts();
    const admin = accounts.find(p => p.id_rol === 1);
    const client = accounts.find(p => p.id_rol !== 1);
    assert.ok(admin && client);
    const calls = [];
    let response = {};
    apiClient.defaults.adapter = async config => {
      calls.push(config);
      return { data: { success: true, data: response }, status: 200, statusText: 'OK', headers: {}, config };
    };
    response = { id_usuario: admin.id_usuario, id_rol: admin.id_rol, permisos: [] };
    assert.equal((await service.session()).id_usuario, admin.id_usuario);
    assert.equal(calls.at(-1).url, '/seguridad/sesion');
    response = client;
    assert.deepEqual(await service.client(client.id_usuario), client);
    await service.status('clientes', client, 'Motivo indicado en la prueba');
    assert.equal(calls.at(-1).method, 'patch');
    assert.match(calls.at(-1).url, /\/bloquear$/);
    response = { id_usuario: client.id_usuario };
    const { nombre, correo, telefono } = client;
    assert.equal(await service.create({ nombre, correo, telefono, doc_identidad: String(client.id_usuario) }), client.id_usuario);
    assert.equal(calls.at(-1).method, 'post');
    assert.equal(calls.at(-1).url, '/admin/empleados');
    response = { no_encontrados: ['permiso.inexistente'] };
    await assert.rejects(() => service.savePermissions(client.id_usuario, []), /ya no están disponibles/);
    const count = calls.length;
    await assert.rejects(() => service.savePermissions(admin.id_usuario, []), /administrador/);
    await assert.rejects(() => service.status('empleados', admin, ''), /protegida/);
    assert.equal(calls.length, count);
    const pages = [];
    apiClient.defaults.adapter = async config => {
      pages.push(config.params.pagina);
      return { data: { success: true, data: pages.length === 1 ? [client] : [], meta: { total: 2 } }, status: 200, statusText: 'OK', headers: {}, config };
    };
    assert.deepEqual(await service.clients(), [client]);
    assert.deepEqual(pages, [1, 2]);
    apiClient.defaults.adapter = async () => { throw new Error('Servidor no disponible'); };
    await assert.rejects(() => service.session(), /Servidor no disponible/);
    await assert.rejects(() => service.clients(), /Servidor no disponible/);
  } finally {
    await vite.close();
    if (storage) Object.defineProperty(globalThis, 'localStorage', storage);
    else delete globalThis.localStorage;
  }
});
