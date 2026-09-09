/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL PANEL DE CATÁLOGO (DASHBOARD)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/dashboard.interface.ts
 *
 * Tipos de integración end-to-end del tablero administrativo de M01.
 * Alimentan las tarjetas de métricas, los accesos rápidos, la actividad
 * reciente y la distribución por estado del catálogo (HU-CAT-02, HU-CAT-03,
 * HU-CAT-01, HU-CAT-04, HU-CAT-05 y HU-CAT-09).
 *
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */

// ==============================================================================
// 1. FILTRO TEMPORAL DEL TABLERO
//    (El envoltorio estándar ApiResponse<T> vive en ./api.interface.ts)
// ==============================================================================

/**
 * Ventana de comparación del tablero. El backend calcula las variaciones
 * porcentuales contra el periodo inmediatamente anterior de la misma longitud.
 */
export type PeriodoDashboard = 'hoy' | '7d' | '30d' | '90d' | 'anio';

export interface FiltroDashboardParams {
  periodo: PeriodoDashboard;
}

// ==============================================================================
// 3. MÉTRICAS PRINCIPALES (TARJETAS KPI)
// ==============================================================================

/**
 * Identificador estable de cada tarjeta de métrica. El frontend lo usa para
 * resolver el ícono y el enlace; nunca se traduce a texto visible.
 */
export type ClaveMetricaCatalogo =
  | 'productos_activos'
  | 'variantes_activas'
  | 'categorias'
  | 'marcas'
  | 'colores'
  | 'busquedas_sin_resultado';

export type TendenciaMetrica = 'sube' | 'baja' | 'estable';

export interface MetricaCatalogo {
  clave: ClaveMetricaCatalogo;
  /** Texto visible de la tarjeta (ej. "Productos activos"). */
  etiqueta: string;
  /** Valor absoluto ya consolidado por el backend. */
  valor: number;
  /** Variación contra el periodo anterior, en puntos porcentuales (ej. 12, -18). */
  variacionPorcentaje: number;
  tendencia: TendenciaMetrica;
  /** Leyenda de comparación (ej. "vs. mes anterior"). */
  periodoComparacion: string;
}

// ==============================================================================
// 4. ACCESOS RÁPIDOS
// ==============================================================================

/**
 * Rol visual del acceso rápido. Determina el color del botón y del ícono
 * usando exclusivamente tokens del design system (action, conversion, etc.).
 */
export type RolAccesoRapido = 'accion' | 'conversion' | 'catalogo' | 'reporte';

export interface AccesoRapido {
  clave: string;
  titulo: string;
  descripcion: string;
  textoBoton: string;
  /** Ruta interna del panel a la que navega el acceso. */
  destino: string;
  rol: RolAccesoRapido;
  /**
   * Permiso de M17 exigido para mostrar y habilitar el acceso.
   * El servidor vuelve a validarlo en cada endpoint (Seguridad por Defecto).
   */
  permiso: PermisoCatalogo;
}

// ==============================================================================
// 5. ACTIVIDAD RECIENTE
// ==============================================================================

/**
 * Estado resultante de una acción sobre el catálogo. No existe rol de color
 * "destructivo" en la paleta oficial: "desactivado" y "eliminado" se pintan
 * con neutros (ver components/BadgeEstado.vue).
 */
export type EstadoActividad = 'publicado' | 'actualizado' | 'desactivado' | 'eliminado';

export interface RegistroActividad {
  id: string;
  /** Marca temporal ISO-8601 de la acción. */
  fechaHora: string;
  /** Nombre del empleado o administrador que ejecutó la acción. */
  usuario: string;
  /** Descripción corta de la acción (ej. "Actualizó precio"). */
  accion: string;
  /** Nombre del elemento afectado (producto, variante, categoría, marca, color). */
  elemento: string;
  estado: EstadoActividad;
}

// ==============================================================================
// 6. DISTRIBUCIÓN POR ESTADO DEL CATÁLOGO (HU-CAT-09)
// ==============================================================================

export type ClaveEstadoCatalogo = 'activos' | 'inactivos' | 'borradores' | 'sin_stock';

export interface SegmentoEstadoCatalogo {
  clave: ClaveEstadoCatalogo;
  etiqueta: string;
  cantidad: number;
  /** Participación sobre el total, 0–100. */
  porcentaje: number;
}

export interface EstadoCatalogo {
  totalProductos: number;
  segmentos: SegmentoEstadoCatalogo[];
  /** Mensaje interpretativo que genera el backend (ej. "Tu catálogo se ve saludable"). */
  mensajeSalud: string;
}

// ==============================================================================
// 7. RESUMEN COMPLETO DEL TABLERO
// ==============================================================================

export interface ResumenDashboardCatalogo {
  metricas: MetricaCatalogo[];
  accesosRapidos: AccesoRapido[];
  actividadReciente: RegistroActividad[];
  estadoCatalogo: EstadoCatalogo;
  /** Momento en que el backend consolidó el resumen (ISO-8601). */
  generadoEn: string;
}

// ==============================================================================
// 8. PERMISOS DE M17 RELEVANTES PARA M01
// ==============================================================================

/**
 * RF-CAT-01-05: "Gestión del catálogo" cubre categorías, subcategorías, líneas,
 * marcas, colores, bases, presentaciones y atributos técnicos.
 * "Gestión de productos" cubre productos, variantes, imágenes, combos y
 * productos complementarios. Ambos se validan siempre en el servidor.
 */
export type PermisoCatalogo = 'GESTION_CATALOGO' | 'GESTION_PRODUCTOS';
