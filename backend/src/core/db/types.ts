import { Generated, ColumnType, Selectable, Insertable, Updateable } from 'kysely';

// ==============================================================================
// TIPOS ENUMERADOS (ENUMs) DE POSTGRESQL (schema_pintuclic.sql)
// ==============================================================================

export type EnumEstadoGeneral = 'activo' | 'inactivo';

export type EnumEstadoUsuario = 'activo' | 'inactivo' | 'bloqueado' | 'pendiente';

export type EnumEstadoProducto = 'activo' | 'inactivo' | 'agotado' | 'descontinuado';

export type EnumEstadoReservacion = 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada';

export type EnumEstadoCarrito = 'activo' | 'abandonado' | 'procesado' | 'cancelado';

export type EnumEstadoPedido = 'pendiente' | 'pagado' | 'en_preparacion' | 'enviado' | 'entregado' | 'cancelado';

export type EnumEstadoPago = 'pendiente' | 'completado' | 'fallido' | 'reembolsado';

export type EnumEstadoFactura = 'emitida' | 'pagada' | 'anulada';

// ==============================================================================
// 1. MÓDULO DE DESCUENTOS, ROLES Y PERMISOS
// ==============================================================================

export interface DescuentoTable {
  id_descuento: Generated<number>;
  tope: ColumnType<string, string | number, string | number>;
  porcentaje_descuento: ColumnType<string, string | number, string | number>;
  estado: Generated<EnumEstadoGeneral>;
}

export interface SubRolEmpresaTable {
  id_sub_rol_empresa: Generated<number>;
  nombre: string;
  id_descuento: number | null;
  estado: Generated<EnumEstadoGeneral>;
}

export interface RolTable {
  id_rol: Generated<number>;
  nombre: string;
  id_sub_rol_empresa: number | null;
  estado: Generated<EnumEstadoGeneral>;
}

export interface PermisosTable {
  id_permiso: Generated<number>;
  nombre: string;
  descripcion: string | null;
  estado: Generated<EnumEstadoGeneral>;
}

export interface AsignacionPermisoTable {
  id_asignacion_permiso: Generated<number>;
  id_rol: number;
  id_permiso: number;
}

// ==============================================================================
// 2. MÓDULO DE USUARIOS Y CONTROL DE ACCESO
// ==============================================================================

export interface UsuarioTable {
  id_usuario: Generated<number>;
  nombre: string;
  telefono: string | null;
  correo: string;
  contrasena: string;
  id_rol: number | null;
  estado: Generated<EnumEstadoUsuario>;
}

export interface UsuarioRolTable {
  id_usuario_rol: Generated<number>;
  id_usuario: number;
  id_rol: number;
}

// ==============================================================================
// 3. MÓDULO DE CATÁLOGO Y JERARQUÍA DE PRODUCTOS
// ==============================================================================

export interface CategoriaTable {
  id_categoria: Generated<number>;
  nombre: string;
}

export interface SubcategoriasTable {
  id_subcategoria: Generated<number>;
  id_categoria: number;
  nombre: string;
}

export interface SubSubcategoriasTable {
  id_sub_subcategoria: Generated<number>;
  id_subcategoria: number;
  nombre: string;
}

export interface LineaTable {
  id_linea: Generated<number>;
  id_sub_subcategoria: number;
  nombre: string;
}

export interface ProductoTable {
  id_producto: Generated<number>;
  id_linea: number;
  nombre: string;
}

export interface ColorTable {
  id_color: Generated<number>;
  nombre: string;
}

export interface TonosTable {
  id_tono: Generated<number>;
  id_color: number;
  precio: ColumnType<string, string | number, string | number>;
}

export interface VarianteTable {
  id_variante: Generated<number>;
  id_producto: number;
  precio: ColumnType<string, string | number, string | number>;
  id_color: number | null;
}

export interface CaracteristicaTable {
  id_caracteristica: Generated<number>;
  id_variante: number;
  nombre: string;
}

export interface ComboTable {
  id_combo: Generated<number>;
  id_producto: number;
}

export interface VarianteComboTable {
  id_variante_combo: Generated<number>;
  id_variante: number;
  id_combo: number;
  cantidad: Generated<number>;
}

