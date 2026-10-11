import { describe, expect, it } from 'vitest';
import { agruparPorBloque, textoPasos } from '../src/portada';

const ficha = (id: string, bloque: number) => ({ leccion: { id, bloque } });

describe('agruparPorBloque', () => {
  it('agrupa por bloque en orden ascendente aunque lleguen desordenados', () => {
    const grupos = agruparPorBloque([ficha('c', 3), ficha('a', 1), ficha('b', 3), ficha('d', 1)]);
    expect(grupos.map((grupo) => grupo.bloque)).toEqual([1, 3]);
  });

  it('conserva el orden de entrada dentro de cada bloque', () => {
    const grupos = agruparPorBloque([ficha('c', 3), ficha('a', 1), ficha('b', 3), ficha('d', 1)]);
    expect(grupos[0].items.map((item) => item.leccion.id)).toEqual(['a', 'd']);
    expect(grupos[1].items.map((item) => item.leccion.id)).toEqual(['c', 'b']);
  });

  it('sin lecciones devuelve una lista vacía', () => {
    expect(agruparPorBloque([])).toEqual([]);
  });
});

describe('textoPasos', () => {
  it('singular y plural', () => {
    expect(textoPasos(1)).toBe('1 paso');
    expect(textoPasos(5)).toBe('5 pasos');
  });
});
