import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'kysely';
import { db, pool } from './connection';

/**
 * Script para sembrar datos de prueba (mocks) en todas las 31 tablas de Pintuclic.
 * Consume `bd/sql/seed_pintuclic.sql` de forma idempotente.
 */
async function seedDatabase(): Promise<void> {
  console.log('🌱 Iniciando siembra de datos de prueba (seed mocks) en PostgreSQL...');
  console.log(`📦 Base de datos: ${process.env.POSTGRES_DB || 'pintuclic'}`);
  console.log(`🔌 Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}\n`);

  // 1. Probar conexión
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Conexión con PostgreSQL establecida.');
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`❌ Error al conectar a PostgreSQL: ${error.message}`);
    process.exit(1);
  }

  // 2. Localizar archivo SQL de seed
  const seedFilePath = path.resolve(__dirname, '../../../../bd/sql/seed_pintuclic.sql');

  if (!fs.existsSync(seedFilePath)) {
    console.error(`❌ No se encontró el archivo de seed en: ${seedFilePath}`);
    process.exit(1);
  }

  console.log(`📄 Leyendo datos de seed desde: ${seedFilePath}`);
  const seedContent = fs.readFileSync(seedFilePath, 'utf-8');

  // 3. Ejecutar el seed
  const startTime = Date.now();
  try {
    console.log('⚙️  Insertando mocks iniciales en las 31 tablas...');
    await pool.query(seedContent);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Seed ejecutado con éxito en ${duration}s.\n`);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`❌ Error al sembrar los datos: ${error.message}`);
    await db.destroy();
    process.exit(1);
  }

  // 4. Reporte de conteo de registros por tabla
  try {
    const tablesQuery = await sql<{ table_name: string }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `.execute(db);

    console.log('📊 Resumen de registros sembrados por tabla:');
    let totalRecords = 0;
    let emptyTables = 0;

    for (const row of tablesQuery.rows) {
      const countResult = await sql<{ count: string }>`
        SELECT COUNT(*) as count FROM ${sql.table(row.table_name)}
      `.execute(db);

      const count = Number(countResult.rows[0]?.count || 0);
      totalRecords += count;

      if (count === 0) {
        emptyTables++;
        console.log(`   ⚠️  ${row.table_name.padEnd(25, ' ')} : ${count} filas`);
      } else {
        console.log(`   ✅ ${row.table_name.padEnd(25, ' ')} : ${count} filas`);
      }
    }

    console.log(`\n📈 Total de registros sembrados: ${totalRecords} en ${tablesQuery.rows.length} tablas.`);

    if (emptyTables === 0) {
      console.log('🎉 ¡Todas las 31 tablas cuentan con al menos un registro de prueba válido!');
    } else {
      console.warn(`⚠️ Atención: Hay ${emptyTables} tablas con 0 registros.`);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.warn(`⚠️ Error al generar el conteo: ${error.message}`);
  } finally {
    await db.destroy();
  }
}

void seedDatabase();
