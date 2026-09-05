import { ClientesRepository } from '../repositories/clientes.repository';
import { ClienteResumen } from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - SERVICIO DE CLIENTES
// Busqueda, ficha y bloqueo de clientes desde el panel de administracion.
// Aplica anonimizacion de datos sensibles (HU-SEG-06).
// ==============================================================================

export class ClientesService {
  constructor(private readonly clientesRepo: ClientesRepository) {}

  /**
   * Lista clientes con filtros facetados (RF-ADM-04-01).
   */
  async listarClientes(filtros: {
    busqueda?: string | undefined;
    tipo?: 'normal' | 'empresa' | undefined;
    estado?: 'activo' | 'inactivo' | 'bloqueado' | 'pendiente' | undefined;
    pagina: number;
    por_pagina: number;
  }): Promise<{ clientes: ClienteResumen[]; total: number; pagina: number; por_pagina: number }> {
    const { clientes, total } = await this.clientesRepo.listarClientes(filtros);
    return { clientes, total, pagina: filtros.pagina, por_pagina: filtros.por_pagina };
  }

  /**
   * Ficha de un cliente especifico.
   * Retorna null si el usuario no existe o es un empleado.
   * Aplica la politica de no exposicion de datos sensibles (HU-SEG-06):
   * correo se muestra anonimizado parcialmente.
   */
  async obtenerCliente(idUsuario: number): Promise<ClienteResumen | null> {
    const cliente = await this.clientesRepo.obtenerClientePorId(idUsuario);
    if (!cliente) return null;

    // HU-SEG-06: Anonimizar parcialmente el correo en la respuesta publica
    return {
      ...cliente,
      correo: this.anonimizarCorreo(cliente.correo),
    };
  }

  /**
   * Bloqueo administrativo de un cliente (RF-ADM-04-12).
   * El motivo es obligatorio y debe quedar en el registro.
   */
  async bloquearCliente(
    idUsuario: number,
    motivo: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const cliente = await this.clientesRepo.obtenerClientePorId(idUsuario);
    if (!cliente) {
      return { ok: false, error: 'Cliente no encontrado' };
    }

    if (cliente.estado === 'bloqueado') {
      return { ok: false, error: 'El cliente ya se encuentra bloqueado' };
    }

    // Registrar el motivo en el servidor (auditoria pendiente de HU-SEG-04)
    console.info(`[M17] Bloqueo cliente id=${idUsuario} motivo="${motivo}"`);

    await this.clientesRepo.actualizarEstado(idUsuario, 'bloqueado');
    return { ok: true };
  }

  /**
   * Desbloqueo administrativo de un cliente.
   */
  async desbloquearCliente(idUsuario: number): Promise<{ ok: boolean; error?: string }> {
    const cliente = await this.clientesRepo.obtenerClientePorId(idUsuario);
    if (!cliente) {
      return { ok: false, error: 'Cliente no encontrado' };
    }

    if (cliente.estado !== 'bloqueado') {
      return { ok: false, error: 'El cliente no está bloqueado' };
    }

    await this.clientesRepo.actualizarEstado(idUsuario, 'activo');
    return { ok: true };
  }

  /**
   * Anonimiza el correo para cumplir HU-SEG-06.
   * Ejemplo: 'usuario@ejemplo.com' -> 'us***@ejemplo.com'
   */
  private anonimizarCorreo(correo: string): string {
    const [local, dominio] = correo.split('@');
    if (!local || !dominio) return correo;
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${dominio}`;
  }
}

