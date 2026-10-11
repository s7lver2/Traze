import type { PrimitivaResuelta } from '@traze/lecciones';
import { describe, expect, it } from 'vitest';
import {
  geometriaCompas,
  geometriaRegla,
  herramientaActiva,
} from '../src/reproductor/herramientas';
import type { PrimitivaAnimada } from '../src/reproductor/tiempos';

const arco: PrimitivaResuelta = {
  tipo: 'arco',
  cx: 0,
  cy: 0,
  radio: 10,
  inicio: 0,
  fin: Math.PI / 2,
  estilo: 'construccion',
};

const segmento: PrimitivaResuelta = {
  tipo: 'segmento',
  x1: 0,
  y1: 0,
  x2: 20,
  y2: 0,
  estilo: 'resultado',
};

const animada = (
  primitiva: PrimitivaResuelta,
  progreso: number,
  delPasoActual = true,
  clave = '0-0',
): PrimitivaAnimada => ({ clave, primitiva, progreso, delPasoActual });

describe('geometriaCompas', () => {
  it('las dos patas miden lo mismo y la bisagra queda por encima', () => {
    const compas = geometriaCompas({ x: 0, y: 0 }, { x: 10, y: 0 });
    expect(compas).not.toBeNull();
    const { aguja, mina, bisagra } = compas!;
    const pataAguja = Math.hypot(bisagra.x - aguja.x, bisagra.y - aguja.y);
    const pataMina = Math.hypot(bisagra.x - mina.x, bisagra.y - mina.y);
    expect(pataAguja).toBeCloseTo(pataMina, 9);
    expect(bisagra.y).toBeLessThan(0);
    expect(bisagra.x).toBeCloseTo(5, 9);
  });

  it('con la mina directamente encima, la bisagra sigue hacia arriba', () => {
    const compas = geometriaCompas({ x: 0, y: 0 }, { x: 0, y: -10 });
    expect(compas).not.toBeNull();
    expect(compas!.bisagra.y).toBeLessThan(-5 + 1e-9);
  });

  it('el mango queda más arriba que la bisagra', () => {
    const compas = geometriaCompas({ x: 0, y: 0 }, { x: 10, y: 0 })!;
    expect(compas.mango.y).toBeLessThan(compas.bisagra.y);
  });

  it('no dibuja nada con abertura nula', () => {
    expect(geometriaCompas({ x: 3, y: 3 }, { x: 3, y: 3 })).toBeNull();
  });
});

describe('geometriaRegla', () => {
  it('es un rectángulo paralelo al tramo, por encima de él y algo más largo', () => {
    const regla = geometriaRegla({ x1: 0, y1: 0, x2: 20, y2: 0 });
    expect(regla).not.toBeNull();
    const { esquinas } = regla!;
    expect(esquinas).toHaveLength(4);
    const xs = esquinas.map((punto) => punto.x);
    expect(Math.min(...xs)).toBeLessThan(0);
    expect(Math.max(...xs)).toBeGreaterThan(20);
    const ys = esquinas.map((punto) => punto.y);
    expect(Math.max(...ys)).toBeLessThanOrEqual(1e-9);
    expect(Math.min(...ys)).toBeLessThan(-5);
  });

  it('las marcas son cortas y están separadas 5 mm', () => {
    const regla = geometriaRegla({ x1: 0, y1: 0, x2: 20, y2: 0 })!;
    expect(regla.marcas.length).toBeGreaterThan(4);
    const primera = regla.marcas[0];
    const segunda = regla.marcas[1];
    expect(Math.abs(segunda.x1 - primera.x1)).toBeCloseTo(5, 9);
    expect(Math.hypot(primera.x2 - primera.x1, primera.y2 - primera.y1)).toBeLessThan(5);
  });

  it('no dibuja nada con un tramo de longitud nula', () => {
    expect(geometriaRegla({ x1: 1, y1: 1, x2: 1, y2: 1 })).toBeNull();
  });

  it('con un tramo vertical la regla sigue al tramo', () => {
    const regla = geometriaRegla({ x1: 0, y1: 0, x2: 0, y2: 20 })!;
    const ys = regla.esquinas.map((punto) => punto.y);
    expect(Math.min(...ys)).toBeLessThan(0);
    expect(Math.max(...ys)).toBeGreaterThan(20);
  });
});

describe('herramientaActiva', () => {
  it('ninguna si no hay primitivas del paso actual', () => {
    expect(herramientaActiva([])).toBeNull();
    expect(herramientaActiva([animada(arco, 1, false)])).toBeNull();
  });

  it('el compás se apoya en el centro y la mina va por el arco', () => {
    const activa = herramientaActiva([animada(arco, 0.5)]);
    expect(activa).toEqual({
      tipo: 'compas',
      aguja: { x: 0, y: 0 },
      mina: {
        x: 10 * Math.cos(Math.PI / 4),
        y: 10 * Math.sin(Math.PI / 4),
      },
    });
  });

  it('la regla toma el tramo del segmento', () => {
    const activa = herramientaActiva([animada(segmento, 0.3)]);
    expect(activa).toEqual({
      tipo: 'regla',
      tramo: { x1: 0, y1: 0, x2: 20, y2: 0 },
    });
  });

  it('manda la última primitiva trazada del paso y se ignoran los puntos', () => {
    const punto: PrimitivaResuelta = {
      tipo: 'punto',
      id: 'A',
      x: 1,
      y: 1,
      etiqueta: 'A',
      estilo: 'dato',
    };
    const activa = herramientaActiva([
      animada(arco, 1, true, '0-0'),
      animada(segmento, 0.5, true, '0-1'),
      animada(punto, 1, true, '0-2'),
    ]);
    expect(activa?.tipo).toBe('regla');
  });
});
