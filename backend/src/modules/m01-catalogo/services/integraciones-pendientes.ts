import { ConsultaReglasComerciales, CascadaCampanas } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - IMPLEMENTACIONES DE LOS PUERTOS MIENTRAS M06 Y CAMPAÑAS NO EXISTEN
// Declaran explícitamente la ausencia de integración en lugar de inventar datos:
// el catálogo informa "no integrado" (null) y la cascada de campañas no tiene
// nada que desactivar. Al existir esos módulos se reemplazan en m01.routes.ts.
// ==============================================================================

export const reglasComercialesNoIntegradas: ConsultaReglasComerciales = {
  contarVigentesPorLinea: async () => null,
};

export const campanasNoIntegradas: CascadaCampanas = {
  desactivarPorMarca: async () => undefined,
};