// ==============================================================================
// 4. MÓDULO DE CARRITO Y VENTAS
// ==============================================================================

export interface CarritoTable {
  id_carrito: Generated<number>;
  id_usuario: number;
  total: ColumnType<string, string | number, string | number>;
  estado: Generated<EnumEstadoCarrito>;
}

export interface DetalleCarritoTable {
  id_detalle_carrito: Generated<number>;
  id_producto: number;
  precio_unitario: ColumnType<string, string | number, string | number>;
  cantidad: Generated<number>;
  id_carrito: number;
}

export interface PedidoTable {
  id_pedido: Generated<number>;
  id_carrito: number;
  direccion: string;
  sub_total: ColumnType<string, string | number, string | number>;
  descuento: ColumnType<string, string | number, string | number>;
  total: ColumnType<string, string | number, string | number>;
  observaciones: string | null;
  fecha: ColumnType<Date, string | Date | undefined, string | Date>;
  estado: Generated<EnumEstadoPedido>;
}

// ==============================================================================
// 5. MÓDULO DE PAGOS Y FACTURACIÓN
// ==============================================================================

export interface MetodoPagoTable {
  id_metodo_pago: Generated<number>;
  nombre: string;
  descripcion: string | null;
  estado: Generated<EnumEstadoGeneral>;
}

export interface PagosTable {
  id_pago: Generated<number>;
  id_pedido: number;
  id_metodo_pago: number;
  estado: Generated<EnumEstadoPago>;
  monto: ColumnType<string, string | number, string | number>;
}

export interface FacturaTable {
  id_factura: Generated<number>;
  id_pedido: number;
  fecha: ColumnType<Date, string | Date | undefined, string | Date>;
  estado: Generated<EnumEstadoFactura>;
}

// ==============================================================================
// 6. MÓDULO DE SERVICIOS Y RESERVACIONES
// ==============================================================================

export interface ReservacionesTable {
  id_reservacion: Generated<number>;
  id_producto: number;
  id_usuario: number;
  fecha: ColumnType<Date, string | Date | undefined, string | Date>;
  hora: string;
  estado: Generated<EnumEstadoReservacion>;
}

// ==============================================================================
// 7. INTERFAZ CENTRAL DATABASE (Única fuente de la verdad para Kysely)
// ==============================================================================

export interface Database {
  // Descuentos, roles y permisos
  descuento: DescuentoTable;
  sub_rol_empresa: SubRolEmpresaTable;
  rol: RolTable;
  permisos: PermisosTable;
  asignacion_permiso: AsignacionPermisoTable;

  // Cuentas y control de acceso
  usuario: UsuarioTable;
  usuario_rol: UsuarioRolTable;

  // Catálogo multinivel y variantes
  categoria: CategoriaTable;
  subcategorias: SubcategoriasTable;
  sub_subcategorias: SubSubcategoriasTable;
  linea: LineaTable;
  producto: ProductoTable;
  color: ColorTable;
  tonos: TonosTable;
  variante: VarianteTable;
  caracteristica: CaracteristicaTable;
  combo: ComboTable;
  variante_combo: VarianteComboTable;

  // Carrito y ventas
  carrito: CarritoTable;
  detalle_carrito: DetalleCarritoTable;
  pedido: PedidoTable;

  // Pagos y facturación
  metodo_pago: MetodoPagoTable;
  pagos: PagosTable;
  factura: FacturaTable;

  // Servicios y reservaciones
  reservaciones: ReservacionesTable;
}

// ==============================================================================
// 8. TIPOS HELPERS EXPORTADOS PARA ENTIDADES
// ==============================================================================

export type Descuento = Selectable<DescuentoTable>;
export type NewDescuento = Insertable<DescuentoTable>;
export type DescuentoUpdate = Updateable<DescuentoTable>;

export type SubRolEmpresa = Selectable<SubRolEmpresaTable>;
export type NewSubRolEmpresa = Insertable<SubRolEmpresaTable>;
export type SubRolEmpresaUpdate = Updateable<SubRolEmpresaTable>;

export type Rol = Selectable<RolTable>;
export type NewRol = Insertable<RolTable>;
export type RolUpdate = Updateable<RolTable>;

