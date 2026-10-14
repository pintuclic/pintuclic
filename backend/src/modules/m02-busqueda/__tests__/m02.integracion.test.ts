import { sql } from 'kysely';
import { db } from '../../../core/db/connection';
import { BusquedaRepository } from '../repositories/busqueda.repository';
import { BusquedaService } from '../services/busqueda.service';

// ==============================================================================
// M02 - PRUEBAS DE INTEGRACIÓN CONTRA POSTGRESQL (con escritura)
// Valida el SQL de búsqueda y filtros sobre las reglas de visibilidad de M01:
// solo productos visibles, combos sin marca fuera del filtro por marca
// (CA-CAT-13-10), colores ofrecidos por variantes vendibles o por la carta
// entonable de color_base (RF-BUS-01-05, RF-CAT-12-04) y facetas coherentes.
//
// ⚠️ ESCRIBE DATOS: solo se ejecuta si el nombre de la base contiene "prueba"
// (creada con bd/sql/schema_pintuclic.sql y las extensiones unaccent y pg_trgm).
// Crea sus registros con el prefijo "IT-M02" y los borra al terminar.
// Ejecutar: DATABASE_URL=postgres://.../pintuclic_pruebas_m01 \
//           npx tsx src/modules/m02-busqueda/__tests__/m02.integracion.test.ts
// ==============================================================================

const PREFIJO = 'IT-M02';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

interface Creados {
  marcas: number[];
  categorias: number[];
  lineas: number[];
  resinas: number[];
  presentaciones: number[];
  bases: number[];
  colores: number[];
  productos: number[];
}

