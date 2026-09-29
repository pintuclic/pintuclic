import { describe, it, expect } from 'vitest';
import { hexACielab, cielabAHex, rgbACielab, cielabARgb, familiaCromatica } from './useColorCielab';
import { cielabSchema } from '../dtos/admin.dto';

/**
 * Valores de referencia del espacio CIELAB (D65, observador 2°):
 *   blanco #FFFFFF → L*≈100, a*≈0,  b*≈0
 *   negro  #000000 → L*≈0,   a*≈0,  b*≈0
 *   gris medio #808080 → L*≈53.6, a*≈0, b*≈0
 *   rojo saturado #FF0000 → L*≈53.24, a*≈80.09, b*≈67.20
 */
describe('hexACielab', () => {
  it('convierte el blanco a L*≈100 neutro', () => {
    const lab = hexACielab('#FFFFFF')!;
    expect(lab.l).toBeCloseTo(100, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it('convierte el negro a L*≈0 neutro', () => {
    const lab = hexACielab('#000000')!;
    expect(lab.l).toBeCloseTo(0, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it('convierte un gris medio a L*≈53.6 sin croma', () => {
    const lab = hexACielab('#808080')!;
    expect(lab.l).toBeCloseTo(53.59, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it('convierte un rojo saturado a los valores de referencia', () => {
    const lab = hexACielab('#FF0000')!;
    expect(lab.l).toBeCloseTo(53.24, 1);
    expect(lab.a).toBeCloseTo(80.09, 1);
    expect(lab.b).toBeCloseTo(67.2, 1);
  });

  it('acepta un HEX de 3 dígitos y devuelve null si el HEX es inválido', () => {
    expect(hexACielab('#FFF')!.l).toBeCloseTo(100, 1);
    expect(hexACielab('no-es-un-hex')).toBeNull();
  });

  it('produce siempre un valor que pasa la validación del backend', () => {
    for (const hex of ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFC928', '#0877E8']) {
      expect(cielabSchema.safeParse(hexACielab(hex)).success).toBe(true);
    }
  });
});

describe('cielabAHex (inversa)', () => {
  it('reconstruye el HEX original en un ida y vuelta', () => {
    for (const hex of ['#FFFFFF', '#000000', '#808080', '#FF0000', '#FFC928', '#0877E8', '#556B2F']) {
      expect(cielabAHex(hexACielab(hex)!)).toBe(hex.toUpperCase());
    }
  });

  it('recorta al gamut los valores fuera de sRGB en lugar de desbordarse', () => {
    const rgb = cielabARgb({ l: 100, a: 128, b: -128 });
    for (const canal of [rgb.r, rgb.g, rgb.b]) {
      expect(canal).toBeGreaterThanOrEqual(0);
      expect(canal).toBeLessThanOrEqual(255);
      expect(Number.isInteger(canal)).toBe(true);
    }
  });
});

describe('rgbACielab / cielabARgb', () => {
  it('hace ida y vuelta sobre componentes RGB', () => {
    const rgb = { r: 8, g: 119, b: 232 };
    expect(cielabARgb(rgbACielab(rgb))).toEqual(rgb);
  });

  it('mantiene L* monótona respecto de la luminosidad', () => {
    const oscuro = rgbACielab({ r: 20, g: 20, b: 20 });
    const medio = rgbACielab({ r: 128, g: 128, b: 128 });
    const claro = rgbACielab({ r: 240, g: 240, b: 240 });
    expect(oscuro.l).toBeLessThan(medio.l);
    expect(medio.l).toBeLessThan(claro.l);
  });
});

describe('familiaCromatica (RF-CAT-05-03)', () => {
  it('clasifica los neutros por luminosidad', () => {
    expect(familiaCromatica(hexACielab('#FFFFFF')!)).toBe('Blancos');
    expect(familiaCromatica(hexACielab('#808080')!)).toBe('Grises');
    expect(familiaCromatica(hexACielab('#000000')!)).toBe('Negros');
  });

  it('clasifica los cromáticos por tono', () => {
    expect(familiaCromatica(hexACielab('#FF0000')!)).toBe('Rojos');
    expect(familiaCromatica(hexACielab('#FF8C00')!)).toBe('Naranjas');
    expect(familiaCromatica(hexACielab('#FFD700')!)).toBe('Amarillos');
    expect(familiaCromatica(hexACielab('#228B22')!)).toBe('Verdes');
    expect(familiaCromatica(hexACielab('#0877E8')!)).toBe('Azules');
    expect(familiaCromatica(hexACielab('#8A2BE2')!)).toBe('Violetas');
    expect(familiaCromatica(hexACielab('#0000FF')!)).toBe('Azules');
    expect(familiaCromatica(hexACielab('#FF00FF')!)).toBe('Violetas');
  });

  it('trata los colores casi acromáticos como neutros', () => {
    expect(familiaCromatica(hexACielab('#F5F5DC')!)).toBe('Blancos');
  });
});
