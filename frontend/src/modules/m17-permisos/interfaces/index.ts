export type Estado = "activo" | "inactivo" | "bloqueado" | "pendiente";
export interface Persona {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  estado: Estado;
  permisos?: string[];
  tipo?: "normal" | "empresa";
  doc_identidad?: string;
}
export interface Alta {
  nombre: string;
  correo: string;
  telefono: string;
  doc_identidad: string;
}
export interface Permiso {
  id_permiso: number;
  nombre: string;
  descripcion: string | null;
  area: string;
}
export interface Parametro {
  clave: string;
  valor: string | number | boolean;
  descripcion?: string;
}
export interface Sesion {
  id_usuario: number;
  id_rol: number;
  permisos: string[];
  tipo_sesion?: string;
}
export interface Actividad {
  id: number;
  fecha: string;
  accion: string;
  entidad: string;
}
export interface Respuesta<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; pagina: number; por_pagina: number };
}
