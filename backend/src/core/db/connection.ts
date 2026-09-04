import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './types';

// Cargar variables de entorno desde .env si existe
dotenv.config();

/**
 * Configuración de conexión a PostgreSQL con valores predeterminados (fallback).
 * Permite ejecutar el backend directamente mientras se configura el archivo .env.
 */
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'pintuclic',
      user: process.env.POSTGRES_USER || 'pintuclic',
      password: process.env.POSTGRES_PASSWORD || 'cambia_esta_clave',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

export const pool = new Pool(poolConfig);

/**
 * Instancia Kysely tipada central del backend.
 * Todos los repositorios deben inyectar o consumir esta instancia.
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});

/**
 * Verifica el estado de la conexión a la base de datos.
 * Útil para healthchecks y arranque del servidor.
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (_error) {
    console.warn('⚠️ No se pudo conectar a la base de datos PostgreSQL con la configuración actual.');
    console.warn('   Verifique las variables en el archivo .env o levante el contenedor Docker.');
    return false;
  }
}
