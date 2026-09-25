/**
 * ==============================================================================
 * M04 - INTERFACES DE DIRECCIONES DE CLIENTE (HU-CUE-07)
 * Tipos estáticos para compilación TypeScript: 0 bytes de runtime.
 * Conforme a AGENTS.md y frontend/infraestructura.md
 * ==============================================================================
 */

export interface DireccionCliente {
  id_direccion: string;
  id_usuario: number;
  direccion: string;
  barrio: string;
  apartamento_casa?: string | null;
  nombre_apellido: string;
  telefono: string;
  es_predeterminada: boolean;
  latitud?: number | null;
  longitud?: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CrearDireccionPayload {
  direccion: string;
  barrio: string;
  apartamento_casa?: string | null;
  nombre_apellido: string;
  telefono: string;
  es_predeterminada?: boolean;
  latitud?: number | null;
  longitud?: number | null;
}

export type ActualizarDireccionPayload = Partial<CrearDireccionPayload>;
