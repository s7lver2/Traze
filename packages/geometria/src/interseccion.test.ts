import { describe, expect, it } from 'vitest';
import {
  interseccionCircunferencias,
  interseccionRectaCircunferencia,
  interseccionRectas,
} from '../src/interseccion';
import { punto } from '../src/vec';

describe('interseccionCircunferencias', () => {
  it('devuelve los dos cortes, el primero a la izquierda de la dirección A→B', () => {
    const cortes = interseccionCircunferencias(
      { centro: punto(0, 0), radio: Math.SQRT2 },
      { centro: punto(2, 0), radio: Math.SQRT2 },
    );
    expect(cortes).not.toBeNull();
    const [primero, segundo] = cortes!;
    expect(primero.x).toBeCloseTo(1, 9);
    expect(primero.y).toBeCloseTo(-1, 9);
    expect(segundo.x).toBeCloseTo(1, 9);
    expect(segundo.y).toBeCloseTo(1, 9);
  });

  it('devuelve el mismo punto dos veces si son tangentes', () => {
    const cortes = interseccionCircunferencias(
      { centro: punto(0, 0), radio: 1 },
      { centro: punto(2, 0), radio: 1 },
    );
    expect(cortes).not.toBeNull();
    expect(cortes![0].x).toBeCloseTo(1, 9);
    expect(cortes![0].y).toBeCloseTo(0, 9);
    expect(cortes![1].x).toBeCloseTo(1, 9);
    expect(cortes![1].y).toBeCloseTo(0, 9);
  });

  it('devuelve null si están demasiado lejos', () => {
    expect(
      interseccionCircunferencias(
        { centro: punto(0, 0), radio: 1 },
        { centro: punto(10, 0), radio: 1 },
      ),
    ).toBeNull();
  });

  it('devuelve null si son concéntricas', () => {
    expect(
      interseccionCircunferencias(
        { centro: punto(0, 0), radio: 1 },
        { centro: punto(0, 0), radio: 2 },
      ),
    ).toBeNull();
  });

  it('devuelve null si una está dentro de la otra', () => {
    expect(
      interseccionCircunferencias(
        { centro: punto(0, 0), radio: 5 },
        { centro: punto(1, 0), radio: 1 },
      ),
    ).toBeNull();
  });
});

describe('interseccionRectaCircunferencia', () => {
  const circunferencia = { centro: punto(0, 0), radio: 1 };

  it('devuelve dos puntos si la recta es secante', () => {
    const cortes = interseccionRectaCircunferencia({ p: punto(-2, 0), q: punto(2, 0) }, circunferencia);
    expect(cortes).toHaveLength(2);
    expect(cortes[0].x).toBeCloseTo(-1, 9);
    expect(cortes[1].x).toBeCloseTo(1, 9);
  });

  it('devuelve un punto si la recta es tangente', () => {
    const cortes = interseccionRectaCircunferencia({ p: punto(-2, 1), q: punto(2, 1) }, circunferencia);
    expect(cortes).toHaveLength(1);
    expect(cortes[0].x).toBeCloseTo(0, 9);
    expect(cortes[0].y).toBeCloseTo(1, 9);
  });

  it('devuelve una lista vacía si no se cortan', () => {
    expect(interseccionRectaCircunferencia({ p: punto(-2, 2), q: punto(2, 2) }, circunferencia)).toEqual([]);
  });
});

describe('interseccionRectas', () => {
  it('devuelve el punto de corte', () => {
    const corte = interseccionRectas(
      { p: punto(0, 0), q: punto(1, 1) },
      { p: punto(0, 2), q: punto(2, 0) },
    );
    expect(corte).not.toBeNull();
    expect(corte!.x).toBeCloseTo(1, 9);
    expect(corte!.y).toBeCloseTo(1, 9);
  });

  it('devuelve null si son paralelas', () => {
    expect(
      interseccionRectas({ p: punto(0, 0), q: punto(1, 0) }, { p: punto(0, 1), q: punto(1, 1) }),
    ).toBeNull();
  });
});