import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

// Las pruebas derivan los datos públicos del SQL central; no almacenan fixtures.
export function seedAccounts() {
  const sql = readFileSync(new URL('../../../../../bd/sql/seed_pintuclic.sql', import.meta.url), 'utf8');
  return [...sql.matchAll(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*(\d+),\s*'([^']+)',\s*'([^']+)'\)/g)]
    .map(([, id, nombre, telefono, correo, role, estado, tipo]) => ({ id_usuario: Number(id), nombre, telefono, correo, id_rol: Number(role), estado, tipo }));
}
