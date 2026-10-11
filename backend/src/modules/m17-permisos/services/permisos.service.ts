import { PermisosRepository } from '../repositories/permisos.repository';
import { EmpleadosRepository } from '../repositories/empleados.repository';
import {
  CatalogoPermisos,
  DEPENDENCIAS_PERMISOS,
  AreaFuncional,
} from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - SERVICIO DE PERMISOS
// Logica de asignacion/revocacion con regla de cascada.
// ==============================================================================

/** ID protegido del Administrador raiz: nunca se modifican sus permisos (RF-ADM-02-10). */
const ID_ADMIN_RAIZ = 1;

/**
 * Permisos exclusivos del superadministrador que no pueden asignarse a empleados.
 * Cualquier intento de concederlos a una cuenta de empleado se rechaza con error 400
 * para prevenir escalamiento de privilegios (HU-ADM-02, HU-ADM-03).
 */
const PERMISOS_RESERVADOS_ADMIN: ReadonlySet<string> = new Set([
  'seguridad.configurar_sesion',
  'seguridad.gestionar_permisos',
  'seguridad.gestionar_privacidad',
  'configuracion.ver',
  'configuracion.editar',
]);

export class PermisosService {
  constructor(
    private readonly permisosRepo: PermisosRepository,
    private readonly empleadosRepo: EmpleadosRepository,
  ) {}

  /**
   * Retorna el catalogo completo de permisos agrupado por area funcional (RF-ADM-02-01).
   */
  async obtenerCatalogo(): Promise<CatalogoPermisos> {
    const todos = await this.permisosRepo.obtenerCatalogoCompleto();
    const areas: AreaFuncional[] = ['catalogo', 'ventas', 'personal', 'seguridad', 'configuracion'];

    const catalogo = {} as CatalogoPermisos;
    for (const area of areas) {
      catalogo[area] = todos.filter((p) => p.area === area);
    }
    return catalogo;
  }

  /**
   * Retorna los permisos actuales de un empleado (RF-ADM-02-03).
   */
  async obtenerPermisosDeEmpleado(idUsuario: number): Promise<{
    permisos: string[];
    error?: never;
  } | {
    permisos?: never;
    error: string;
  }> {
    const idRol = await this.empleadosRepo.obtenerIdRolIndividual(idUsuario);
    if (idRol === null) {
      return { error: 'Empleado no encontrado o sin rol individual' };
    }
    const permisos = await this.permisosRepo.obtenerPermisosDeRol(idRol);
    return { permisos };
  }

  /**
   * Asigna permisos a un empleado con la regla de cascada (RF-ADM-02-02, RF-ADM-02-06).
   *
   * Regla de cascada al CONCEDER:
   * - Si el permiso solicitado es de operacion (ej: 'catalogo.crear'),
   *   auto-asigna el permiso de consulta correspondiente ('catalogo.ver').
   *
   * Restricciones:
   * - No puede modificar permisos del Administrador raiz (RF-ADM-02-10).
   * - No puede asignar permisos reservados de superadmin a empleados (HU-ADM-02, HU-ADM-03).
   */
  async asignarPermisos(idUsuario: number, nombresPermisos: string[]): Promise<{
    ok: boolean;
    asignados: string[];
    autoConcedidos: string[];
    noEncontrados: string[];
    error?: string;
  }> {
    if (idUsuario === ID_ADMIN_RAIZ) {
      return { ok: false, asignados: [], autoConcedidos: [], noEncontrados: [],
        error: 'No se pueden modificar los permisos del Administrador raiz (RF-ADM-02-10)' };
    }

    // Validar que no se intenten asignar permisos reservados del superadministrador
    const reservadosSolicitados = nombresPermisos.filter((p) => PERMISOS_RESERVADOS_ADMIN.has(p));
    if (reservadosSolicitados.length > 0) {
      return {
        ok: false,
        asignados: [],
        autoConcedidos: [],
        noEncontrados: [],
        error: `Permisos reservados exclusivos del Administrador no asignables a empleados: ${reservadosSolicitados.join(', ')}`,
      };
    }

    const idRol = await this.empleadosRepo.obtenerIdRolIndividual(idUsuario);
    if (idRol === null) {
      return { ok: false, asignados: [], autoConcedidos: [], noEncontrados: [],
        error: 'Empleado no encontrado o sin rol individual' };
    }

    const asignados: string[] = [];
    const autoConcedidos: string[] = [];
    const noEncontrados: string[] = [];

    // Expandir la lista con los permisos de cascada
    const permisosExpandidos = new Set(nombresPermisos);
    for (const nombre of nombresPermisos) {
      const dependencia = DEPENDENCIAS_PERMISOS[nombre];
      if (dependencia && !permisosExpandidos.has(dependencia)) {
        permisosExpandidos.add(dependencia);
        autoConcedidos.push(dependencia);
      }
    }

    for (const nombre of permisosExpandidos) {
      const idPermiso = await this.permisosRepo.obtenerIdPorNombre(nombre);
      if (idPermiso === null) {
        noEncontrados.push(nombre);
        continue;
      }
      await this.permisosRepo.asignarPermiso(idRol, idPermiso);
      if (!autoConcedidos.includes(nombre)) {
        asignados.push(nombre);
      }
    }

    return { ok: true, asignados, autoConcedidos, noEncontrados };
  }

