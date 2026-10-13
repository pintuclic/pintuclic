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
import { CombosRepository } from '../repositories/combos.repository';
import { ColorBasesRepository } from '../repositories/color-bases.repository';
import { VariantesRepository } from '../repositories/variantes.repository';
import { CategoriasService } from '../services/categorias.service';
import { SubcategoriasService } from '../services/subcategorias.service';
import { MarcasService } from '../services/marcas.service';
import { ColoresService } from '../services/colores.service';
import { ProductosService } from '../services/productos.service';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { CombosService } from '../services/combos.service';
import { ImagenesService } from '../services/imagenes.service';
import { optimizadorSharp } from '../services/optimizador-imagenes';
import { ImagenesRepository } from '../repositories/imagenes.repository';
import { CrearImagenDto } from '../dtos/imagenes.dto';
import { ColorBasesService } from '../services/color-bases.service';
import { DefinirComboDto } from '../dtos/combos.dto';
import { CascadaCampanas } from '../interfaces/m01.interfaces';

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
// PNG válido de 1x1: las versiones optimizadas exigen una imagen real.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

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
    // Puerto de campañas de prueba: registra las marcas recibidas y si llegaron dentro de una transacción.
    const campanasInvocadas: { idMarca: number; enTransaccion: boolean }[] = [];
    const campanasRegistradas: CascadaCampanas = {
      desactivarPorMarca: async (idMarca, trx) => {
        campanasInvocadas.push({ idMarca, enTransaccion: trx.isTransaction });
      },
    };
    const campanasQueFallan: CascadaCampanas = {
      desactivarPorMarca: async () => {
        throw new Error('falla forzada en la cascada de campañas');
      },
    };
    const marcasService = new MarcasService(marcasRepo, lineasRepo, basesRepo, coloresRepo, productosRepo, campanasRegistradas);
    const marcasServiceConFalla = new MarcasService(marcasRepo, lineasRepo, basesRepo, coloresRepo, productosRepo, campanasQueFallan);
    const coloresService = new ColoresService(coloresRepo, marcasRepo);
    const productosService = new ProductosService(productosRepo, marcasRepo, lineasRepo, resinasRepo, subcategoriasRepo, categoriasRepo);
    const publicoService = new CatalogoPublicoService(publicoRepo, optimizadorSharp);
    const imagenesService = new ImagenesService(new ImagenesRepository(db), productosRepo, new VariantesRepository(db), coloresRepo, optimizadorSharp);
    const combosService = new CombosService(new CombosRepository(db), productosRepo, new VariantesRepository(db));
    const colorBasesService = new ColorBasesService(new ColorBasesRepository(db), coloresRepo, basesRepo);

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
      ficha1.imagenes.length === 1 && ficha1.imagenes[0]!.contenido_url === `/api/catalogo/publico/imagenes/${img1.id_imagen}/contenido?tamano=optimizada`,
      'M01-10: la ficha entrega la URL pública de la imagen'
    );
    const contenido = await publicoService.obtenerContenidoImagen(img1.id_imagen, 'original');
    assert(contenido.datos.equals(PNG) && contenido.mime_type === 'image/png', 'M01-10 RF-CAT-07-03: entrega el binario al visitante');

    // --------------------------------------------------------------------------
    // M01 11 — Miniaturas y versiones optimizadas (RNF-CAT-07-01)
    // --------------------------------------------------------------------------
    const esWebp = (b: Buffer) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP';
    const versionesDe = (idImagen: number) =>
      db.selectFrom('imagen').select(['miniatura', 'optimizada']).where('id_imagen', '=', idImagen).executeTakeFirstOrThrow();
    assert((await versionesDe(img1.id_imagen)).miniatura === null, 'M01-11: una imagen cargada antes de v4.0 no tiene versiones');
    const miniatura = await publicoService.obtenerContenidoImagen(img1.id_imagen, 'miniatura');
    const guardadas = await versionesDe(img1.id_imagen);
    assert(
      miniatura.mime_type === 'image/webp' && esWebp(miniatura.datos) && guardadas.miniatura !== null && guardadas.optimizada !== null,
      'M01-11 RNF-CAT-07-01: la primera consulta genera y guarda la miniatura y la versión optimizada en WebP'
    );
    const optimizada = await publicoService.obtenerContenidoImagen(img1.id_imagen, 'optimizada');
    assert(
      optimizada.datos.equals(guardadas.optimizada as Buffer),
      'M01-11: las consultas siguientes sirven la versión guardada sin volver a procesar'
    );
    const resumenConMiniatura = (await publicoService.listarProductos({ busqueda: `${PREFIJO} Esmalte` })).items[0];
    assert(
      resumenConMiniatura?.imagen_principal_url === `/api/catalogo/publico/imagenes/${img1.id_imagen}/contenido?tamano=miniatura`,
      'M01-11 RNF-CAT-07-01: el listado usa la miniatura'
    );
    const subida = await imagenesService.crear(p1.id_producto, CrearImagenDto.parse({ imagen: `data:image/png;base64,${PNG.toString('base64')}` }));
    const versionesSubida = await versionesDe(subida.id_imagen);
    assert(
      versionesSubida.miniatura !== null && esWebp(versionesSubida.miniatura) && versionesSubida.optimizada !== null,
      'M01-11 RNF-CAT-07-01: al cargar una imagen desde el panel se generan y guardan sus versiones'
    );
    await assertLanza(
      () => imagenesService.crear(p1.id_producto, CrearImagenDto.parse({ imagen: `data:image/png;base64,${Buffer.from('falsa').toString('base64')}` })),
      'IMAGEN_INVALIDA',
      'M01-11: rechaza un archivo que dice ser PNG pero no es una imagen'
    );
    await db.deleteFrom('imagen').where('id_imagen', '=', subida.id_imagen).execute();

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
    await assertLanza(() => publicoService.obtenerContenidoImagen(img1.id_imagen, 'miniatura'), 'IMAGEN_NO_DISPONIBLE',
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
    // M01 08 — Combos: existencia controlada, sin sobreventa (HU-CAT-13)
    // --------------------------------------------------------------------------
    const p3 = await productosService.crear({
      nombre: `${PREFIJO} Combo Brochas`, id_marca: marca.id_marca, clase_color: 'sin_color',
      id_subcategorias: [subZ.id_subcategoria],
    });
    creados.productos.push(p3.id_producto);
    const varCombo = await db.insertInto('variante')
      .values({ id_producto: p3.id_producto, id_presentacion: presentacion.id_presentacion, precio_vigente: 30000, existencia_referencial: 2 })
      .returning('id_variante').executeTakeFirstOrThrow();
    const presentacionCuarto = await db.insertInto('presentacion').values({ nombre: `${PREFIJO} Cuarto`, volumen: 0.946 })
      .returning('id_presentacion').executeTakeFirstOrThrow();
    creados.presentaciones.push(presentacionCuarto.id_presentacion);
    const varComboSinUnidades = await db.insertInto('variante')
      .values({ id_producto: p3.id_producto, id_presentacion: presentacionCuarto.id_presentacion, precio_vigente: 45000, existencia_referencial: 0 })
      .returning('id_variante').executeTakeFirstOrThrow();
    const varP2 = await db.selectFrom('variante').select(['id_variante', 'existencia_referencial'])
      .where('id_producto', '=', p2.id_producto).executeTakeFirstOrThrow();
    await db.insertInto('imagen').values({ id_producto: p3.id_producto, datos: PNG, mime_type: 'image/png' }).execute();
    const existenciaDe = async (idVariante: number) =>
      (await db.selectFrom('variante').select('existencia_referencial').where('id_variante', '=', idVariante).executeTakeFirstOrThrow())
        .existencia_referencial;

    const combo = await combosService.definir(p3.id_producto, DefinirComboDto.parse({ componentes: [{ id_variante: varP2.id_variante, cantidad: 3 }] }));
    const comboLeido = await combosService.obtener(p3.id_producto);
    assert(
      comboLeido.id_combo === combo.id_combo &&
        comboLeido.componentes[0]?.id_variante === varP2.id_variante &&
        comboLeido.componentes[0]?.cantidad === 3,
      'M01-08 RF-CAT-13-01: registra el combo como producto propio con sus componentes'
    );
    await productosService.publicar(p3.id_producto);

    const listadoCombo = await publicoService.listarProductos({ busqueda: `${PREFIJO} Combo` });
    assert(
      listadoCombo.items[0]?.es_combo === true && listadoCombo.items[0]?.agotado === false,
      'M01-08 CA-CAT-13-01: el combo queda a la venta como un producto más, marcado como combo'
    );

    // Complementarios de P2 desde la categoría Z: el combo aparece mientras tenga unidades.
    await productosService.actualizar(p2.id_producto, { id_categoria_complementaria: catZ.id_categoria });
    const compConCombo = await publicoService.complementarios(p2.id_producto);
    assert(compConCombo.some((c) => c.id_producto === p3.id_producto), 'M01-12: un combo con unidades se ofrece como complementario');

    // Una reserva con una línea sin unidades no descuenta ninguna de las demás.
    await assertLanza(
      () => combosService.reservarExistencias([
        { id_variante: varCombo.id_variante, cantidad: 1 },
        { id_variante: varComboSinUnidades.id_variante, cantidad: 1 },
      ]),
      'COMBO_SIN_EXISTENCIA',
      'M01-08 RF-CAT-13-02: rechaza la reserva si una de sus líneas no tiene unidades'
    );
    assert((await existenciaDe(varCombo.id_variante)) === 2, 'M01-08 RF-CAT-13-03: la reserva rechazada no descuenta ninguna línea');

    // Dentro de la transacción de quien llama (M08): si la orden se revierte, la existencia vuelve.
    await db.transaction().execute(async (trx) => {
      await combosService.reservarExistencias([{ id_variante: varCombo.id_variante, cantidad: 1 }], trx);
      throw new Error('orden revertida');
    }).catch(() => undefined);
    assert(
      (await existenciaDe(varCombo.id_variante)) === 2,
      'M01-08 RF-CAT-13-03: la reserva participa de la transacción de la orden y se revierte con ella'
    );

    // CA-CAT-13-05: dos compras simultáneas de las 2 últimas unidades: solo una se completa.
    const simultaneas = await Promise.allSettled([
      combosService.reservarExistencias([{ id_variante: varCombo.id_variante, cantidad: 2 }]),
      combosService.reservarExistencias([{ id_variante: varCombo.id_variante, cantidad: 2 }]),
    ]);
    const completadas = simultaneas.filter((r) => r.status === 'fulfilled').length;
    const rechazo = simultaneas.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    assert(
      completadas === 1 &&
        (rechazo?.reason as { code?: string } | undefined)?.code === 'COMBO_SIN_EXISTENCIA' &&
        (await existenciaDe(varCombo.id_variante)) === 0,
      'M01-08 CA-CAT-13-05: de dos compras simultáneas de las últimas unidades solo una se completa y la existencia no queda negativa'
    );

    const fichaAgotada = await publicoService.obtenerFicha(p3.id_producto);
    assert(fichaAgotada.es_combo && fichaAgotada.agotado, 'M01-08 CA-CAT-13-06: con existencia en cero el visitante ve el combo agotado');
    const compSinCombo = await publicoService.complementarios(p2.id_producto);
    assert(
      !compSinCombo.some((c) => c.id_producto === p3.id_producto),
      'M01-12 RF-CAT-13-04: un combo agotado se excluye de los complementarios'
    );

    await combosService.reservarExistencias([{ id_variante: varP2.id_variante, cantidad: 999 }]);
    assert(
      (await existenciaDe(varP2.id_variante)) === varP2.existencia_referencial,
      'M01-08: una variante que no es de combo se vende sin control de existencia y no se descuenta'
    );

    await combosService.liberarExistencias([{ id_variante: varCombo.id_variante, cantidad: 1 }]);
    const fichaRepuesta = await publicoService.obtenerFicha(p3.id_producto);
    assert(
      (await existenciaDe(varCombo.id_variante)) === 1 && !fichaRepuesta.agotado,
      'M01-08 CA-CAT-13-07: al cancelar la orden la unidad vuelve y el combo deja de estar agotado'
    );

    // --------------------------------------------------------------------------
    // M01 08 — Exclusión de descuentos y un único combo por producto
    // --------------------------------------------------------------------------
    await combosService.definir(p3.id_producto, DefinirComboDto.parse({ excluido_descuentos: true }));
    const filasCombo = await db.selectFrom('combo').select(['id_combo', 'excluido_descuentos'])
      .where('id_producto', '=', p3.id_producto).execute();
    assert(
      filasCombo.length === 1 && filasCombo[0]?.id_combo === combo.id_combo && filasCombo[0]?.excluido_descuentos === true,
      'M01-08 RF-CAT-13-01: redefinir el combo actualiza el mismo registro y lo marca excluido de descuentos'
    );
    assert(await combosService.excluidoDeDescuentos(p3.id_producto), 'M01-08 CA-CAT-13-09: M06/M08 consultan que el combo se cobra sin rebaja');

    // --------------------------------------------------------------------------
    // M01 12 — Complementarios heredados de la categoría (RF-CAT-08-01)
    // --------------------------------------------------------------------------
    await productosService.actualizar(p2.id_producto, { id_categoria_complementaria: null });
    await categoriasService.actualizar(catA.id_categoria, { id_categoria_complementaria: catZ.id_categoria });
    const compHeredados = await publicoService.complementarios(p2.id_producto);
    assert(
      compHeredados.some((c) => c.id_producto === p3.id_producto),
      'M01-12 RF-CAT-08-01: sin configuración propia, P2 hereda los complementarios de su categoría A (categoría Z)'
    );

    // --------------------------------------------------------------------------
    // M01 13 — Carta entonable por combinaciones color↔base (HU-CAT-12)
    // --------------------------------------------------------------------------
    const baseOscura = await db.insertInto('base').values({ id_marca: marca.id_marca, nombre: `${PREFIJO} Base Oscura` })
      .returning('id_base').executeTakeFirstOrThrow();
    creados.bases.push(baseOscura.id_base);
    const nuevoColor = async (nombre: string, l: number) => {
      const fila = await db.insertInto('color')
        .values({ id_marca: marca.id_marca, nombre: `${PREFIJO} ${nombre}`, cie_l: l, cie_a: 0, cie_b: 0 })
        .returning('id_color').executeTakeFirstOrThrow();
      creados.colores.push(fila.id_color);
      return fila.id_color;
    };
    const colorClaro = await nuevoColor('Marfil', 90);
    const colorOscuro = await nuevoColor('Grafito', 20);
    const colorSinBase = await nuevoColor('Sin Base', 50);

    const p4 = await productosService.crear({
      nombre: `${PREFIJO} Vinilo Entonable`, id_marca: marca.id_marca, id_linea: linea.id_linea,
      id_tipo_resina: resina.id_tipo_resina, clase_color: 'entonable', id_subcategorias: [subZ.id_subcategoria],
    });
    creados.productos.push(p4.id_producto);
    await db.insertInto('producto_base').values([
      { id_producto: p4.id_producto, id_base: base.id_base },
      { id_producto: p4.id_producto, id_base: baseOscura.id_base },
    ]).execute();
    const varPastel = await db.insertInto('variante')
      .values({ id_producto: p4.id_producto, id_presentacion: presentacion.id_presentacion, id_base: base.id_base, precio_vigente: 60000 })
      .returning('id_variante').executeTakeFirstOrThrow();
    await db.insertInto('variante')
      .values({ id_producto: p4.id_producto, id_presentacion: presentacion.id_presentacion, id_base: baseOscura.id_base, precio_vigente: 62000 })
      .execute();
    await db.insertInto('imagen').values({ id_producto: p4.id_producto, datos: PNG, mime_type: 'image/png' }).execute();
    await productosService.publicar(p4.id_producto);

    const otraMarca = await db.insertInto('marca')
      .values({ nombre: `${PREFIJO} Otra Marca`, logotipo: PNG, logotipo_mime_type: 'image/png' })
      .returning('id_marca').executeTakeFirstOrThrow();
    creados.marcas.push(otraMarca.id_marca);
    const otraMarcaBase = await db.insertInto('base').values({ id_marca: otraMarca.id_marca, nombre: `${PREFIJO} Base Ajena` })
      .returning('id_base').executeTakeFirstOrThrow();
    creados.bases.push(otraMarcaBase.id_base);

    await colorBasesService.asignar(colorClaro, base.id_base);
    await colorBasesService.asignar(colorOscuro, baseOscura.id_base);
    await assertLanza(
      () => colorBasesService.asignar(colorClaro, otraMarcaBase.id_base),
      'BASE_DE_OTRA_MARCA',
      'M01-13 RF-CAT-12-03: rechaza asociar un color a una base de otra marca'
    );

    const idsCarta = async () => (await publicoService.obtenerColoresPaginados(p4.id_producto, {})).items.map((c) => c.id_color);
    const carta = await idsCarta();
    assert(
      carta.includes(colorClaro) && carta.includes(colorOscuro) && !carta.includes(colorSinBase),
      'M01-13 RF-CAT-12-04/06: la carta solo ofrece colores con una base declarada y vendible en el producto'
    );
    const resumenP4 = (await publicoService.listarProductos({ busqueda: `${PREFIJO} Vinilo` })).items[0];
    assert(resumenP4?.cantidad_colores === 2, 'M01-13 RF-CAT-06-03: el listado cuenta los mismos colores que ofrece la carta');

    const entonado = await publicoService.resolverEntonado(p4.id_producto, colorClaro, presentacion.id_presentacion);
    assert(
      entonado.id_variante === varPastel.id_variante && entonado.id_base === base.id_base && entonado.precio_vigente === 60000,
      'M01-13 RF-CAT-12-05 / CA-CAT-12-04: al elegir un color se determina la variante de base que se consume'
    );
    await assertLanza(
      () => publicoService.resolverEntonado(p4.id_producto, colorSinBase, presentacion.id_presentacion),
      'COLOR_NO_DISPONIBLE',
      'M01-13 RF-CAT-12-04: no admite una combinación color↔base no declarada'
    );

    await db.updateTable('base').set({ estado: 'inactivo' }).where('id_base', '=', baseOscura.id_base).execute();
    const cartaSinOscura = await idsCarta();
    const listadoP4 = await publicoService.listarProductos({ busqueda: `${PREFIJO} Vinilo` });
    assert(
      !cartaSinOscura.includes(colorOscuro) && cartaSinOscura.includes(colorClaro) && listadoP4.total === 1,
      'M01-13 CA-CAT-12-05/06: al desactivar una base sus colores salen de la carta y el resto del producto sigue a la venta'
    );
    await assertLanza(
      () => publicoService.resolverEntonado(p4.id_producto, colorOscuro, presentacion.id_presentacion),
      'COLOR_NO_DISPONIBLE',
      'M01-13 RF-CAT-12-06: no se resuelve un color cuya base está desactivada'
    );

    // --------------------------------------------------------------------------
    // M01 07 — Cascada de marca en una única transacción
    // --------------------------------------------------------------------------
    // Falla forzada en el último paso (campañas), después de todas las escrituras del catálogo.
    let fallo = false;
    try {
      await marcasServiceConFalla.desactivar(marca.id_marca);
    } catch {
      fallo = true;
    }
    const productoTrasFallo = await db.selectFrom('producto').select('estado').where('id_producto', '=', p2.id_producto).executeTakeFirstOrThrow();
    const marcaTrasFallo = await db.selectFrom('marca').select('estado').where('id_marca', '=', marca.id_marca).executeTakeFirstOrThrow();
    const lineaTrasFallo = await db.selectFrom('linea').select('estado').where('id_linea', '=', linea.id_linea).executeTakeFirstOrThrow();
    const baseTrasFallo = await db.selectFrom('base').select('estado').where('id_base', '=', base.id_base).executeTakeFirstOrThrow();
    assert(
      fallo &&
        [marcaTrasFallo, lineaTrasFallo, baseTrasFallo, productoTrasFallo].every((e) => e.estado === 'activo'),
      'M01-07 RF-CAT-04-03: si la cascada de campañas falla, la transacción revierte marca, línea, base y productos'
    );

    await marcasService.desactivar(marca.id_marca);
    const estados = await Promise.all([
      db.selectFrom('marca').select('estado').where('id_marca', '=', marca.id_marca).executeTakeFirstOrThrow(),
      db.selectFrom('linea').select('estado').where('id_linea', '=', linea.id_linea).executeTakeFirstOrThrow(),
      db.selectFrom('base').select('estado').where('id_base', '=', base.id_base).executeTakeFirstOrThrow(),
      db.selectFrom('producto').select('estado').where('id_producto', '=', p2.id_producto).executeTakeFirstOrThrow(),
    ]);
    assert(estados.every((e) => e.estado === 'inactivo'), 'M01-07: la cascada completa desactiva marca, línea, base y productos');
    assert(
      campanasInvocadas.length === 1 &&
        campanasInvocadas[0]?.idMarca === marca.id_marca &&
        campanasInvocadas[0]?.enTransaccion === true,
      'M01-07 RF-CAT-04-03: la cascada de campañas se ejecuta una vez y dentro de la misma transacción'
    );
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
