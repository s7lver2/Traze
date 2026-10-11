import { describe, expect, it } from 'vitest';
import { ROTULO, cajaDeRotulo } from '../src/rotulos';

describe('cajaDeRotulo', () => {
  it('coloca la caja a la derecha y por encima del punto', () => {
    const caja = cajaDeRotulo(10, 20, 'A');
    expect(caja.x1).toBeCloseTo(10 + ROTULO.dx, 9);
    expect(caja.x2).toBeCloseTo(10 + ROTULO.dx + ROTULO.tamano * ROTULO.anchoCaracter, 9);
    expect(caja.y1).toBeCloseTo(20 + ROTULO.dy - ROTULO.ascenso * ROTULO.tamano, 9);
    expect(caja.y2).toBeCloseTo(20 + ROTULO.dy + ROTULO.descenso * ROTULO.tamano, 9);
  });

  it('ensancha la caja con cada letra de la etiqueta', () => {
    const una = cajaDeRotulo(0, 0, 'A');
    const dos = cajaDeRotulo(0, 0, 'T1');
    expect(dos.x2 - dos.x1).toBeCloseTo(2 * (una.x2 - una.x1), 9);
  });
});
