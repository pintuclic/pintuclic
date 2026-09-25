import { reactive } from 'vue';
import type { ModoFormulario } from '../dtos/admin.dto';
import type { Impacto, ResultadoDesactivacion, ValoresFormulario } from '../interfaces';

/**
 * ==============================================================================
 * M01 - ESTADO DE LOS MODALES DE EDICIÓN Y CICLO DE VIDA
 * Ubicación: src/modules/m01-catalogo/composables/useEdicion.ts
 *
 * Alimenta a <ModalFormularioCatalogo> y <ModalDesactivar> desde cualquier
 * vista: la vista solo dice QUÉ se guarda o desactiva (la llamada al servicio).
 * ==============================================================================
 */

interface EstadoFormulario {
  abierto: boolean;
  modo: ModoFormulario;
  titulo: string;
  valores: ValoresFormulario;
  imagenes: Record<string, string | null>;
  guardar: (payload: object) => Promise<unknown>;
}

interface EstadoCicloVida {
  abierto: boolean;
  modo: 'desactivar' | 'reactivar';
  nombre: string;
  ejecutar: () => Promise<unknown>;
  consultarImpacto?: () => Promise<Impacto | ResultadoDesactivacion>;
}

const sinAccion = () => Promise.resolve();

export function useEdicion() {
  const formulario = reactive<EstadoFormulario>({
    abierto: false, modo: 'crear', titulo: '', valores: {}, imagenes: {}, guardar: sinAccion,
  });

  const cicloVida = reactive<EstadoCicloVida>({
    abierto: false, modo: 'desactivar', nombre: '', ejecutar: sinAccion,
  });

  function abrirFormulario(opciones: {
    modo: ModoFormulario;
    titulo: string;
    guardar: (payload: object) => Promise<unknown>;
    valores?: ValoresFormulario;
    imagenes?: Record<string, string | null>;
  }): void {
    Object.assign(formulario, { valores: {}, imagenes: {}, ...opciones, abierto: true });
  }

  function abrirDesactivar(nombre: string, ejecutar: () => Promise<unknown>, consultarImpacto?: EstadoCicloVida['consultarImpacto']): void {
    Object.assign(cicloVida, { abierto: true, modo: 'desactivar', nombre, ejecutar, consultarImpacto });
  }

  function abrirReactivar(nombre: string, ejecutar: () => Promise<unknown>): void {
    Object.assign(cicloVida, { abierto: true, modo: 'reactivar', nombre, ejecutar, consultarImpacto: undefined });
  }

  return { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar };
}
