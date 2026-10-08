import { sql } from 'kysely';
import { db } from '../../../core/db/connection';
import { CategoriasRepository } from '../repositories/categorias.repository';
import { SubcategoriasRepository } from '../repositories/subcategorias.repository';
import { MarcasRepository } from '../repositories/marcas.repository';
import { LineasRepository } from '../repositories/lineas.repository';
import { BasesRepository } from '../repositories/bases.repository';
import { ColoresRepository } from '../repositories/colores.repository';
import { TipoResinasRepository } from '../repositories/resinas.repository';
import { ProductosRepository } from '../repositories/productos.repository';
import { CatalogoPublicoRepository } from '../repositories/catalogo-publico.repository';
import { CategoriasService } from '../services/categorias.service';
import { SubcategoriasService } from '../services/subcategorias.service';
import { MarcasService } from '../services/marcas.service';
import { ColoresService } from '../services/colores.service';
import { ProductosService } from '../services/productos.service';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';

// ==============================================================================
// M01 - PRUEBAS DE INTEGRACIÓN CONTRA POSTGRESQL (con escritura)
// Ejecuta las consultas reales de los repositorios de M01 para validar las
// correcciones del informe de faltantes (v3.35.11): elegibilidad pública,
// imágenes públicas, impacto por producto_subcategoria, cascadas y orden.
//
// ⚠️ ESCRIBE DATOS: solo se ejecuta si el nombre de la base contiene "prueba"
// (ej: pintuclic_pruebas_m01 creada con bd/sql/schema_pintuclic.sql). Crea sus
// propios registros con el prefijo "IT-M01" y los borra al terminar.
// Ejecutar: DATABASE_URL=postgres://.../pintuclic_pruebas_m01 \
//           npx tsx src/modules/m01-catalogo/__tests__/m01.integracion.test.ts
// ==============================================================================

const PREFIJO = 'IT-M01';
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

interface Creados {
  marcas: number[];
  categorias: number[];
  subcategorias: number[];
  lineas: number[];
  resinas: number[];
  presentaciones: number[];
  bases: number[];
  colores: number[];
  productos: number[];
}

