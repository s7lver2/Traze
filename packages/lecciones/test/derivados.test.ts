import { describe, expect, it } from 'vitest';
import { distancia } from '@traze/geometria';
import type { Leccion } from '../src/esquema';
import { ConstruccionImposible, interpretarLeccion } from '../src/interpretar';
import { validarLeccion } from '../src/validar';

const DATOS = {
  A: [20, 100],
  B: [100, 100],
  C: [60, 30],
  D: [60, 60],
  E: [100, 30],
};
const RADIOS = {
  r: { mm: 30 },
  g: { mm: 80 },
  h: { mm: 50 },
  u: { mm: 40 },
  t: { mm: 70 },
};

function leccionCon(derivados: unknown[]): any {
  return {
    id: 'prueba',
    bloque: 1,
    titulo: 'Prueba',
    enunciado: 'Enunciado.',
    ideaClave: 'Idea.',
    datos: DATOS,
    radios: RADIOS,
    derivados,
    pasos: [{ titulo: 't', texto: 't', porque: 'p', dibujo: [{ tipo: 'punto', id: 'A' }] }],
    comprobaciones: [{ tipo: 'equidistante', punto: 'C', a: 'A', b: 'B' }],
  };
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function puntosDe(derivados: unknown[]) {
  return interpretarLeccion(cargar(leccionCon(derivados))).puntos;
}

function errores(derivados: unknown[]): string[] {
  const resultado = validarLeccion(leccionCon(derivados));
  return resultado.ok ? [] : resultado.errores;
}

describe('puntoEnDireccion', () => {
  it('lleva la abertura sobre la dirección de dos puntos', () => {
    const { X } = puntosDe([
      { tipo: 'puntoEnDireccion', id: 'X', origen: 'A', direccion: ['A', 'B'], radio: 'r' },
    ]);
    expect(X.x).toBeCloseTo(50, 9);
    expect(X.y).toBeCloseTo(100, 9);
  });

  it('traza la perpendicular hacia la izquierda de la dirección (arriba en pantalla)', () => {
    const { X } = puntosDe([
      {
        tipo: 'puntoEnDireccion',
        id: 'X',
        origen: 'A',
        direccion: ['A', 'B'],
        radio: 'r',
        perpendicular: true,
      },
    ]);
    expect(X.x).toBeCloseTo(20, 9);
    expect(X.y).toBeCloseTo(70, 9);
  });

  it('con sentido -1 va hacia atrás', () => {
    const { X } = puntosDe([
      { tipo: 'puntoEnDireccion', id: 'X', origen: 'B', direccion: ['A', 'B'], radio: 'r', sentido: -1 },
    ]);
    expect(X.x).toBeCloseTo(70, 9);
    expect(X.y).toBeCloseTo(100, 9);
  });

  it('sirve para trazar una paralela por otro punto', () => {
    const { X } = puntosDe([
      { tipo: 'puntoEnDireccion', id: 'X', origen: 'C', direccion: ['A', 'B'], radio: 'r' },
    ]);
    expect(X.x).toBeCloseTo(90, 9);
    expect(X.y).toBeCloseTo(30, 9);
  });

  it('rechaza una dirección definida por dos puntos iguales', () => {
    expect(() =>
      puntosDe([{ tipo: 'puntoEnDireccion', id: 'X', origen: 'A', direccion: ['A', 'A'], radio: 'r' }]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('pie, simétrico y homotético', () => {
  it('calcula el pie de la perpendicular', () => {
    const { F } = puntosDe([{ tipo: 'pie', id: 'F', punto: 'C', recta: ['A', 'B'] }]);
    expect(F.x).toBeCloseTo(60, 9);
    expect(F.y).toBeCloseTo(100, 9);
  });

  it('calcula el simétrico respecto de un eje', () => {
    const { S } = puntosDe([{ tipo: 'simetrico', id: 'S', punto: 'C', eje: ['A', 'B'] }]);
    expect(S.x).toBeCloseTo(60, 9);
    expect(S.y).toBeCloseTo(170, 9);
  });

  it('calcula el homotético con una razón dada', () => {
    const { H } = puntosDe([{ tipo: 'homotetico', id: 'H', punto: 'C', centro: 'A', razon: 0.5 }]);
    expect(H.x).toBeCloseTo(40, 9);
    expect(H.y).toBeCloseTo(65, 9);
  });

  it('rechaza la razón 0', () => {
    expect(
      errores([{ tipo: 'homotetico', id: 'H', punto: 'C', centro: 'A', razon: 0 }]),
    ).toContain('derivados.0.razon: la razón no puede ser 0');
  });
});

describe('interseccionRectas', () => {
  it('corta dos rectas', () => {
    const { P } = puntosDe([
      { tipo: 'interseccionRectas', id: 'P', rectas: [['A', 'B'], ['C', 'D']] },
    ]);
    expect(P.x).toBeCloseTo(60, 9);
    expect(P.y).toBeCloseTo(100, 9);
  });

  it('rechaza dos rectas paralelas', () => {
    expect(() =>
      puntosDe([{ tipo: 'interseccionRectas', id: 'P', rectas: [['A', 'B'], ['C', 'E']] }]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('interseccionRectaArco', () => {
  it('devuelve los cortes en el orden en que se recorre la recta', () => {
    const { X, Y } = puntosDe([
      { tipo: 'interseccionRectaArco', ids: ['X', 'Y'], recta: ['A', 'B'], centro: 'C', radio: 'g' },
    ]);
    const mitad = Math.sqrt(80 * 80 - 70 * 70);
    expect(X.x).toBeCloseTo(60 - mitad, 9);
    expect(Y.x).toBeCloseTo(60 + mitad, 9);
    expect(X.y).toBeCloseTo(100, 9);
    expect(distancia(X, { x: 60, y: 30 })).toBeCloseTo(80, 9);
  });

  it('rechaza un arco que no llega a la recta', () => {
    expect(() =>
      puntosDe([
        { tipo: 'interseccionRectaArco', ids: ['X', 'Y'], recta: ['A', 'B'], centro: 'C', radio: 'r' },
      ]),
    ).toThrow(ConstruccionImposible);
  });

  it('rechaza un arco tangente a la recta: un solo punto no sirve', () => {
    expect(() =>
      puntosDe([
        { tipo: 'interseccionRectaArco', ids: ['X', 'Y'], recta: ['A', 'B'], centro: 'C', radio: 't' },
      ]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('cortesCirculos', () => {
  it('con radios iguales sitúa el primer corte arriba y el segundo abajo', () => {
    const { X, Y } = puntosDe([
      { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['h', 'h'] },
    ]);
    expect(X.x).toBeCloseTo(60, 9);
    expect(X.y).toBeCloseTo(70, 9);
    expect(Y.x).toBeCloseTo(60, 9);
    expect(Y.y).toBeCloseTo(130, 9);
  });

  it('admite radios distintos', () => {
    const { X } = puntosDe([
      { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['g', 'h'] },
    ]);
    expect(distancia(X, { x: 20, y: 100 })).toBeCloseTo(80, 9);
    expect(distancia(X, { x: 100, y: 100 })).toBeCloseTo(50, 9);
  });

  it('rechaza dos circunferencias que no se cortan', () => {
    expect(() =>
      puntosDe([
        { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['r', 'r'] },
      ]),
    ).toThrow(ConstruccionImposible);
  });

  it('rechaza dos circunferencias tangentes: un solo punto no sirve', () => {
    expect(() =>
      puntosDe([
        { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['u', 'u'] },
      ]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('validación de los derivados nuevos', () => {
  it('señala un punto no definido con su campo', () => {
    expect(errores([{ tipo: 'pie', id: 'F', punto: 'Z', recta: ['A', 'B'] }])).toEqual([
      'derivados.0.punto: El punto «Z» no está definido',
    ]);
  });

  it('señala un radio no definido', () => {
    expect(
      errores([{ tipo: 'puntoEnDireccion', id: 'X', origen: 'A', direccion: ['A', 'B'], radio: 'q' }]),
    ).toEqual(['derivados.0.radio: El radio «q» no está definido']);
  });

  it('permite encadenar derivados', () => {
    const { Q } = puntosDe([
      { tipo: 'pie', id: 'F', punto: 'C', recta: ['A', 'B'] },
      { tipo: 'simetrico', id: 'Q', punto: 'C', eje: ['A', 'F'] },
    ]);
    expect(Q.x).toBeCloseTo(60, 9);
    expect(Q.y).toBeCloseTo(170, 9);
  });
});
