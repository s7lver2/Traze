import { describe, expect, it } from 'vitest';
import type { PrimitivaResuelta } from '@traze/lecciones';
import {
  aberturaDelPaso,
  derivarBanda,
  instrumentoDelPaso,
  lapizDelPaso,
} from '../src/reproductor/instrumentos';

type Estilo = 'dato' | 'construccion' | 'resultado';

const punto = (estilo: Estilo): PrimitivaResuelta => ({
  tipo: 'punto',
  id: 'M',
  etiqueta: 'M',
  x: 0,
  y: 0,
  estilo,
});
const segmento = (estilo: Estilo): PrimitivaResuelta => ({
  tipo: 'segmento',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 0,
  estilo,
});
const recta = (estilo: Estilo): PrimitivaResuelta => ({
  tipo: 'recta',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  estilo,
});
const arco = (radio: number, estilo: Estilo = 'construccion'): PrimitivaResuelta => ({
  tipo: 'arco',
  cx: 0,
  cy: 0,
  radio,
  inicio: 0,
  fin: 1,
  estilo,
});
const marcaRecto: PrimitivaResuelta = {
  tipo: 'marcaAnguloRecto',
  x: 0,
  y: 0,
  ux1: 1,
  uy1: 0,
  ux2: 0,
  uy2: 1,
};
const marcaIgualdad: PrimitivaResuelta = {
  tipo: 'marcaIgualdad',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 0,
};

const RADIOS = { r: { entre: ['A', 'B'] as const, factor: 0.75 } };
const RESUELTOS = { r: 53.5 };
const FACTORES = { r: 0.75 };

describe('instrumentoDelPaso', () => {
  it('los arcos se hacen con compás', () => {
    expect(instrumentoDelPaso([arco(53.5), arco(53.5)])).toBe('Compás');
  });

  it('las rectas y los segmentos se hacen con regla', () => {
    expect(instrumentoDelPaso([segmento('dato'), punto('dato')])).toBe('Regla');
    expect(instrumentoDelPaso([recta('resultado')])).toBe('Regla');
  });

  it('si hay arcos y rectas, gana el compás', () => {
    expect(instrumentoDelPaso([recta('resultado'), arco(10)])).toBe('Compás');
  });

  it('con solo puntos, marcas o nada, no hay instrumento', () => {
    expect(instrumentoDelPaso([punto('construccion')])).toBeUndefined();
    expect(instrumentoDelPaso([marcaRecto, marcaIgualdad])).toBeUndefined();
    expect(instrumentoDelPaso([])).toBeUndefined();
  });
});

describe('lapizDelPaso', () => {
  it('todo construcción se dibuja con 2H', () => {
    expect(lapizDelPaso([arco(10), punto('construccion')])).toBe('2H');
  });

  it('resultado y dato se dibujan con HB', () => {
    expect(lapizDelPaso([recta('resultado')])).toBe('HB');
    expect(lapizDelPaso([segmento('dato'), punto('dato')])).toBe('HB');
  });

  it('si se mezcla construcción con otro trazo, HB', () => {
    expect(lapizDelPaso([arco(10), segmento('dato')])).toBe('HB');
  });

  it('las marcas no tienen estilo: sin otros trazos no se deduce nada', () => {
    expect(lapizDelPaso([marcaRecto])).toBeUndefined();
    expect(lapizDelPaso([])).toBeUndefined();
  });
});

describe('aberturaDelPaso', () => {
  it('muestra el factor y los puntos del radio que usa un arco', () => {
    expect(aberturaDelPaso([arco(53.5)], RESUELTOS, RADIOS, FACTORES)).toBe('0,75 × AB');
  });

  it('usa el factor actual del deslizador', () => {
    expect(aberturaDelPaso([arco(53.5)], RESUELTOS, RADIOS, { r: 0.5 })).toBe('0,50 × AB');
  });

  it('si no se pasa el factor actual, usa el declarado', () => {
    expect(aberturaDelPaso([arco(53.5)], RESUELTOS, RADIOS, {})).toBe('0,75 × AB');
  });

  it('un paso sin arcos, o con un arco de otro radio, no tiene abertura', () => {
    expect(aberturaDelPaso([recta('resultado')], RESUELTOS, RADIOS, FACTORES)).toBeUndefined();
    expect(aberturaDelPaso([arco(99)], RESUELTOS, RADIOS, FACTORES)).toBeUndefined();
  });

  it('una lección sin radios declarados nunca tiene abertura', () => {
    expect(aberturaDelPaso([arco(53.5)], {}, {}, {})).toBeUndefined();
  });

  it('un radio fijo se muestra en milímetros', () => {
    const radios = { f: { mm: 30 } };
    expect(aberturaDelPaso([arco(30)], { f: 30 }, radios, {})).toBe('30 mm');
    expect(aberturaDelPaso([arco(12.5)], { f: 12.5 }, radios, {})).toBe('12,5 mm');
  });

  it('mezcla radios relativos y fijos en el orden en que se declaran', () => {
    const radios = { ...RADIOS, f: { mm: 30 } };
    expect(aberturaDelPaso([arco(53.5), arco(30)], { r: 53.5, f: 30 }, radios, { r: 0.75 })).toBe(
      '0,75 × AB, 30 mm',
    );
  });

  it('solo cuenta los radios que el paso usa', () => {
    const radios = { ...RADIOS, s: { entre: ['C', 'D'] as const, factor: 0.4 } };
    const resueltos = { r: 53.5, s: 20 };
    expect(aberturaDelPaso([arco(20)], resueltos, radios, { r: 0.75, s: 0.4 })).toBe('0,40 × CD');
    expect(aberturaDelPaso([arco(53.5), arco(20)], resueltos, radios, { r: 0.75, s: 0.4 })).toBe(
      '0,75 × AB, 0,40 × CD',
    );
  });
});

describe('derivarBanda', () => {
  it('un paso de compás tiene los tres campos', () => {
    expect(derivarBanda([arco(53.5)], RESUELTOS, RADIOS, FACTORES)).toEqual({
      instrumento: 'Compás',
      lapiz: '2H',
      abertura: '0,75 × AB',
    });
  });

  it('omite los campos que no se pueden deducir', () => {
    expect(derivarBanda([punto('construccion')], RESUELTOS, RADIOS, FACTORES)).toEqual({
      lapiz: '2H',
    });
  });

  it('si no se deduce nada, no hay banda', () => {
    expect(derivarBanda([marcaRecto, marcaIgualdad], RESUELTOS, RADIOS, FACTORES)).toBeNull();
    expect(derivarBanda([], RESUELTOS, RADIOS, FACTORES)).toBeNull();
  });
});