async function ejecutarPruebasIntegracionM01(): Promise<void> {
  console.log('🚀 Iniciando pruebas de integración de M01 contra PostgreSQL...\n');

  let superadas = 0;
  let fallidas = 0;

  function assert(condicion: boolean, descripcion: string): void {
    if (condicion) {
      console.log(`  ✅ [PASS] ${descripcion}`);
      superadas++;
    } else {
      console.error(`  ❌ [FAIL] ${descripcion}`);
      fallidas++;
    }
  }

  async function assertLanza(fn: () => Promise<unknown>, codigo: string, descripcion: string): Promise<void> {
    try {
      await fn();
      assert(false, descripcion);
    } catch (error) {
      const recibido = (error as { code?: string }).code;
      assert(recibido === codigo, `${descripcion} (${recibido ?? 'sin código'})`);
    }
  }

  const creados: Creados = {
    marcas: [], categorias: [], subcategorias: [], lineas: [], resinas: [],
    presentaciones: [], bases: [], colores: [], productos: [],
  };

  try {
    let nombreBase: string;
    try {
      const fila = await sql<{ nombre: string }>`select current_database() as nombre`.execute(db);
      nombreBase = fila.rows[0]?.nombre ?? '';
    } catch (error) {
      console.error('💥 No se pudo conectar a PostgreSQL:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
      return;
    }
    if (!nombreBase.includes('prueba')) {
      console.error(`💥 La base "${nombreBase}" no es de pruebas. Esta suite escribe datos; usa una base cuyo nombre contenga "prueba".`);
      process.exitCode = 1;
      return;
    }
    console.log(`  Base de datos: ${nombreBase}\n`);

    // --------------------------------------------------------------------------
    // Dependencias reales
    // --------------------------------------------------------------------------
    const categoriasRepo = new CategoriasRepository(db);
    const subcategoriasRepo = new SubcategoriasRepository(db);
    const marcasRepo = new MarcasRepository(db);
    const lineasRepo = new LineasRepository(db);
    const basesRepo = new BasesRepository(db);
    const coloresRepo = new ColoresRepository(db);
    const resinasRepo = new TipoResinasRepository(db);
    const productosRepo = new ProductosRepository(db);
    const publicoRepo = new CatalogoPublicoRepository(db);

    const categoriasService = new CategoriasService(categoriasRepo);
    const subcategoriasService = new SubcategoriasService(subcategoriasRepo, categoriasRepo);
    const marcasService = new MarcasService(marcasRepo, lineasRepo, basesRepo, coloresRepo, productosRepo);
    const coloresService = new ColoresService(coloresRepo, marcasRepo);
    const productosService = new ProductosService(productosRepo, marcasRepo, lineasRepo, resinasRepo, subcategoriasRepo, categoriasRepo);
    const publicoService = new CatalogoPublicoService(publicoRepo);

    // --------------------------------------------------------------------------
    // Datos de prueba
    // --------------------------------------------------------------------------
    const marca = await db.insertInto('marca')
      .values({ nombre: `${PREFIJO} Marca`, logotipo: PNG, logotipo_mime_type: 'image/png' })
      .returning('id_marca').executeTakeFirstOrThrow();
    creados.marcas.push(marca.id_marca);

    // Orden administrado: "Z" con orden 1 debe salir antes que "A" con orden 2.
    const catA = await db.insertInto('categoria').values({ nombre: `${PREFIJO} A Categoria`, orden: 2 })
      .returning('id_categoria').executeTakeFirstOrThrow();
    const catZ = await db.insertInto('categoria').values({ nombre: `${PREFIJO} Z Categoria`, orden: 1 })
      .returning('id_categoria').executeTakeFirstOrThrow();
    creados.categorias.push(catA.id_categoria, catZ.id_categoria);

    const subA = await db.insertInto('subcategorias').values({ id_categoria: catA.id_categoria, nombre: `${PREFIJO} SubA` })
      .returning('id_subcategoria').executeTakeFirstOrThrow();
    const subZ = await db.insertInto('subcategorias').values({ id_categoria: catZ.id_categoria, nombre: `${PREFIJO} SubZ` })
      .returning('id_subcategoria').executeTakeFirstOrThrow();
    creados.subcategorias.push(subA.id_subcategoria, subZ.id_subcategoria);

    const linea = await db.insertInto('linea').values({ id_marca: marca.id_marca, nombre: `${PREFIJO} Linea` })
      .returning('id_linea').executeTakeFirstOrThrow();
    creados.lineas.push(linea.id_linea);
    const resina = await db.insertInto('tipo_resina').values({ nombre: `${PREFIJO} Resina` })
      .returning('id_tipo_resina').executeTakeFirstOrThrow();
    creados.resinas.push(resina.id_tipo_resina);
    const presentacion = await db.insertInto('presentacion').values({ nombre: `${PREFIJO} Galon`, volumen: 3.785 })
      .returning('id_presentacion').executeTakeFirstOrThrow();
    creados.presentaciones.push(presentacion.id_presentacion);
    const base = await db.insertInto('base').values({ id_marca: marca.id_marca, nombre: `${PREFIJO} Base Pastel` })
      .returning('id_base').executeTakeFirstOrThrow();
    creados.bases.push(base.id_base);
    const color = await db.insertInto('color')
      .values({ id_marca: marca.id_marca, nombre: `${PREFIJO} Rojo`, codigo: 'IT-01', cie_l: 40, cie_a: 60, cie_b: 40 })
      .returning('id_color').executeTakeFirstOrThrow();
    creados.colores.push(color.id_color);

    // P1: colores fijos, clasificado en SubA y SubZ. P2: sin color y sin línea, solo en SubA.
    const p1 = await productosService.crear({
      nombre: `${PREFIJO} Esmalte Multi`, id_marca: marca.id_marca, id_linea: linea.id_linea,
      id_tipo_resina: resina.id_tipo_resina, clase_color: 'colores_fijos',
      id_subcategorias: [subA.id_subcategoria, subZ.id_subcategoria],
    });
    const p2 = await productosService.crear({
      nombre: `${PREFIJO} Brocha Sola`, id_marca: marca.id_marca, clase_color: 'sin_color',
      id_subcategorias: [subA.id_subcategoria], id_categoria_complementaria: catA.id_categoria,
    });
    creados.productos.push(p1.id_producto, p2.id_producto);

    const varFija = await db.insertInto('variante')
      .values({ id_producto: p1.id_producto, id_presentacion: presentacion.id_presentacion, id_color: color.id_color, precio_vigente: 50000 })
      .returning('id_variante').executeTakeFirstOrThrow();
    await db.insertInto('variante')
      .values({ id_producto: p2.id_producto, id_presentacion: presentacion.id_presentacion, precio_vigente: 8000 })
      .execute();

    // --------------------------------------------------------------------------
    // M01 01 — Publicación exige imagen
    // --------------------------------------------------------------------------
    await assertLanza(() => productosService.publicar(p1.id_producto), 'PRODUCTO_SIN_IMAGEN',
      'M01-01 RF-CAT-02-05: rechaza publicar con variante activa pero sin imagen');
    const img1 = await db.insertInto('imagen')
      .values({ id_producto: p1.id_producto, datos: PNG, mime_type: 'image/png', es_principal: true })
      .returning('id_imagen').executeTakeFirstOrThrow();
    await db.insertInto('imagen').values({ id_producto: p2.id_producto, datos: PNG, mime_type: 'image/png' }).execute();
    const pub1 = await productosService.publicar(p1.id_producto);
    await productosService.publicar(p2.id_producto);
    assert(pub1.publicado, 'M01-01 RF-CAT-02-05: publica con variante activa e imagen');

    // --------------------------------------------------------------------------
    // M01 09 / 14 — Elegibilidad pública y orden del menú
    // --------------------------------------------------------------------------
    const listado = await publicoService.listarProductos({ busqueda: PREFIJO });
    assert(listado.total === 2, 'M01-09: ambos productos con dependencias activas son públicos');

    const menu = (await publicoService.listarCategorias()).filter((c) => c.nombre.startsWith(PREFIJO));
    assert(
      menu.length === 2 && menu[0]?.id_categoria === catZ.id_categoria && menu[1]?.id_categoria === catA.id_categoria,
      'M01-14 RF-CAT-01-01: el menú público respeta el orden administrado (no el alfabético)'
    );

    // --------------------------------------------------------------------------
    // M01 10 — Imágenes públicas sin autenticación
    // --------------------------------------------------------------------------
    const ficha1 = await publicoService.obtenerFicha(p1.id_producto);
    assert(
      ficha1.imagenes.length === 1 && ficha1.imagenes[0]!.contenido_url === `/api/catalogo/publico/imagenes/${img1.id_imagen}/contenido`,
      'M01-10: la ficha entrega la URL pública de la imagen'
    );
    const contenido = await publicoService.obtenerContenidoImagen(img1.id_imagen);
    assert(contenido.datos.equals(PNG) && contenido.mime_type === 'image/png', 'M01-10 RF-CAT-07-03: entrega el binario al visitante');

    // --------------------------------------------------------------------------
    // M01 02 — Impacto basado en producto_subcategoria
    // --------------------------------------------------------------------------
    const impactoCatA = await categoriasService.solicitarDesactivacion(catA.id_categoria, false);
    assert(
      'productos_afectados' in impactoCatA && impactoCatA.productos_afectados === 1,
      'M01-02 RF-CAT-01-04: desactivar la categoría A solo oculta P2 (P1 conserva SubZ; P2 no tiene línea)'
    );
    const impactoSubA = await subcategoriasService.solicitarDesactivacion(subA.id_subcategoria, false);
    assert(
      'productos_afectados' in impactoSubA && impactoSubA.productos_afectados === 1,
      'M01-02 CA-CAT-01-06: desactivar SubA solo oculta P2'
    );

    // Se desactiva la categoría A de verdad: P1 sigue público bajo Z, P2 sale.
    await categoriasService.solicitarDesactivacion(catA.id_categoria, true);
    const listadoTrasCat = await publicoService.listarProductos({ busqueda: PREFIJO });
    assert(
      listadoTrasCat.total === 1 && listadoTrasCat.items[0]?.id_producto === p1.id_producto,
      'M01-09 CA-CAT-01-06: con la categoría A inactiva, P1 sigue visible y P2 sale del listado'
    );
    await assertLanza(() => publicoService.obtenerFicha(p2.id_producto), 'PRODUCTO_NO_DISPONIBLE',
      'M01-09: el acceso directo a la ficha de P2 se bloquea');
    const subAFiltrado = await publicoService.listarProductos({ idSubcategoria: subA.id_subcategoria });
    assert(subAFiltrado.total === 0, 'M01-09: filtrar por una subcategoría inactiva no devuelve productos');

    // --------------------------------------------------------------------------
    // M01 04 — Reactivación exige clasificación activa
    // --------------------------------------------------------------------------
    await productosService.desactivar(p2.id_producto);
    await assertLanza(() => productosService.reactivar(p2.id_producto), 'PRODUCTO_SIN_CLASIFICACION_ACTIVA',
      'M01-04 RF-CAT-09-04: no reactiva un producto cuya única subcategoría está bajo una categoría inactiva');
    await categoriasService.reactivar(catA.id_categoria);
    await subcategoriasService.reactivar(subA.id_subcategoria);
    const reactivado = await productosService.reactivar(p2.id_producto);
    assert('reactivado' in reactivado, 'M01-04: reactiva cuando recupera una clasificación activa');

    // --------------------------------------------------------------------------
    // M01 09 — Dependencias de variante (presentación) y de producto (línea)
    // --------------------------------------------------------------------------
    await db.updateTable('presentacion').set({ estado: 'inactivo' }).where('id_presentacion', '=', presentacion.id_presentacion).execute();
    const trasPresentacion = await publicoService.listarProductos({ busqueda: PREFIJO });
    assert(trasPresentacion.total === 0, 'M01-09: sin presentación activa no hay variante vendible y el producto sale del catálogo');
    await db.updateTable('presentacion').set({ estado: 'activo' }).where('id_presentacion', '=', presentacion.id_presentacion).execute();

    await db.updateTable('linea').set({ estado: 'inactivo' }).where('id_linea', '=', linea.id_linea).execute();
    const trasLinea = await publicoService.listarProductos({ busqueda: PREFIJO });
    assert(
      trasLinea.total === 1 && trasLinea.items[0]?.id_producto === p2.id_producto,
      'M01-09: con la línea inactiva sale P1 y sigue P2 (que no tiene línea)'
    );
    await assertLanza(() => publicoService.obtenerContenidoImagen(img1.id_imagen), 'IMAGEN_NO_DISPONIBLE',
      'M01-10: la imagen de un producto no elegible ya no es pública');
    await db.updateTable('linea').set({ estado: 'activo' }).where('id_linea', '=', linea.id_linea).execute();

    // --------------------------------------------------------------------------
    // M01 12 — Complementarios solo elegibles
    // --------------------------------------------------------------------------
    await productosService.actualizar(p1.id_producto, { id_categoria_complementaria: catA.id_categoria });
    const comp = await publicoService.complementarios(p1.id_producto);
    assert(
      comp.length === 1 && comp[0]?.id_producto === p2.id_producto,
      'M01-12: los complementarios de P1 incluyen a P2 y excluyen al propio producto'
    );
    await db.updateTable('variante').set({ estado: 'inactivo' }).where('id_producto', '=', p2.id_producto).execute();
    const compSinVariante = await publicoService.complementarios(p1.id_producto);
    assert(compSinVariante.length === 0, 'M01-12: un producto sin variantes activas no se ofrece como complementario');
    await db.updateTable('variante').set({ estado: 'activo' }).where('id_producto', '=', p2.id_producto).execute();

    // --------------------------------------------------------------------------
    // M01 03 — Cascada de color a variantes de colores fijos
    // --------------------------------------------------------------------------
    await coloresService.desactivar(color.id_color);
    const varTrasColor = await db.selectFrom('variante').select('estado').where('id_variante', '=', varFija.id_variante).executeTakeFirstOrThrow();
    assert(varTrasColor.estado === 'inactivo', 'M01-03 RF-CAT-05-05: desactivar el color desactiva su variante de color fijo');
    const fichaTrasColor = await publicoService.listarProductos({ busqueda: `${PREFIJO} Esmalte` });
    assert(fichaTrasColor.total === 0, 'M01-03 / M01-09: P1 queda sin variantes vendibles y sale del catálogo');

    // --------------------------------------------------------------------------
    // M01 07 — Cascada de marca en una única transacción
    // --------------------------------------------------------------------------
    // Falla forzada en la última escritura (producto): nada debe quedar a medias.
    await sql`
      create or replace function it_m01_falla_producto() returns trigger as $$
      begin raise exception 'falla forzada IT-M01'; end; $$ language plpgsql
    `.execute(db);
    await sql`
      create trigger it_m01_falla before update on producto
      for each row when (new.id_marca = ${sql.lit(marca.id_marca)}) execute function it_m01_falla_producto()
    `.execute(db);
    let fallo = false;
    try {
      await marcasService.desactivar(marca.id_marca);
    } catch {
      fallo = true;
    } finally {
      await sql`drop trigger if exists it_m01_falla on producto`.execute(db);
      await sql`drop function if exists it_m01_falla_producto()`.execute(db);
    }
    const marcaTrasFallo = await db.selectFrom('marca').select('estado').where('id_marca', '=', marca.id_marca).executeTakeFirstOrThrow();
    const lineaTrasFallo = await db.selectFrom('linea').select('estado').where('id_linea', '=', linea.id_linea).executeTakeFirstOrThrow();
    const baseTrasFallo = await db.selectFrom('base').select('estado').where('id_base', '=', base.id_base).executeTakeFirstOrThrow();
    assert(
      fallo && marcaTrasFallo.estado === 'activo' && lineaTrasFallo.estado === 'activo' && baseTrasFallo.estado === 'activo',
      'M01-07 RF-CAT-04-03: si una escritura de la cascada falla, la transacción revierte marca, líneas y bases'
    );

    await marcasService.desactivar(marca.id_marca);
    const estados = await Promise.all([
      db.selectFrom('marca').select('estado').where('id_marca', '=', marca.id_marca).executeTakeFirstOrThrow(),
      db.selectFrom('linea').select('estado').where('id_linea', '=', linea.id_linea).executeTakeFirstOrThrow(),
      db.selectFrom('base').select('estado').where('id_base', '=', base.id_base).executeTakeFirstOrThrow(),
      db.selectFrom('producto').select('estado').where('id_producto', '=', p2.id_producto).executeTakeFirstOrThrow(),
    ]);
    assert(estados.every((e) => e.estado === 'inactivo'), 'M01-07: la cascada completa desactiva marca, línea, base y productos');
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas:', err);
    process.exitCode = 1;
  } finally {
    await limpiar(creados);
    await db.destroy();
  }

  console.log(`\n======================================================`);
  console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
  console.log(`======================================================\n`);
  if (fallidas > 0) process.exitCode = 1;
}

/** Borra los registros creados por la suite (orden inverso a las llaves foráneas). */
async function limpiar(c: Creados): Promise<void> {
  try {
    if (c.productos.length) {
      await db.deleteFrom('imagen').where('id_producto', 'in', c.productos).execute();
      await db.deleteFrom('variante').where('id_producto', 'in', c.productos).execute();
      await db.deleteFrom('producto_subcategoria').where('id_producto', 'in', c.productos).execute();
      await db.deleteFrom('producto').where('id_producto', 'in', c.productos).execute();
    }
    if (c.colores.length) await db.deleteFrom('color').where('id_color', 'in', c.colores).execute();
    if (c.bases.length) await db.deleteFrom('base').where('id_base', 'in', c.bases).execute();
    if (c.lineas.length) await db.deleteFrom('linea').where('id_linea', 'in', c.lineas).execute();
    if (c.presentaciones.length) await db.deleteFrom('presentacion').where('id_presentacion', 'in', c.presentaciones).execute();
    if (c.resinas.length) await db.deleteFrom('tipo_resina').where('id_tipo_resina', 'in', c.resinas).execute();
    if (c.subcategorias.length) await db.deleteFrom('subcategorias').where('id_subcategoria', 'in', c.subcategorias).execute();
    if (c.categorias.length) await db.deleteFrom('categoria').where('id_categoria', 'in', c.categorias).execute();
    if (c.marcas.length) await db.deleteFrom('marca').where('id_marca', 'in', c.marcas).execute();
  } catch (error) {
    console.error('⚠️  No se pudieron borrar todos los datos de prueba:', error instanceof Error ? error.message : error);
  }
}

void ejecutarPruebasIntegracionM01();
