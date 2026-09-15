import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("demostración: alta, duplicidad, permisos y baja sin peticiones al servidor", async () => {
  const vite = await createServer({
    mode: "test",
    define: { "import.meta.env.VITE_M17_DEMO": JSON.stringify("true") },
    server: { middlewareMode: true, watch: null, ws: false },
  });
  try {
    const { service, demo } = await vite.ssrLoadModule(
      "/src/modules/m17-permisos/services/m17.service.ts",
    );
    const { apiClient } = await vite.ssrLoadModule("/src/core/api/axios.ts");
    apiClient.defaults.adapter = () => {
      throw new Error("La demostración no debe enviar peticiones reales.");
    };
    assert.equal(demo, true);
    assert.deepEqual(await service.employees(), []);
    const clients = await service.clients();
    assert.equal(clients.length, 3);
    await assert.rejects(
      () =>
        service.create({
          nombre: "Duplicado",
          correo: clients[0].correo,
          telefono: "3001234567",
          doc_identidad: "12345678",
        }),
      /correo/,
    );
    const id = await service.create({
      nombre: "Empleado de prueba",
      correo: "prueba@example.test",
      telefono: "3001234567",
      doc_identidad: "12345678",
    });
    assert.deepEqual(await service.permissions(id), []);
    await service.savePermissions(id, ["catalogo.ver", "catalogo.editar"]);
    assert.deepEqual(await service.permissions(id), [
      "catalogo.ver",
      "catalogo.editar",
    ]);
    await service.update(id, {
      nombre: "Empleado actualizado",
      telefono: "3110000000",
    });
    let person = await service.employee(id);
    assert.equal(person.nombre, "Empleado actualizado");
    await service.status("empleados", person, "Fin del contrato de prueba");
    person = await service.employee(id);
    assert.equal(person.estado, "inactivo");
    assert.deepEqual(person.permisos, ["catalogo.ver", "catalogo.editar"]);
    await service.status("empleados", person, "");
    assert.equal((await service.employee(id)).estado, "activo");
    await assert.rejects(
      () =>
        service.status(
          "empleados",
          { ...person, id_usuario: 1 },
          "motivo de prueba",
        ),
      /protegida/,
    );
    await assert.rejects(() => service.savePermissions(1, []), /administrador/);
    await assert.rejects(
      () => service.password("anterior", "NuevaClave1"),
      /sesión real/,
    );
  } finally {
    await vite.close();
  }
});
