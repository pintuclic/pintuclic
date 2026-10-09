import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../../../core/db/connection';
import { CarritoRepository } from '../repositories/carrito.repository';
import { LineaCarritoRepository } from '../repositories/linea-carrito.repository';
import { CarritoService } from '../services/carrito.service';

class DeshacerPrueba extends Error {}

async function ejecutar(): Promise<void> {
  try {
    await db.transaction().execute(async (trx) => {
      const variante = await trx.selectFrom('variante')
        .innerJoin('producto', 'producto.id_producto', 'variante.id_producto')
        .select(['variante.id_variante', 'producto.nombre', 'producto.descripcion', 'producto.id_producto'])
        .where('variante.estado', '=', 'activo').orderBy('variante.id_variante').executeTakeFirstOrThrow();
      const repo = new LineaCarritoRepository(trx);
      const service = new CarritoService(new CarritoRepository(trx), repo);
      const token = randomUUID();
      const cart = await service.agregarItemVisitante(token, { id_variante: variante.id_variante, cantidad: 1 });
      const [linea] = await repo.listarLineasVivas(cart.id_carrito);
      assert.equal(linea?.nombre_producto, variante.nombre);
      assert.equal(linea?.descripcion_producto, variante.descripcion);
      assert.equal(linea?.id_producto, variante.id_producto);
      assert.ok(linea?.presentacion);
      const kit = await trx.selectFrom('variante').select('id_variante').where('id_variante', '=', 4).executeTakeFirst();
      if (kit) {
        await repo.agregarOAcumular(cart.id_carrito, kit.id_variante, 1, 999);
        const lineas = await repo.listarLineasVivas(cart.id_carrito);
        const productoKit = await trx.selectFrom('producto').innerJoin('variante', 'variante.id_producto', 'producto.id_producto')
          .select('producto.nombre').where('variante.id_variante', '=', 4).executeTakeFirstOrThrow();
        assert.equal(lineas.find((l) => l.id_variante === 4)?.nombre_producto, productoKit.nombre);
      }
      const recargado = await service.obtenerOCrearCarritoVisitante(token);
      assert.equal(recargado.lineas[0]?.nombre_producto, variante.nombre);
      console.log('PASS identidad real y metadatos con PostgreSQL; escrituras revertidas');
      throw new DeshacerPrueba();
    });
  } catch (error) {
    if (!(error instanceof DeshacerPrueba)) throw error;
  } finally { await db.destroy(); }
}
void ejecutar().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
