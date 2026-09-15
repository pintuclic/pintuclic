import { describe, it, expect } from 'vitest';
import { hexARgb, validarColorFormulario } from './color-formulario.dto';

describe('hexARgb', () => {
  it('convierte un HEX de 6 dígitos', () => {
    expect(hexARgb('#FFC928')).toEqual({ r: 255, g: 201, b: 40 });
  });

  it('expande un HEX de 3 dígitos', () => {
    expect(hexARgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexARgb('#0F8')).toEqual({ r: 0, g: 255, b: 136 });
  });

  it('ignora espacios y acepta minúsculas', () => {
    expect(hexARgb('  #0877e8  ')).toEqual({ r: 8, g: 119, b: 232 });
  });

  it('devuelve null para un HEX inválido', () => {
    expect(hexARgb('no-es-un-hex')).toBeNull();
    expect(hexARgb('#12')).toBeNull();
    expect(hexARgb('#GGGGGG')).toBeNull();
  });
});

describe('validarColorFormulario', () => {
  const base = {
    nombre: 'Amarillo Profundo',
    familiaClave: 'amarillos',
    hex: '#FFC928',
    basesCompatibles: ['base-agua'],
  };

  it('acepta un formulario válido con solo los campos obligatorios', () => {
    const { valido, errores } = validarColorFormulario(base);
    expect(valido).toBe(true);
    expect(errores).toEqual({});
  });

  it('exige el nombre', () => {
    const { valido, errores } = validarColorFormulario({ ...base, nombre: '' });
    expect(valido).toBe(false);
    expect(errores.nombre).toBeDefined();
  });

  it('exige un HEX con formato válido', () => {
    const { valido, errores } = validarColorFormulario({ ...base, hex: 'azul' });
    expect(valido).toBe(false);
    expect(errores.hex).toBeDefined();
  });

  it('exige al menos una base compatible', () => {
    const { valido, errores } = validarColorFormulario({ ...base, basesCompatibles: [] });
    expect(valido).toBe(false);
    expect(errores.basesCompatibles).toBeDefined();
  });

  it('reporta un solo error por campo aunque el schema falle en varios lugares', () => {
    const { errores } = validarColorFormulario({ ...base, nombre: '', hex: '' });
    expect(Object.keys(errores)).toEqual(expect.arrayContaining(['nombre', 'hex']));
    expect(Object.keys(errores)).toHaveLength(2);
  });
});
