import test from "node:test";
import assert from "node:assert/strict";
import {
  togglePermission,
  dependentPermissions,
  reserved,
} from "../services/permission-rules.ts";
const catalog = [
  "catalogo.ver",
  "catalogo.crear",
  "catalogo.editar",
  "ventas.ver",
  "ventas.gestionar",
  "seguridad.gestionar_privacidad",
];
test("otorgar una operación incluye su consulta sin duplicados", () => {
  const next = togglePermission(
    "catalogo.editar",
    true,
    ["ventas.ver", "catalogo.ver"],
    catalog,
  );
  assert.deepEqual(next, ["catalogo.editar", "catalogo.ver", "ventas.ver"]);
});
test("revocar consulta elimina todas sus operaciones y conserva otras áreas", () => {
  assert.deepEqual(
    togglePermission(
      "catalogo.ver",
      false,
      ["catalogo.ver", "catalogo.editar", "catalogo.crear", "ventas.ver"],
      catalog,
    ),
    ["ventas.ver"],
  );
});
test("revocar operación conserva la consulta", () => {
  assert.deepEqual(
    togglePermission(
      "catalogo.editar",
      false,
      ["catalogo.ver", "catalogo.editar"],
      catalog,
    ),
    ["catalogo.ver"],
  );
});
test("no inventa consultas que no existen en el catálogo", () => {
  assert.deepEqual(
    togglePermission("seguridad.gestionar_privacidad", true, [], catalog),
    ["seguridad.gestionar_privacidad"],
  );
});
test("accesos exclusivos no pueden concederse a empleados", () => {
  for (const name of [
    "configuracion.ver",
    "configuracion.editar",
    "personal.editar",
    "personal.desactivar",
    "seguridad.gestionar_permisos",
    "seguridad.configurar_sesion",
  ]) {
    assert.equal(reserved(name), true);
    assert.deepEqual(togglePermission(name, true, [], catalog), []);
  }
});
test("dependencias nunca mezclan áreas con prefijos similares", () => {
  assert.deepEqual(
    dependentPermissions("ventas.ver", [
      "ventas.ver",
      "ventas.gestionar",
      "ventas_extra.editar",
    ]),
    ["ventas.gestionar"],
  );
});