async function ejecutarPruebasIntegracionM02(): Promise<void> {
  console.log('🚀 Iniciando pruebas de integración de M02 contra PostgreSQL...\n');

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

  const creados: Creados = { marcas: [], categorias: [], lineas: [], resinas: [], presentaciones: [], bases: [], colores: [], productos: [] };

  try {
    const fila = await sql<{ nombre: string }>`select current_database() as nombre`.execute(db);
    const nombreBase = fila.rows[0]?.nombre ?? '';
    if (!nombreBase.includes('prueba')) {
      console.error(`💥 La base "${nombreBase}" no es de pruebas. Esta suite escribe datos; usa una base cuyo nombre contenga "prueba".`);
      process.exitCode = 1;
      return;
    }
    console.log(`  Base de datos: ${nombreBase}\n`);

    const busqueda = new BusquedaService(new BusquedaRepository(db));
    const ids = async (opciones: Parameters<BusquedaService['buscar']>[0]) =>
      (await busqueda.buscar({ limite: 100, ...opciones })).items.map((p) => p.id_producto);

    // --------------------------------------------------------------------------
    // Datos: una marca, una categoría, una presentación vendible y otra retirada
    // --------------------------------------------------------------------------
    const marca = await db.insertInto('marca').values({ nombre: `${PREFIJO} Marca`, logotipo: PNG, logotipo_mime_type: 'image/png' })
      .returning('id_marca').executeTakeFirstOrThrow();
    creados.marcas.push(marca.id_marca);
    const categoria = await db.insertInto('categoria').values({ nombre: `${PREFIJO} Categoria` })
      .returning('id_categoria').executeTakeFirstOrThrow();
    creados.categorias.push(categoria.id_categoria);
    const sub = await db.insertInto('subcategorias').values({ id_categoria: categoria.id_categoria, nombre: `${PREFIJO} Sub` })
      .returning('id_subcategoria').executeTakeFirstOrThrow();
    const linea = await db.insertInto('linea').values({ id_marca: marca.id_marca, nombre: `${PREFIJO} Linea` })
      .returning('id_linea').executeTakeFirstOrThrow();
    creados.lineas.push(linea.id_linea);
    const resina = await db.insertInto('tipo_resina').values({ nombre: `${PREFIJO} Resina` })
      .returning('id_tipo_resina').executeTakeFirstOrThrow();
    creados.resinas.push(resina.id_tipo_resina);
    const galon = await db.insertInto('presentacion').values({ nombre: `${PREFIJO} Galon`, volumen: 3.785 })
      .returning('id_presentacion').executeTakeFirstOrThrow();
    const retirada = await db.insertInto('presentacion').values({ nombre: `${PREFIJO} Retirada`, volumen: 1, estado: 'inactivo' })
      .returning('id_presentacion').executeTakeFirstOrThrow();
    creados.presentaciones.push(galon.id_presentacion, retirada.id_presentacion);
    const base = await db.insertInto('base')
      .values({ id_marca: marca.id_marca, nombre: `${PREFIJO} Base`, id_tipo_resina: resina.id_tipo_resina })
      .returning('id_base').executeTakeFirstOrThrow();
    creados.bases.push(base.id_base);

    const color = async (nombre: string, hexadecimal: string) => {
      const c = await db.insertInto('color').values({ nombre: `${PREFIJO} ${nombre}`, hexadecimal })
        .returning('id_color').executeTakeFirstOrThrow();
      creados.colores.push(c.id_color);
      return c.id_color;
    };
    const turquesa = await color('Turquesa', '#30B0B0');
    const ocre = await color('Ocre', '#C08030');
    const lavanda = await color('Lavanda', '#A090D0');

    const producto = async (nombre: string, datos: { id_marca: number | null; clase_color: 'entonable' | 'colores_fijos' | 'sin_color'; publicado?: boolean }) => {
      const p = await db.insertInto('producto')
        .values({
          nombre: `${PREFIJO} ${nombre}`,
          id_marca: datos.id_marca,
          clase_color: datos.clase_color,
          publicado: datos.publicado ?? true,
          ...(datos.clase_color === 'sin_color' ? {} : { id_linea: linea.id_linea, id_tipo_resina: resina.id_tipo_resina }),
        })
        .returning('id_producto').executeTakeFirstOrThrow();
      creados.productos.push(p.id_producto);
      await db.insertInto('producto_subcategoria').values({ id_producto: p.id_producto, id_subcategoria: sub.id_subcategoria }).execute();
      await db.insertInto('imagen').values({ id_producto: p.id_producto, datos: PNG, mime_type: 'image/png' }).execute();
      return p.id_producto;
    };
    const variante = (idProducto: number, datos: { precio: number; id_color?: number; id_base?: number; id_presentacion?: number }) =>
      db.insertInto('variante').values({
        id_producto: idProducto,
        id_presentacion: datos.id_presentacion ?? galon.id_presentacion,
        id_color: datos.id_color ?? null,
        id_base: datos.id_base ?? null,
        precio_vigente: datos.precio,
      }).execute();

    // Esmalte de colores fijos: turquesa vendible; ocre solo en una presentación retirada.
    const esmalte = await producto('Esmalte Fijo', { id_marca: marca.id_marca, clase_color: 'colores_fijos' });
    await variante(esmalte, { precio: 50000, id_color: turquesa });
    await variante(esmalte, { precio: 1000, id_color: ocre, id_presentacion: retirada.id_presentacion });

    // Vinilo entonable: lavanda se prepara sobre su base según color_base.
    const vinilo = await producto('Vinilo Tono', { id_marca: marca.id_marca, clase_color: 'entonable' });
    await db.insertInto('producto_base').values({ id_producto: vinilo, id_base: base.id_base }).execute();
    await variante(vinilo, { precio: 80000, id_base: base.id_base });
    await db.insertInto('color_base').values({ id_color: lavanda, id_base: base.id_base }).execute();

    // Combo de varias marcas, sin marca declarada (RF-CAT-13-09).
    const combo = await producto('Kit Multimarca', { id_marca: null, clase_color: 'sin_color' });
    await variante(combo, { precio: 30000 });
    await db.insertInto('combo').values({ id_producto: combo }).execute();

    // Borrador sin publicar: nunca aparece.
    const borrador = await producto('Borrador', { id_marca: marca.id_marca, clase_color: 'sin_color', publicado: false });
    await variante(borrador, { precio: 9000 });

    // --------------------------------------------------------------------------
    // Visibilidad (RF-CAT-09-02) y combo sin marca (RF-CAT-13-09 / CA-CAT-13-10)
    // --------------------------------------------------------------------------
    const todos = await ids({ termino: PREFIJO });
    assert(
      todos.length === 3 && [esmalte, vinilo, combo].every((id) => todos.includes(id)) && !todos.includes(borrador),
      'RF-CAT-09-02: la búsqueda devuelve los productos visibles y no el borrador sin publicar'
    );
    const resultadoCombo = (await busqueda.buscar({ termino: 'Multimarca' })).items.find((p) => p.id_producto === combo);
    assert(resultadoCombo?.id_producto === combo && resultadoCombo.id_marca === null, 'RF-CAT-13-09: el combo sin marca se encuentra por su nombre');
    const porMarca = await ids({ termino: PREFIJO, filtros: { idMarca: [marca.id_marca] } });
    assert(!porMarca.includes(combo) && porMarca.length === 2, 'CA-CAT-13-10: filtrar por una marca no muestra el combo sin marca');
    const porCategoria = await ids({ filtros: { idCategoria: [categoria.id_categoria] } });
    assert(porCategoria.includes(combo), 'RF-CAT-13-09: el combo sin marca se encuentra por su clasificación');
    const facetasTodas = await busqueda.facetas({ termino: PREFIJO });
    assert(
      facetasTodas.marcas.length === 1 && facetasTodas.marcas[0]?.cantidad === 2,
      'CA-CAT-13-10: la faceta de marcas no cuenta el combo sin marca'
    );

    // --------------------------------------------------------------------------
    // Colores: variantes vendibles y carta entonable (RF-BUS-01-05, RF-CAT-12-04)
    // --------------------------------------------------------------------------
    assert(
      (await ids({ filtros: { idColor: [turquesa] } })).join() === String(esmalte),
      'RF-BUS-02-03: filtrar por un color fijo devuelve el producto que lo vende'
    );
    assert(
      (await ids({ filtros: { idColor: [ocre] } })).length === 0,
      'RF-CAT-09-02: un color presente solo en una variante no vendible no hace aparecer el producto'
    );
    assert(
      (await ids({ filtros: { idColor: [lavanda] } })).join() === String(vinilo),
      'RF-BUS-01-05 / RF-CAT-12-04: filtrar por un color entonable devuelve el producto que lo prepara sobre su base'
    );
    assert(
      (await ids({ termino: `${PREFIJO} Lavanda` })).includes(vinilo),
      'RF-BUS-01-05: buscar por el nombre de un color entonable encuentra el producto'
    );
    const facetaColores = facetasTodas.colores.filter((c) => [turquesa, ocre, lavanda].includes(c.id));
    assert(
      facetaColores.length === 2 && facetaColores.every((c) => c.cantidad === 1) && !facetaColores.some((c) => c.id === ocre),
      'RF-BUS-02-02: la faceta de colores cuenta fijos y entonables con el mismo criterio que el filtro'
    );
    assert(
      !facetasTodas.presentaciones.some((p) => p.id === retirada.id_presentacion),
      'RF-BUS-02-02: la faceta de presentaciones no ofrece una presentación inactiva'
    );

    // --------------------------------------------------------------------------
    // Precio «desde» (RF-BUS-03-01 / RF-BUS-02-04)
    // --------------------------------------------------------------------------
    const porPrecio = await ids({ termino: PREFIJO, orden: 'precio_asc' });
    assert(
      porPrecio.join() === [combo, esmalte, vinilo].join(),
      'RF-BUS-03-01: el orden por precio usa el «desde» de las variantes vendibles (la retirada de 1.000 no cuenta)'
    );
    assert(
      (await ids({ termino: PREFIJO, filtros: { precioMax: 5000 } })).length === 0,
      'RF-BUS-02-04: el rango de precio ignora las variantes no vendibles'
    );

    await db.updateTable('marca').set({ estado: 'inactivo' }).where('id_marca', '=', marca.id_marca).execute();
    assert(
      (await ids({ termino: PREFIJO })).join() === String(combo),
      'RF-CAT-09-02: con la marca inactiva solo sigue visible el combo sin marca'
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
      await db.deleteFrom('combo').where('id_producto', 'in', c.productos).execute();
      await db.deleteFrom('producto_base').where('id_producto', 'in', c.productos).execute();
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
    if (c.categorias.length) {
      await db.deleteFrom('subcategorias').where('id_categoria', 'in', c.categorias).execute();
      await db.deleteFrom('categoria').where('id_categoria', 'in', c.categorias).execute();
    }
    if (c.marcas.length) await db.deleteFrom('marca').where('id_marca', 'in', c.marcas).execute();
  } catch (error) {
    console.error('⚠️  No se pudieron borrar todos los datos de prueba:', error instanceof Error ? error.message : error);
  }
}

void ejecutarPruebasIntegracionM02();