export type Permiso = Selectable<PermisosTable>;
export type NewPermiso = Insertable<PermisosTable>;
export type PermisoUpdate = Updateable<PermisosTable>;

export type AsignacionPermiso = Selectable<AsignacionPermisoTable>;
export type NewAsignacionPermiso = Insertable<AsignacionPermisoTable>;
export type AsignacionPermisoUpdate = Updateable<AsignacionPermisoTable>;

export type Usuario = Selectable<UsuarioTable>;
export type NewUsuario = Insertable<UsuarioTable>;
export type UsuarioUpdate = Updateable<UsuarioTable>;

export type UsuarioRol = Selectable<UsuarioRolTable>;
export type NewUsuarioRol = Insertable<UsuarioRolTable>;
export type UsuarioRolUpdate = Updateable<UsuarioRolTable>;

export type Categoria = Selectable<CategoriaTable>;
export type NewCategoria = Insertable<CategoriaTable>;
export type CategoriaUpdate = Updateable<CategoriaTable>;

export type Subcategoria = Selectable<SubcategoriasTable>;
export type NewSubcategoria = Insertable<SubcategoriasTable>;
export type SubcategoriaUpdate = Updateable<SubcategoriasTable>;

export type SubSubcategoria = Selectable<SubSubcategoriasTable>;
export type NewSubSubcategoria = Insertable<SubSubcategoriasTable>;
export type SubSubcategoriaUpdate = Updateable<SubSubcategoriasTable>;

export type Linea = Selectable<LineaTable>;
export type NewLinea = Insertable<LineaTable>;
export type LineaUpdate = Updateable<LineaTable>;

export type Producto = Selectable<ProductoTable>;
export type NewProducto = Insertable<ProductoTable>;
export type ProductoUpdate = Updateable<ProductoTable>;

export type Color = Selectable<ColorTable>;
export type NewColor = Insertable<ColorTable>;
export type ColorUpdate = Updateable<ColorTable>;

export type Tono = Selectable<TonosTable>;
export type NewTono = Insertable<TonosTable>;
export type TonoUpdate = Updateable<TonosTable>;

export type Variante = Selectable<VarianteTable>;
export type NewVariante = Insertable<VarianteTable>;
export type VarianteUpdate = Updateable<VarianteTable>;

export type Caracteristica = Selectable<CaracteristicaTable>;
export type NewCaracteristica = Insertable<CaracteristicaTable>;
export type CaracteristicaUpdate = Updateable<CaracteristicaTable>;

export type Combo = Selectable<ComboTable>;
export type NewCombo = Insertable<ComboTable>;
export type ComboUpdate = Updateable<ComboTable>;

export type VarianteCombo = Selectable<VarianteComboTable>;
export type NewVarianteCombo = Insertable<VarianteComboTable>;
export type VarianteComboUpdate = Updateable<VarianteComboTable>;

export type Carrito = Selectable<CarritoTable>;
export type NewCarrito = Insertable<CarritoTable>;
export type CarritoUpdate = Updateable<CarritoTable>;

export type DetalleCarrito = Selectable<DetalleCarritoTable>;
export type NewDetalleCarrito = Insertable<DetalleCarritoTable>;
export type DetalleCarritoUpdate = Updateable<DetalleCarritoTable>;

export type Pedido = Selectable<PedidoTable>;
export type NewPedido = Insertable<PedidoTable>;
export type PedidoUpdate = Updateable<PedidoTable>;

export type MetodoPago = Selectable<MetodoPagoTable>;
export type NewMetodoPago = Insertable<MetodoPagoTable>;
export type MetodoPagoUpdate = Updateable<MetodoPagoTable>;

export type Pago = Selectable<PagosTable>;
export type NewPago = Insertable<PagosTable>;
export type PagoUpdate = Updateable<PagosTable>;

export type Factura = Selectable<FacturaTable>;
export type NewFactura = Insertable<FacturaTable>;
export type FacturaUpdate = Updateable<FacturaTable>;

export type Reservacion = Selectable<ReservacionesTable>;
export type NewReservacion = Insertable<ReservacionesTable>;
export type ReservacionUpdate = Updateable<ReservacionesTable>;
