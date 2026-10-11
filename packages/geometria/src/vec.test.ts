import { describe, expect, it } from 'vitest';
import {
  distancia,
  distanciaPuntoRecta,
  escalar,
  normalIzquierda,
  punto,
  puntoMedio,
  unitario,
} from '../src/vec';

describe('vec', () => {
  it('calcula la distancia entre dos puntos', () => {
    expect(distancia(punto(0, 0), punto(3, 4))).toBe(5);
  });

  it('calcula el punto medio', () => {
    expect(puntoMedio(punto(0, 0), punto(4, 2))).toEqual(punto(2, 1));
  });

  it('normaliza un vector', () => {
    expect(unitario(punto(0, 5))).toEqual(punto(0, 1));
  });

  it('rechaza normalizar un vector nulo', () => {
    expect(() => unitario(punto(0, 0))).toThrow('vector nulo');
  });

  it('la normal es perpendicular al vector', () => {
    const v = punto(3, 4);
    expect(escalar(v, normalIzquierda(v))).toBe(0);
  });

  it('mide la distancia de un punto a una recta', () => {
    const recta = { p: punto(-1, 0), q: punto(5, 0) };
    expect(distanciaPuntoRecta(punto(0, 3), recta)).toBe(3);
  });

  it('rechaza una recta definida por dos puntos iguales', () => {
    const recta = { p: punto(1, 1), q: punto(1, 1) };
    expect(() => distanciaPuntoRecta(punto(0, 0), recta)).toThrow('dos puntos iguales');
  });
});