import { apiClient } from "../../../core/api/axios";
import type { Alta, Persona, Permiso, Parametro, Respuesta, Sesion } from "../interfaces";

async function request<T>(method: string, url: string, data?: unknown): Promise<T> {
  const response = await apiClient.request<Respuesta<T>>({ method, url, data });
  if (!response.data.success) throw new Error(response.data.message || "No se pudo completar la operación.");
  return response.data.data;
}
async function listAll(url: string): Promise<Persona[]> {
  const rows: Persona[] = [];
  for (let pagina = 1; ; pagina++) {
    const response = await apiClient.get<Respuesta<Persona[]>>(url, { params: { pagina, por_pagina: 100 } });
    if (!response.data.success || !Array.isArray(response.data.data)) throw new Error("No se pudo cargar el listado.");
    rows.push(...response.data.data);
    if (rows.length >= (response.data.meta?.total ?? rows.length) || response.data.data.length === 0) break;
  }
  return rows;
}
export const service = {
  session: () => request<Sesion>("GET", "/seguridad/sesion"),
  employees: () => listAll("/admin/empleados"),
  clients: () => listAll("/admin/clientes"),
  employee: (id: number) => request<Persona>("GET", `/admin/empleados/${id}`),
  client: (id: number) => request<Persona>("GET", `/admin/clientes/${id}`),
  async create(data: Alta) {
    return (await request<{ id_usuario: number }>("POST", "/admin/empleados", data)).id_usuario;
  },
  update: (id: number, data: { nombre: string; telefono: string }) => request("PATCH", `/admin/empleados/${id}`, data),
  async status(kind: "empleados" | "clientes", person: Persona, motivo: string) {
    if (person.id_usuario === 1) throw new Error("La cuenta del administrador está protegida.");
    const active = person.estado === "activo";
    const action = kind === "empleados" ? (active ? "desactivar" : "reactivar") : (active ? "bloquear" : "desbloquear");
    return request("PATCH", `/admin/${kind}/${person.id_usuario}/${action}`, active ? { motivo } : undefined);
  },
  async catalog(): Promise<Permiso[]> {
    return Object.values(await request<Record<string, Permiso[]>>("GET", "/admin/permisos/catalogo")).flat();
  },
  async permissions(id: number): Promise<string[]> {
    return (await request<{ permisos: string[] }>("GET", `/admin/empleados/${id}/permisos`)).permisos;
  },
  async savePermissions(id: number, permisos: string[]) {
    if (id === 1) throw new Error("Los permisos del administrador no se pueden modificar.");
    const response = await request<{ no_encontrados: string[] }>("PUT", `/admin/empleados/${id}/permisos`, { permisos });
    if (response.no_encontrados?.length) throw new Error("Algunos permisos ya no están disponibles. Vuelve a cargar el catálogo.");
  },
  parameters: () => request<Parametro[]>("GET", "/admin/parametros"),
  parameter: (parameter: Parametro) => request("PUT", "/admin/parametros", parameter),
  password: (contrasenaActual: string, contrasenaNueva: string) => request("PUT", "/seguridad/credenciales", { contrasenaActual, contrasenaNueva }),
  async logout() {
    await request("DELETE", "/seguridad/sesion");
    localStorage.removeItem("access_token");
  },
};
