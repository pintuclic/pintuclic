import { describe, it, expect, beforeEach } from 'vitest';
import { useMenuMovil } from './useMenuMovil';

describe('useMenuMovil', () => {
  // El estado es un singleton a nivel de módulo (compartido entre barra lateral
  // y barra superior): hay que resetearlo entre tests para que no se contaminen.
  beforeEach(() => {
    useMenuMovil().cerrar();
  });

  it('empieza cerrado', () => {
    const { abierto } = useMenuMovil();
    expect(abierto.value).toBe(false);
  });

  it('abrir() lo marca como abierto', () => {
    const { abierto, abrir } = useMenuMovil();
    abrir();
    expect(abierto.value).toBe(true);
  });

  it('cerrar() lo marca como cerrado', () => {
    const { abierto, abrir, cerrar } = useMenuMovil();
    abrir();
    cerrar();
    expect(abierto.value).toBe(false);
  });

  it('alternar() invierte el estado cada vez que se llama', () => {
    const { abierto, alternar } = useMenuMovil();
    alternar();
    expect(abierto.value).toBe(true);
    alternar();
    expect(abierto.value).toBe(false);
  });

  it('es un singleton: dos llamadas comparten el mismo estado', () => {
    const barraLateral = useMenuMovil();
    const barraSuperior = useMenuMovil();
    barraSuperior.abrir();
    expect(barraLateral.abierto.value).toBe(true);
  });
});
