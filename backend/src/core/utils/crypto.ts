import bcrypt from 'bcrypt';

/**
 * Número de rondas de sal para BCrypt según política M20 - HU-SEG-01.
 * Costo mínimo obligatorio: 12.
 */
const SALT_ROUNDS = 12;

/**
 * Genera el hash criptográfico seguro de una contraseña en texto claro.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto claro con un hash existente de forma segura contra timing attacks.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}
