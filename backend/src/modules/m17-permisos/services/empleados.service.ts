import bcrypt from 'bcrypt';
import { EmpleadosRepository } from '../repositories/empleados.repository';
import { PermisosRepository } from '../repositories/permisos.repository';
import { EmpleadoResumen, EmpleadoDetalle, EmpleadoCreadoRespuesta } from '../interfaces/m17.interfaces';
import { SesionService } from '../../m20-seguridad/services/sesion.service';

// ==============================================================================
// M17 - SERVICIO DE EMPLEADOS
// Logica de dominio para alta, consulta, actualizacion, baja logica y reactivacion.
// ==============================================================================

/** ID protegido del Administrador raiz del sistema (RF-ADM-01-14, RF-ADM-06-06). */
const ID_ADMIN_RAIZ = 1;

/** Costo de BCrypt para la credencial temporal (RF-SEG-01-01, HU-SEG-01). */
const BCRYPT_COST = 12;

/** Longitud de la credencial temporal generada (suficientemente entrópica). */
const LONGITUD_CREDENCIAL_TEMPORAL = 16;

/** Caracteres admitidos en la credencial temporal. */
const CHARS_CREDENCIAL = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';

export class EmpleadosService {
  constructor(
    private readonly empleadosRepo: EmpleadosRepository,
    private readonly permisosRepo: PermisosRepository,
    private readonly sesionService: SesionService,
  ) {}

  /**
   * Genera una credencial temporal segura de un solo uso (HU-SEG-01).
   * Solo se entrega al administrador en la respuesta de creacion.
   */
  private generarCredencialTemporal(): string {
    let resultado = '';
    for (let i = 0; i < LONGITUD_CREDENCIAL_TEMPORAL; i++) {
      resultado += CHARS_CREDENCIAL[Math.floor(Math.random() * CHARS_CREDENCIAL.length)];
    }
    return resultado;
  }

  /**
   * Alta de empleado (RF-ADM-01-02, RF-ADM-01-03, RF-ADM-01-04).
   *
   * Flujo:
   * 1. Valida unicidad global de correo (HU-CUE-08).
   * 2. Genera credencial temporal y la hashea con BCrypt costo 12 (HU-SEG-01).
   * 3. Crea el usuario con tipo='normal', estado='activo'.
   * 4. Crea rol individual `empleado_{id}` (Opcion A de arquitectura de permisos).
   * 5. Asigna el rol al usuario en usuario_rol.
   * 6. El empleado inicia con CERO permisos (RF-ADM-01-04).
   * 7. Retorna la credencial temporal EN TEXTO PLANO una unica vez (RF-ADM-01-04).
   */
  async crearEmpleado(datos: {
    nombre: string;
    correo: string;
    telefono?: string | undefined;
  }): Promise<EmpleadoCreadoRespuesta | { error: string }> {
    // 1. Unicidad global de correo
    const correoExiste = await this.empleadosRepo.correoExiste(datos.correo);
    if (correoExiste) {
      return { error: 'El correo ya está registrado en el sistema (HU-CUE-08)' };
    }

    // 2. Credencial temporal
    const credencialTemporal = this.generarCredencialTemporal();
    const hashCredencial = await bcrypt.hash(credencialTemporal, BCRYPT_COST);

    // 3. Crear usuario (con id_rol nulo inicialmente)
    const idUsuario = await this.empleadosRepo.crearEmpleado({
      nombre: datos.nombre,
      correo: datos.correo,
      ...(datos.telefono !== undefined && { telefono: datos.telefono }),
      contrasena_hash: hashCredencial,
      id_rol: 0, // Se actualiza en el paso siguiente
    });

    // 4. Crear rol individual
    const idRol = await this.empleadosRepo.crearRolIndividual(idUsuario);

    // 5. Asignar rol al usuario (usuario_rol + id_rol directo)
    await this.empleadosRepo.asignarRolAUsuario(idUsuario, idRol);
    await this.empleadosRepo.actualizarRolDirecto(idUsuario, idRol);

    // 6. El empleado inicia con cero permisos (no se asigna nada al rol)

    return {
      id_usuario: idUsuario,
      correo: datos.correo,
      contrasena_temporal: credencialTemporal,
    };
  }

