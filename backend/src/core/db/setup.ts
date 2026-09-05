import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'kysely';
import { db, pool } from './connection';

/**
 * Script de inicialización y despliegue del esquema de base de datos para Pintuclic.
 * Ejecuta el archivo DDL oficial (bd/sql/schema_pintuclic.sql) contra la base de datos configurada,
 * validando la creación de tipos ENUM, tablas e índices.
 */
async function setupDatabase(): Promise<void> {
  console.log('🚀 Iniciando despliegue del esquema de base de datos en PostgreSQL...');
  console.log(`📦 Base de datos destino: ${process.env.POSTGRES_DB || 'pintuclic'}`);
  console.log(`🔌 Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
  console.log(`👤 Usuario: ${process.env.POSTGRES_USER || 'postgres'}\n`);

  // 1. Probar conexión básica
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Conexión con PostgreSQL establecida exitosamente.');
  } catch (err: unknown) {
    const error = err as Error;
    console.error('❌ Error crítico al conectar a PostgreSQL:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Asegúrate de que PostgreSQL esté en ejecución y que las credenciales en .env sean correctas.');
    process.exit(1);
  }

  // 2. Localizar y leer el script SQL oficial
  const sqlFilePath = path.resolve(__dirname, '../../../../bd/sql/schema_pintuclic.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ No se encontró el archivo DDL en: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`📄 Leyendo esquema DDL desde: ${sqlFilePath}`);
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // 3. Ejecutar el DDL
  const startTime = Date.now();
  try {
    console.log('⚙️  Ejecutando DDL completo (ENUMs, tablas, relaciones, comentarios e índices)...');
    await pool.query(sqlContent);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Esquema ejecutado exitosamente en ${duration}s.`);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('❌ Error durante la ejecución del DDL:');
    console.error(`   ${error.message}`);
    await db.destroy();
    process.exit(1);
  }

  // 4. Verificar tablas creadas en information_schema
  try {
    const result = await sql<{ table_name: string }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `.execute(db);

    const tables = result.rows.map((r) => r.table_name);
    console.log(`\n📊 Tablas encontradas en la base de datos (${tables.length}):`);
    tables.forEach((t, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${t}`);
    });

    // Comprobaciones clave
    const hasSesion = tables.includes('sesion');
    const hasAviso = tables.includes('aviso_privacidad');
    const hasConsentimiento = tables.includes('consentimiento_usuario');
    const hasSupresion = tables.includes('solicitud_supresion');

    console.log('\n🔍 Verificación de integridad:');
    console.log(`   ${hasSesion ? '✅' : '❌'} Tabla sesion (M20 - HU-SEG-02)`);
    console.log(`   ${hasAviso ? '✅' : '❌'} Tabla aviso_privacidad (M20 - HU-SEG-05)`);
    console.log(`   ${hasConsentimiento ? '✅' : '❌'} Tabla consentimiento_usuario (M20 - HU-SEG-05)`);
    console.log(`   ${hasSupresion ? '✅' : '❌'} Tabla solicitud_supresion (M20 - HU-SEG-05)`);

    if (tables.length === 31 && hasSesion && hasAviso && hasConsentimiento && hasSupresion) {
      console.log('\n🎉 ¡Esquema v2.3 desplegado al 100% con éxito! Total: 31 tablas operativas.');
    } else {
      console.warn(`\n⚠️ Advertencia: Se esperaban 31 tablas, se detectaron ${tables.length}.`);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.warn(`⚠️ No se pudo listar las tablas para el reporte final: ${error.message}`);
  } finally {
    await db.destroy();
  }
}

// Ejecutar script
void setupDatabase();
