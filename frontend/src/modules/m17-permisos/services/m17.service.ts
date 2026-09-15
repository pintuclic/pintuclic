import { apiClient } from "../../../core/api/axios";
import type {
  Alta,
  Persona,
  Permiso,
  Parametro,
  Respuesta,
  Sesion,
} from "../interfaces";
import seed from "../assets/seed-preview.json";

export const demo = import.meta.env.VITE_M17_DEMO === "true";
const empleados: Persona[] = [];
const clientes: Persona[] = demo
  ? (structuredClone(seed.clientes) as Persona[])
  : [];
let nextId = 100;
let previewParams: Parametro[] = [];
async function request<T>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  const r = await apiClient.request<Respuesta<T>>({ method, url, data });
  if (!r.data.success)
    throw new Error(r.data.message || "No se pudo completar la operación.");
  return r.data.data;
}
async function listAll(url: string): Promise<Persona[]> {
  const rows: Persona[] = [];
  for (let pagina = 1; ; pagina++) {
    const r = await apiClient.get<Respuesta<Persona[]>>(url, {
      params: { pagina, por_pagina: 100 },
    });
    if (!r.data.success || !Array.isArray(r.data.data))
      throw new Error("No se pudo cargar el listado.");
    rows.push(...r.data.data);
    if (
      rows.length >= (r.data.meta?.total ?? rows.length) ||
      r.data.data.length === 0
    )
      break;
  }
  return rows;
}
export const service = {
  async session(): Promise<Sesion> {
    return demo
      ? { id_usuario: 1, id_rol: 1, permisos: ["*"] }
      : request("GET", "/seguridad/sesion");
  },
  async employees() {
    return demo ? structuredClone(empleados) : listAll("/admin/empleados");
  },
  async clients() {
    return demo ? structuredClone(clientes) : listAll("/admin/clientes");
  },
  async employee(id: number): Promise<Persona> {
    if (!demo) return request("GET", `/admin/empleados/${id}`);
    const p = empleados.find((x) => x.id_usuario === id);
    if (!p) throw new Error("Empleado no encontrado.");
    return structuredClone(p);
  },
  async client(id: number): Promise<Persona> {
    if (!demo) return request("GET", `/admin/clientes/${id}`);
    const p = clientes.find((x) => x.id_usuario === id);
    if (!p) throw new Error("Cliente no encontrado.");
    return structuredClone(p);
  },
  async create(data: Alta) {
    if (!demo) {
      const r = await request<{ id_usuario: number }>(
        "POST",
        "/admin/empleados",
        data,
      );
      return r.id_usuario;
    }
    if (
      [...empleados, ...clientes].some(
        (x) => x.correo.toLowerCase() === data.correo.toLowerCase(),
      ) ||
      data.correo.toLowerCase() === "admin@pintuclic.co"
    )
      throw new Error("El correo ya pertenece a otra cuenta.");
    const id = nextId++;
    empleados.push({ ...data, id_usuario: id, estado: "activo", permisos: [] });
    return id;
  },
  async update(id: number, data: { nombre: string; telefono: string }) {
    if (!demo) return request("PATCH", `/admin/empleados/${id}`, data);
    const p = empleados.find((x) => x.id_usuario === id);
    if (p) Object.assign(p, data);
  },
  async status(kind: "empleados" | "clientes", p: Persona, motivo: string) {
    if (p.id_usuario === 1)
      throw new Error("La cuenta del administrador está protegida.");
    const active = p.estado === "activo";
    const action =
      kind === "empleados"
        ? active
          ? "desactivar"
          : "reactivar"
        : active
          ? "bloquear"
          : "desbloquear";
    if (!demo)
      return request(
        "PATCH",
        `/admin/${kind}/${p.id_usuario}/${action}`,
        active ? { motivo } : undefined,
      );
    const row = (kind === "empleados" ? empleados : clientes).find(
      (x) => x.id_usuario === p.id_usuario,
    );
    if (row) row.estado = active ? "inactivo" : "activo";
  },
  async catalog(): Promise<Permiso[]> {
    if (demo) return structuredClone(seed.permisos);
    const data = await request<Record<string, Permiso[]>>(
      "GET",
      "/admin/permisos/catalogo",
    );
    return Object.values(data).flat();
  },
  async permissions(id: number): Promise<string[]> {
    if (demo) return (await this.employee(id)).permisos ?? [];
    return (
      await request<{ permisos: string[] }>(
        "GET",
        `/admin/empleados/${id}/permisos`,
      )
    ).permisos;
  },
  async savePermissions(id: number, permisos: string[]) {
    if (id === 1)
      throw new Error("Los permisos del administrador no se pueden modificar.");
    if (!demo) {
      const r = await request<{ no_encontrados: string[] }>(
        "PUT",
        `/admin/empleados/${id}/permisos`,
        { permisos },
      );
      if (r.no_encontrados?.length)
        throw new Error(
          "Algunos permisos ya no están disponibles. Vuelve a cargar el catálogo.",
        );
      return;
    }
    const p = empleados.find((x) => x.id_usuario === id);
    if (p) p.permisos = [...permisos];
  },
  async parameters(): Promise<Parametro[]> {
    return demo
      ? structuredClone(previewParams)
      : request("GET", "/admin/parametros");
  },
  async parameter(p: Parametro) {
    if (!demo) return request("PUT", "/admin/parametros", p);
    previewParams = previewParams.map((x) =>
      x.clave === p.clave ? { ...p } : x,
    );
  },
  async password(contrasenaActual: string, contrasenaNueva: string) {
    if (demo)
      throw new Error("El cambio de contraseña requiere una sesión real.");
    return request("PUT", "/seguridad/credenciales", {
      contrasenaActual,
      contrasenaNueva,
    });
  },
  async logout() {
    if (!demo) await request("DELETE", "/seguridad/sesion");
    localStorage.removeItem("access_token");
  },
};
