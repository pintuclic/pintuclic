import { ref, computed } from 'vue';

export interface UsuarioSimulado {
  id: number;
  nombre: string;
  correo: string;
  rol: 'administrador' | 'empleado' | 'cliente' | 'empresa_vip';
  tipo: 'normal' | 'empresa';
  permisos: string[];
  token: string;
}

/**
 * Catálogo de perfiles mock basados exactamente en el seed de la base de datos (bd/sql/seed_pintuclic.sql).
 * Permite ejercitar la interfaz y los guardas de M17 sin requerir el formulario de login de M04.
 */
export const PERFILES_MOCK: Record<string, UsuarioSimulado> = {
  admin: {
    id: 1,
    nombre: 'Admin Pruebas (Superadmin)',
    correo: 'admin@pintuclic.co',
    rol: 'administrador',
    tipo: 'normal',
    permisos: [
      '*', // Superusuario con acceso total
      'seguridad.configurar_sesion',
      'productos.crear',
      'productos.eliminar',
      'ordenes.ver',
      'usuarios.gestionar',
      'permisos.gestionar',
      'seguridad.gestionar_privacidad',
      'empleados.crear',
      'empleados.desactivar',
    ],
    token: 'mock-jwt-token-admin-id-1',
  },
  empleado_parcial: {
    id: 2,
    nombre: 'Empleado Operativo (Acceso Parcial)',
    correo: 'empleado@pintuclic.co',
    rol: 'empleado',
    tipo: 'normal',
    permisos: [
      'productos.crear',
      'ordenes.ver',
    ],
    token: 'mock-jwt-token-empleado-id-2',
  },
  cliente: {
    id: 3,
    nombre: 'Cliente Natural B2C',
    correo: 'cliente@pintuclic.co',
    rol: 'cliente',
    tipo: 'normal',
    permisos: [],
    token: 'mock-jwt-token-cliente-id-3',
  },
  empresa: {
    id: 4,
    nombre: 'Pinturas del Valle S.A.S. (B2B)',
    correo: 'contacto@pinturasvalle.co',
    rol: 'empresa_vip',
    tipo: 'empresa',
    permisos: [
      'ordenes.ver',
    ],
    token: 'mock-jwt-token-empresa-id-4',
  },
};

const STORAGE_KEY = 'pintuclic_simulated_auth';

// Estado global reactivo
const usuarioActivo = ref<UsuarioSimulado | null>(cargarUsuarioInicial());

function cargarUsuarioInicial(): UsuarioSimulado | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UsuarioSimulado;
    }
  } catch {
    // Si falla parseo, ignorar
  }
  // Por defecto en desarrollo arrancamos como Admin para agilidad
  return PERFILES_MOCK.admin;
}

/**
 * Composable central de autenticación y autorización para todo el frontend de Pintuclic.
 */
export function useAuth() {
  const isAuthenticated = computed(() => !!usuarioActivo.value);
  const currentUser = computed(() => usuarioActivo.value);
  const currentRole = computed(() => usuarioActivo.value?.rol || 'anonimo');

  /**
   * Comprueba si el usuario autenticado posee un permiso atómico específico.
   * Regla de negocio: El rol 'administrador' o el permiso '*' concede acceso irrestricto.
   */
  function can(permiso: string): boolean {
    if (!usuarioActivo.value) return false;
    if (usuarioActivo.value.rol === 'administrador') return true;
    if (usuarioActivo.value.permisos.includes('*')) return true;
    return usuarioActivo.value.permisos.includes(permiso);
  }

  /**
   * Comprueba si el usuario tiene un rol específico.
   */
  function hasRole(rol: string): boolean {
    return usuarioActivo.value?.rol === rol;
  }

  /**
   * Alterna la identidad activa a uno de los perfiles mock precargados.
   */
  function simularUsuario(clavePerfil: keyof typeof PERFILES_MOCK | null): void {
    if (!clavePerfil || !PERFILES_MOCK[clavePerfil]) {
      usuarioActivo.value = null;
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const perfil = PERFILES_MOCK[clavePerfil];
    usuarioActivo.value = perfil;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
  }

  /**
   * Cierra la sesión activa.
   */
  function logout(): void {
    usuarioActivo.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    isAuthenticated,
    currentUser,
    currentRole,
    can,
    hasRole,
    simularUsuario,
    logout,
    PERFILES_MOCK,
  };
}