  /**
   * Lista empleados con filtros (RF-ADM-01-12).
   */
  async listarEmpleados(filtros: {
    estado?: 'activo' | 'inactivo' | 'bloqueado' | 'pendiente' | undefined;
    busqueda?: string | undefined;
    pagina: number;
    por_pagina: number;
  }): Promise<{ empleados: EmpleadoResumen[]; total: number; pagina: number; por_pagina: number }> {
    const { empleados, total } = await this.empleadosRepo.listarEmpleados(filtros);
    return { empleados, total, pagina: filtros.pagina, por_pagina: filtros.por_pagina };
  }

  /**
   * Ficha completa de un empleado con sus permisos actuales (RF-ADM-01-13).
   */
  async obtenerEmpleado(idUsuario: number): Promise<EmpleadoDetalle | null> {
    const empleado = await this.empleadosRepo.obtenerEmpleadoPorId(idUsuario);
    if (!empleado) return null;

    const idRol = await this.empleadosRepo.obtenerIdRolIndividual(idUsuario);
    const permisos = idRol ? await this.permisosRepo.obtenerPermisosDeRol(idRol) : [];

    return { ...empleado, permisos };
  }

  /**
   * Actualizacion de datos de contacto (nombre y/o telefono) (RF-ADM-01-07).
   * El correo NO se puede cambiar por este medio.
   */
  async actualizarContacto(idUsuario: number, datos: {
    nombre?: string | undefined;
    telefono?: string | undefined;
  }): Promise<{ ok: boolean; error?: string }> {
    const empleado = await this.empleadosRepo.obtenerEmpleadoPorId(idUsuario);
    if (!empleado) {
      return { ok: false, error: 'Empleado no encontrado' };
    }
    await this.empleadosRepo.actualizarContacto(idUsuario, datos);
    return { ok: true };
  }

  /**
   * Desactivacion logica de un empleado (RF-ADM-01-10, RF-ADM-01-14).
   *
   * - No permite desactivar al Administrador raiz (ID: 1).
   * - Invalida todas las sesiones activas del empleado (RF-SEG-02-06).
   */
  async desactivarEmpleado(idUsuario: number): Promise<{ ok: boolean; error?: string }> {
    if (idUsuario === ID_ADMIN_RAIZ) {
      return { ok: false, error: 'No se puede desactivar al Administrador raíz del sistema (RF-ADM-01-14)' };
    }

    const empleado = await this.empleadosRepo.obtenerEmpleadoPorId(idUsuario);
    if (!empleado) {
      return { ok: false, error: 'Empleado no encontrado' };
    }

    if (empleado.estado === 'inactivo') {
      return { ok: false, error: 'El empleado ya se encuentra inactivo' };
    }

    // Actualiza estado a inactivo
    await this.empleadosRepo.actualizarEstado(idUsuario, 'inactivo');

    // Invalida sesiones activas via M20 (RF-SEG-02-06, cuenta_desactivada)
    await this.sesionService.invalidarSesionesDeUsuario(idUsuario, 'cuenta_desactivada');

    return { ok: true };
  }

  /**
   * Reactivacion de empleado previamente desactivado (RF-ADM-01-09).
   * Restaura el empleado a estado activo; sus permisos no cambian.
   */
  async reactivarEmpleado(idUsuario: number): Promise<{ ok: boolean; error?: string }> {
    const empleado = await this.empleadosRepo.obtenerEmpleadoPorId(idUsuario);
    if (!empleado) {
      return { ok: false, error: 'Empleado no encontrado' };
    }

    if (empleado.estado === 'activo') {
      return { ok: false, error: 'El empleado ya se encuentra activo' };
    }

    await this.empleadosRepo.actualizarEstado(idUsuario, 'activo');
    return { ok: true };
  }
}


