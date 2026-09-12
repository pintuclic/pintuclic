import type { ResumenDashboardCatalogo } from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL PANEL DE CATÁLOGO
 * Ubicación: src/modules/m01-dashboardcatalogo/services/dashboard.mock.ts
 *
 * Semilla que refleja 1:1 la maqueta "ADMIN 01 - Dashboard de catálogo".
 * El store la usa como respaldo mientras el backend de M01 no expone
 * `GET /api/catalogo/dashboard/resumen`. En cuanto el endpoint responda,
 * estos datos dejan de utilizarse (store.usandoDatosDemo === false).
 * ==============================================================================
 */
export const RESUMEN_DASHBOARD_DEMO: ResumenDashboardCatalogo = {
  generadoEn: '2025-05-27T10:24:00-05:00',

  // --- Tarjetas KPI (fila superior de la maqueta) ---------------------------
  metricas: [
    {
      clave: 'productos_activos',
      etiqueta: 'Productos activos',
      valor: 248,
      variacionPorcentaje: 12,
      tendencia: 'sube',
      periodoComparacion: 'vs. mes anterior',
    },
    {
      clave: 'variantes_activas',
      etiqueta: 'Variantes activas',
      valor: 1392,
      variacionPorcentaje: 8,
      tendencia: 'sube',
      periodoComparacion: 'vs. mes anterior',
    },
    {
      clave: 'categorias',
      etiqueta: 'Categorías',
      valor: 28,
      variacionPorcentaje: 4,
      tendencia: 'sube',
      periodoComparacion: 'vs. mes anterior',
    },
    {
      clave: 'marcas',
      etiqueta: 'Marcas',
      valor: 12,
      variacionPorcentaje: 9,
      tendencia: 'sube',
      periodoComparacion: 'vs. mes anterior',
    },
    {
      clave: 'colores',
      etiqueta: 'Colores',
      valor: 156,
      variacionPorcentaje: 6,
      tendencia: 'sube',
      periodoComparacion: 'vs. mes anterior',
    },
  ],

  // --- Accesos rápidos -----------------------------------------------------
  accesosRapidos: [
    {
      clave: 'crear_producto',
      titulo: 'Crear producto',
      descripcion: 'Agrega un nuevo producto a tu catálogo.',
      textoBoton: 'Crear producto',
      destino: '/admin/catalogo/productos/nuevo',
      rol: 'accion',
      permiso: 'GESTION_PRODUCTOS',
    },
    {
      clave: 'gestionar_variantes',
      titulo: 'Gestionar variantes',
      descripcion: 'Administra precios, existencias y presentaciones.',
      textoBoton: 'Ir a variantes',
      destino: '/admin/catalogo/variantes',
      rol: 'conversion',
      permiso: 'GESTION_PRODUCTOS',
    },
    {
      clave: 'revisar_categorias',
      titulo: 'Revisar categorías',
      descripcion: 'Organiza y gestiona las categorías del catálogo.',
      textoBoton: 'Ver categorías',
      destino: '/admin/catalogo/categorias',
      rol: 'catalogo',
      permiso: 'GESTION_CATALOGO',
    },
    {
      clave: 'gestionar_colores',
      titulo: 'Gestionar colores',
      descripcion: 'Administra la paleta de colores disponibles.',
      textoBoton: 'Ir a colores',
      destino: '/admin/catalogo/colores',
      rol: 'reporte',
      permiso: 'GESTION_CATALOGO',
    },
    {
      clave: 'ver_busquedas',
      titulo: 'Búsquedas sin resultado',
      descripcion: 'Revisa qué están buscando tus clientes.',
      textoBoton: 'Ver reportes',
      destino: '/admin/catalogo/busquedas-sin-resultado',
      rol: 'accion',
      permiso: 'GESTION_CATALOGO',
    },
  ],

  // --- Actividad reciente ------------------------------------------------------
  actividadReciente: [
    {
      id: 'act-001',
      fechaHora: '2025-05-27T10:24:00-05:00',
      usuario: 'Laura Gómez',
      accion: 'Creó un producto',
      elemento: 'Viniltex Advanced',
      estado: 'publicado',
    },
    {
      id: 'act-002',
      fechaHora: '2025-05-27T09:18:00-05:00',
      usuario: 'Carlos Álvarez',
      accion: 'Actualizó precio',
      elemento: 'Taladro Inalámbrico 20V',
      estado: 'actualizado',
    },
    {
      id: 'act-003',
      fechaHora: '2025-05-26T16:42:00-05:00',
      usuario: 'María Torres',
      accion: 'Creó una variante',
      elemento: 'Rodillo Profesional 9"',
      estado: 'publicado',
    },
    {
      id: 'act-004',
      fechaHora: '2025-05-26T14:11:00-05:00',
      usuario: 'Juan Pérez',
      accion: 'Editó categoría',
      elemento: 'Pinturas Exteriores',
      estado: 'actualizado',
    },
    {
      id: 'act-005',
      fechaHora: '2025-05-25T11:03:00-05:00',
      usuario: 'Laura Gómez',
      accion: 'Desactivó producto',
      elemento: 'Brocha Premium 2"',
      estado: 'desactivado',
    },
    {
      id: 'act-006',
      fechaHora: '2025-05-25T18:20:00-05:00',
      usuario: 'Carlos Álvarez',
      accion: 'Creó una marca',
      elemento: 'PintuClic Pro',
      estado: 'publicado',
    },
    {
      id: 'act-007',
      fechaHora: '2025-05-25T10:15:00-05:00',
      usuario: 'María Torres',
      accion: 'Actualizó color',
      elemento: 'Amarillo Profundo',
      estado: 'actualizado',
    },
    {
      id: 'act-008',
      fechaHora: '2025-05-24T09:32:00-05:00',
      usuario: 'Juan Pérez',
      accion: 'Eliminó variante',
      elemento: 'Cinta de Enmascarar',
      estado: 'eliminado',
    },
  ],

  // --- Estado del catálogo (HU-CAT-09) ---------------------------------------
  estadoCatalogo: {
    totalProductos: 248,
    mensajeSalud:
      'Tu catálogo se ve saludable. La mayoría de tus productos están activos y disponibles para tus clientes.',
    segmentos: [
      { clave: 'activos', etiqueta: 'Activos', cantidad: 196, porcentaje: 79 },
      { clave: 'inactivos', etiqueta: 'Inactivos', cantidad: 37, porcentaje: 15 },
      { clave: 'borradores', etiqueta: 'Borradores', cantidad: 10, porcentaje: 4 },
      { clave: 'sin_stock', etiqueta: 'Sin stock', cantidad: 5, porcentaje: 2 },
    ],
  },
};
