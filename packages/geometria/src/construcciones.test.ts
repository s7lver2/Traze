import { describe, expect, it } from 'vitest';
import { mediatriz } from '../src/construcciones';
import { distancia, distanciaPuntoRecta, escalar, punto, resta, unitario } from '../src/vec';

function generador(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

describe('mediatriz', () => {
  it('construye M y N en una configuración conocida', () => {
    const resultado = mediatriz(punto(0, 0), punto(2, 0), Math.SQRT1_2);
    expect(resultado).not.toBeNull();
    expect(resultado!.m.x).toBeCloseTo(1, 9);
    expect(resultado!.m.y).toBeCloseTo(-1, 9);
    expect(resultado!.n.x).toBeCloseTo(1, 9);
    expect(resultado!.n.y).toBeCloseTo(1, 9);
    expect(resultado!.medio).toEqual(punto(1, 0));
  });

  it('M y N equidistan de A y B y la recta MN es perpendicular por el punto medio', () => {
    const azar = generador(42);
    for (let i = 0; i < 100; i++) {
      const a = punto(azar() * 200, azar() * 200);
      const b = punto(azar() * 200, azar() * 200);
      if (distancia(a, b) < 5) continue;
      const factor = 0.55 + azar() * 0.45;

      const resultado = mediatriz(a, b, factor);
      expect(resultado).not.toBeNull();
      const { m, n, radio, recta, medio } = resultado!;

      expect(Math.abs(distancia(m, a) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(distancia(m, b) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(distancia(n, a) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(distancia(n, b) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(escalar(unitario(resta(n, m)), unitario(resta(b, a))))).toBeLessThan(1e-6);
      expect(distanciaPuntoRecta(medio, recta)).toBeLessThan(1e-6);
    }
  });

  it('devuelve null si el radio es menor que la mitad del segmento', () => {
    expect(mediatriz(punto(0, 0), punto(10, 0), 0.4)).toBeNull();
  });

  it('devuelve null si el radio es exactamente la mitad (los arcos solo se tocan)', () => {
    expect(mediatriz(punto(0, 0), punto(10, 0), 0.5)).toBeNull();
  });

  it('devuelve null si A y B coinciden', () => {
    expect(mediatriz(punto(3, 3), punto(3, 3), 0.75)).toBeNull();
  });
});