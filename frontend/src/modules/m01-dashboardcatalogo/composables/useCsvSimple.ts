/**
 * ==============================================================================
 * M01 - PARSER CSV MÍNIMO (carga masiva de colores)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useCsvSimple.ts
 *
 * Soporta separador coma, comillas dobles para escapar comas/comillas
 * internas, y toma la primera fila como encabezados. Suficiente para el CSV
 * plano de carga masiva; no cubre todo el estándar RFC 4180 (saltos de línea
 * dentro de un campo, por ejemplo).
 * ==============================================================================
 */
function parsearLinea(linea: string): string[] {
  const campos: string[] = [];
  let actual = '';
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    if (entreComillas) {
      if (char === '"' && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else if (char === '"') {
        entreComillas = false;
      } else {
        actual += char;
      }
    } else if (char === '"') {
      entreComillas = true;
    } else if (char === ',') {
      campos.push(actual.trim());
      actual = '';
    } else {
      actual += char;
    }
  }
  campos.push(actual.trim());
  return campos;
}

/** Parsea un CSV con encabezados en la primera fila a objetos `{columna: valor}`. */
export function parsearCsv(contenido: string): Record<string, string>[] {
  const lineas = contenido
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length < 2) return [];

  const encabezados = parsearLinea(lineas[0]);
  return lineas.slice(1).map((linea) => {
    const valores = parsearLinea(linea);
    const fila: Record<string, string> = {};
    encabezados.forEach((col, i) => {
      fila[col] = valores[i] ?? '';
    });
    return fila;
  });
}
