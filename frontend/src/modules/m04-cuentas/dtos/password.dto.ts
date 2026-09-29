/**
 * ==============================================================================
 * M04 - DTO DE CONTRASEÑA (RE-EXPORTADOR LOCAL)
 * Ubicación: src/modules/m04-cuentas/dtos/password.dto.ts
 * Re-exporta los esquemas globales de seguridad de core/dtos/seguridad.dto.ts
 * garantizando cero duplicación y compatibilidad hacia atrás.
 * ==============================================================================
 */

export {
  contrasenaSchema,
  contrasenaConConfirmacionSchema,
  validarContrasena,
  validarContrasenaConConfirmacion,
  type ContrasenaDTO,
  type ContrasenaConConfirmacionDTO,
} from '@/core/dtos/seguridad.dto';