  /**
   * Reemplaza COMPLETAMENTE los permisos de un empleado (PUT /permisos).
   * Primero revoca todos, luego asigna los nuevos con regla de cascada.
   *
   * No puede modificar permisos del Administrador raiz (RF-ADM-02-10).
   * No puede asignar permisos reservados del superadmin (HU-ADM-02, HU-ADM-03).
   */
  async reemplazarPermisos(idUsuario: number, nombresPermisos: string[]): Promise<{
    ok: boolean;
    asignados: string[];
    autoConcedidos: string[];
    noEncontrados: string[];
    error?: string;
  }> {
    if (idUsuario === ID_ADMIN_RAIZ) {
      return { ok: false, asignados: [], autoConcedidos: [], noEncontrados: [],
        error: 'No se pueden modificar los permisos del Administrador raiz (RF-ADM-02-10)' };
    }

    // Validar permisos reservados antes de cualquier modificacion
    const reservadosSolicitados = nombresPermisos.filter((p) => PERMISOS_RESERVADOS_ADMIN.has(p));
    if (reservadosSolicitados.length > 0) {
      return {
        ok: false,
        asignados: [],
        autoConcedidos: [],
        noEncontrados: [],
        error: `Permisos reservados exclusivos del Administrador no asignables a empleados: ${reservadosSolicitados.join(', ')}`,
      };
    }

    const idRol = await this.empleadosRepo.obtenerIdRolIndividual(idUsuario);
    if (idRol === null) {
      return { ok: false, asignados: [], autoConcedidos: [], noEncontrados: [],
        error: 'Empleado no encontrado o sin rol individual' };
    }

    // Revocar todos los permisos actuales
    await this.permisosRepo.revocarTodosLosPermisos(idRol);

    // Asignar los nuevos (incluyendo cascada)
    return this.asignarPermisos(idUsuario, nombresPermisos);
  }

  /**
   * Calcula los permisos que quedarian revocados en cascada (RF-ADM-02-07).
   * Se usa para construir el aviso de advertencia antes de revocar.
   */
  calcularCascadaRevocacion(
    permisosAActualesDelEmpleado: string[],
    permisosARevocar: string[],
  ): string[] {
    const revocados = new Set(permisosARevocar);
    const enCascada: string[] = [];

    // Si se revoca un permiso de consulta, los de operacion que dependen de el tambien caen
    for (const [operacion, consulta] of Object.entries(DEPENDENCIAS_PERMISOS)) {
      if (revocados.has(consulta) && permisosAActualesDelEmpleado.includes(operacion)) {
        enCascada.push(operacion);
      }
    }

    return enCascada;
  }
}