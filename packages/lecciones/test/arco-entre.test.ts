import { describe, expect, it } from 'vitest';
import type { Leccion } from '../src/esquema';
import { ConstruccionImposible, interpretarLeccion } from '../src/interpretar';
import { validarLeccion } from '../src/validar';

function leccionCon(dibujo: unknown): any {
  return {
    id: 'prueba',
    bloque: 1,
    titulo: 'Prueba',
    enunciado: 'Enunciado.',
    ideaClave: 'Idea.',
    datos: {
      O: [50, 70],
      A: [80, 70],
      B: [50, 40],
      P: [50, 100],
      C: [20, 70],
      Q: [100, 70],
    },
    pasos: [{ titulo: 't', texto: 't', porque: 'p', dibujo: [dibujo] }],
    comprobaciones: [{ tipo: 'equidistante', punto: 'A', a: 'B', b: 'P' }],
  };
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function arcoDe(dibujo: unknown) {
  const primitiva = interpretarLeccion(cargar(leccionCon(dibujo))).pasos[0].dibujo[0];
  if (primitiva.tipo !== 'arco') throw new Error('se esperaba un arco');
  return primitiva;
}

describe('arcoEntre', () => {
  it('dibuja el arco corto por defecto', () => {
    const arco = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B' });
    expect(arco.cx).toBeCloseTo(50, 9);
    expect(arco.cy).toBeCloseTo(70, 9);
    expect(arco.radio).toBeCloseTo(30, 9);
    expect(arco.inicio).toBeCloseTo(-Math.PI / 2, 9);
    expect(arco.fin).toBeCloseTo(0, 9);
  });

  it('da el mismo arco corto al invertir los extremos', () => {
    const arco = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'B', hasta: 'A' });
    expect(arco.inicio).toBeCloseTo(-Math.PI / 2, 9);
    expect(arco.fin).toBeCloseTo(0, 9);
  });

  it('dibuja el arco largo si pasa por un punto del lado largo', () => {
    const arco = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B', pasaPor: 'P' });
    expect(arco.fin - arco.inicio).toBeCloseTo((3 * Math.PI) / 2, 9);
  });

  it('exige pasaPor en una media circunferencia', () => {
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C' }))),
    ).toThrow(ConstruccionImposible);
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C' }))),
    ).toThrow(/pasaPor/);
  });

  it('elige el lado de una media circunferencia con pasaPor', () => {
    const porAbajo = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C', pasaPor: 'P' });
    expect(porAbajo.fin - porAbajo.inicio).toBeCloseTo(Math.PI, 9);
    expect(Math.sin((porAbajo.inicio + porAbajo.fin) / 2)).toBeCloseTo(1, 9);

    const porArriba = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C', pasaPor: 'B' });
    expect(porArriba.fin - porArriba.inicio).toBeCloseTo(Math.PI, 9);
    expect(Math.sin((porArriba.inicio + porArriba.fin) / 2)).toBeCloseTo(-1, 9);
  });

  it('rechaza dos extremos a distinta distancia del centro', () => {
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'Q' }))),
    ).toThrow(ConstruccionImposible);
  });

  it('rechaza dos extremos que coinciden', () => {
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'A' }))),
    ).toThrow(ConstruccionImposible);
  });

  it('valida los puntos que nombra, incluido pasaPor', () => {
    const resultado = validarLeccion(
      leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B', pasaPor: 'Z' }),
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores).toEqual(['pasos.0.dibujo.0.pasaPor: El punto «Z» no está definido']);
  });
});
