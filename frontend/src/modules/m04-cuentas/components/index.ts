/**
 * Barril de exportación central de componentes de M04 (Cuentas).
 * Organizados por subdominios funcionales según principios SOLID.
 */

// Autenticación
export { default as ModalLogin } from './auth/ModalLogin.vue';

// Elementos comunes
export { default as EncabezadoModal } from './comunes/EncabezadoModal.vue';

// Flujo de Registro (Wizard multi-paso)
export { default as RegistroWizard } from './registro/RegistroWizard.vue';
export { default as PasoDatos } from './registro/PasoDatos.vue';
export { default as PasoVerificacion } from './registro/PasoVerificacion.vue';
export { default as PasoListo } from './registro/PasoListo.vue';

// Flujo de Recuperación de Contraseña (Wizard multi-paso)
export { default as RecuperarPasswordWizard } from './recuperacion/RecuperarPasswordWizard.vue';
export { default as PasoRecuperarCorreo } from './recuperacion/PasoRecuperarCorreo.vue';
export { default as PasoRecuperarOTP } from './recuperacion/PasoRecuperarOTP.vue';
export { default as PasoRecuperarNuevaPass } from './recuperacion/PasoRecuperarNuevaPass.vue';

// Perfil de Usuario y Seguridad
export { default as PerfilSidebarNav } from './perfil/PerfilSidebarNav.vue';
export { default as PerfilDatosForm } from './perfil/PerfilDatosForm.vue';
export { default as ModalConfirmarPassword } from './perfil/ModalConfirmarPassword.vue';

// Empresas
export { default as ModalAscensoEmpresa } from './empresas/ModalAscensoEmpresa.vue';
