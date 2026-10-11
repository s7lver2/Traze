import { describe, expect, it } from 'vitest';
import type { Leccion } from '../src/esquema';
import { ejecutarComprobaciones, interpretarLeccion } from '../src/interpretar';
import { procesarLeccion } from '../src/procesar';
import { validarLeccion } from '../src/validar';

const DATOS = {
  A: [20, 100],
  B: [100, 100],
  C: [60, 30],
  D: [60, 60],
  E: [100, 30],
  F: [60, 100],
  G: [60, 90],
};
const RADIOS = { g: { mm: 70 } };

function leccionCon(comprobacion: unknown): any {
  return {
    id: 'prueba',
    bloque: 1,
    titulo: 'Prueba',
    enunciado: 'Enunciado.',
    ideaClave: 'Idea.',
    datos: DATOS,
    radios: RADIOS,
    pasos: [{ titulo: 't', texto: 't', porque: 'p', dibujo: [{ tipo: 'punto', id: 'A' }] }],
    comprobaciones: [comprobacion],
  };
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function resultado(comprobacion: unknown) {
  const leccion = cargar(leccionCon(comprobacion));
  const resuelta = interpretarLeccion(leccion);
  return ejecutarComprobaciones(leccion, resuelta.puntos, resuelta.radios)[0];
}

const CASOS: { nombre: string; correcta: unknown; fallida: unknown }[] = [
  {
    nombre: 'tangente',
    correcta: { tipo: 'tangente', recta: ['A', 'B'], centro: 'C', punto: 'F' },
    fallida: { tipo: 'tangente', recta: ['A', 'B'], centro: 'C', punto: 'A' },
  },
  {
    nombre: 'puntoEnCircunferencia',
    correcta: { tipo: 'puntoEnCircunferencia', punto: 'F', centro: 'C', radio: 'g' },
    fallida: { tipo: 'puntoEnCircunferencia', punto: 'A', centro: 'C', radio: 'g' },
  },
  {
    nombre: 'igualLongitud',
    correcta: { tipo: 'igualLongitud', segmentos: [['A', 'F'], ['F', 'B']] },
    fallida: { tipo: 'igualLongitud', segmentos: [['A', 'F'], ['A', 'B']] },
  },
  {
    nombre: 'proporcion',
    correcta: { tipo: 'proporcion', a: ['A', 'F'], b: ['A', 'B'], c: ['C', 'D'], d: ['C', 'G'] },
    fallida: { tipo: 'proporcion', a: ['A', 'F'], b: ['A', 'B'], c: ['C', 'D'], d: ['C', 'F'] },
  },
  {
    nombre: 'colineales',
    correcta: { tipo: 'colineales', puntos: ['A', 'F', 'B'] },
    fallida: { tipo: 'colineales', puntos: ['A', 'F', 'C'] },
  },
  {
    nombre: 'paralelas',
    correcta: { tipo: 'paralelas', rectas: [['A', 'B'], ['C', 'E']] },
    fallida: { tipo: 'paralelas', rectas: [['A', 'B'], ['C', 'D']] },
  },
  {
    nombre: 'angulo',
    correcta: { tipo: 'angulo', vertice: 'F', a: 'A', b: 'D', grados: 90 },
    fallida: { tipo: 'angulo', vertice: 'F', a: 'A', b: 'D', grados: 60 },
  },
  {
    nombre: 'igualAngulo',
    correcta: { tipo: 'igualAngulo', angulos: [['A', 'F', 'D'], ['B', 'F', 'D']] },
    fallida: { tipo: 'igualAngulo', angulos: [['A', 'F', 'D'], ['A', 'B', 'C']] },
  },
];

describe('comprobaciones nuevas', () => {
  for (const caso of CASOS) {
    it(`${caso.nombre}: acepta una construcción correcta`, () => {
      const r = resultado(caso.correcta);
      expect(r.ok, r.detalle).toBe(true);
      expect(r.descripcion.length).toBeGreaterThan(0);
    });

    it(`${caso.nombre}: rechaza una construcción incorrecta`, () => {
      expect(resultado(caso.fallida).ok).toBe(false);
    });
  }

  it('colineales no da por buena una terna con dos puntos iguales', () => {
    expect(resultado({ tipo: 'colineales', puntos: ['A', 'A', 'B'] }).ok).toBe(false);
  });

  it('proporcion no da por buena una razón con un segmento de longitud cero', () => {
    expect(
      resultado({ tipo: 'proporcion', a: ['A', 'F'], b: ['A', 'A'], c: ['C', 'D'], d: ['C', 'G'] }).ok,
    ).toBe(false);
  });
});

describe('validación de las comprobaciones nuevas', () => {
  it('señala un punto no definido con su posición', () => {
    const r = validarLeccion(leccionCon({ tipo: 'colineales', puntos: ['A', 'F', 'Z'] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores).toEqual(['comprobaciones.0.puntos.2: El punto «Z» no está definido']);
  });

  it('señala un radio no definido', () => {
    const r = validarLeccion(
      leccionCon({ tipo: 'puntoEnCircunferencia', punto: 'F', centro: 'C', radio: 'q' }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores).toEqual(['comprobaciones.0.radio: El radio «q» no está definido']);
  });

  it('procesarLeccion usa los radios y rechaza una lección cuya comprobación falla', () => {
    const buena = leccionCon({ tipo: 'puntoEnCircunferencia', punto: 'F', centro: 'C', radio: 'g' });
    expect(procesarLeccion(buena).ok).toBe(true);

    const mala = leccionCon({ tipo: 'puntoEnCircunferencia', punto: 'A', centro: 'C', radio: 'g' });
    const r = procesarLeccion(mala);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores[0].startsWith('comprobaciones: ')).toBe(true);
  });
});
