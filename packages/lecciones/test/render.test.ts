import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { interpretarLeccion, type LeccionResuelta, type PrimitivaResuelta } from '../src/interpretar';
import { comprobarRender } from '../src/render';
import { validarLeccion } from '../src/validar';

function pilotoResuelto(): LeccionResuelta {
  const resultado = validarLeccion(piloto);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return interpretarLeccion(resultado.leccion);
}

function leccionCon(...pasos: PrimitivaResuelta[][]): LeccionResuelta {
  return {
    id: 'prueba',
    titulo: 'Prueba',
    lienzo: { ancho: 210, alto: 140 },
    puntos: {},
    radios: {},
    pasos: pasos.map((dibujo) => ({ titulo: 't', texto: 't', porque: 'p', dibujo })),
  };
}

const punto = (id: string, x: number, y: number): PrimitivaResuelta => ({
  tipo: 'punto',
  id,
  etiqueta: id,
  x,
  y,
  estilo: 'dato',
});

describe('comprobarRender', () => {
  it('no encuentra problemas en la lección piloto', () => {
    expect(comprobarRender(pilotoResuelto())).toEqual([]);
  });

  it('detecta etiquetas que se pisan', () => {
    const problemas = comprobarRender(leccionCon([punto('A', 50, 50), punto('B', 52, 50)]));
    expect(problemas).toEqual([
      { tipo: 'etiquetasSolapadas', mensaje: 'las etiquetas «A» y «B» se solapan' },
    ]);
  });

  it('acepta etiquetas separadas', () => {
    expect(comprobarRender(leccionCon([punto('A', 50, 50), punto('B', 80, 50)]))).toEqual([]);
  });

  it('no solapa un punto consigo mismo cuando se repite en dos pasos', () => {
    expect(comprobarRender(leccionCon([punto('A', 50, 50)], [punto('A', 50, 50)]))).toEqual([]);
  });

  it('detecta un segmento que se sale del lienzo', () => {
    const problemas = comprobarRender(
      leccionCon([{ tipo: 'segmento', x1: 20, y1: 20, x2: 215, y2: 20, estilo: 'dato' }]),
    );
    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe('fueraDelLienzo');
    expect(problemas[0].mensaje).toContain('pasos.0.dibujo.0');
  });

  it('mide el arco por sus extremos y por su punto más alto', () => {
    const arco = (radio: number): PrimitivaResuelta => ({
      tipo: 'arco',
      cx: 100,
      cy: 70,
      radio,
      inicio: -Math.PI / 2 - 0.3,
      fin: -Math.PI / 2 + 0.3,
      estilo: 'construccion',
    });
    expect(comprobarRender(leccionCon([arco(60)]))).toEqual([]);
    expect(comprobarRender(leccionCon([arco(68)]))).toHaveLength(1);
  });

  it('detecta una etiqueta que se sale por la derecha aunque su punto esté dentro', () => {
    expect(comprobarRender(leccionCon([punto('A', 207, 70)]))).toEqual([
      {
        tipo: 'fueraDelLienzo',
        mensaje: 'pasos.0.dibujo.0: la etiqueta «A» se sale del lienzo',
      },
    ]);
  });
});
