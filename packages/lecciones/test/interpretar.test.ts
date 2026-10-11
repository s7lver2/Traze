import { describe, expect, it } from 'vitest';
import { distancia } from '@traze/geometria';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import {
  ConstruccionImposible,
  ejecutarComprobaciones,
  interpretarLeccion,
} from '../src/interpretar';
import { procesarLeccion } from '../src/procesar';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

describe('interpretarLeccion', () => {
  it('calcula los puntos derivados M, N y O', () => {
    const { puntos } = interpretarLeccion(cargar(piloto));
    expect(puntos.O.x).toBeCloseTo(100, 9);
    expect(puntos.O.y).toBeCloseTo(65, 9);

    const radio = 0.75 * distancia(puntos.A, puntos.B);
    for (const nombre of ['M', 'N']) {
      expect(distancia(puntos[nombre], puntos.A)).toBeCloseTo(radio, 9);
      expect(distancia(puntos[nombre], puntos.B)).toBeCloseTo(radio, 9);
    }
  });

  it('resuelve el arco centrado en la dirección de su punto de destino', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const arco = resuelta.pasos[1].dibujo[0];
    if (arco.tipo !== 'arco') throw new Error('se esperaba un arco');

    expect(arco.fin - arco.inicio).toBeCloseTo(0.64, 9);
    const medio = (arco.inicio + arco.fin) / 2;
    expect(arco.cx + arco.radio * Math.cos(medio)).toBeCloseTo(resuelta.puntos.M.x, 6);
    expect(arco.cy + arco.radio * Math.sin(medio)).toBeCloseTo(resuelta.puntos.M.y, 6);
  });

  it('prolonga la recta por la extensión indicada en cada extremo', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const recta = resuelta.pasos[4].dibujo[0];
    if (recta.tipo !== 'recta') throw new Error('se esperaba una recta');

    const largo = Math.hypot(recta.x2 - recta.x1, recta.y2 - recta.y1);
    const { M, N } = resuelta.puntos;
    expect(largo).toBeCloseTo(distancia(M, N) + 16, 6);
  });

  it('conserva etiquetas y estilos, con sus valores por defecto', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const [segmento, puntoA] = resuelta.pasos[0].dibujo;
    expect(segmento).toMatchObject({ tipo: 'segmento', estilo: 'dato' });
    expect(puntoA).toMatchObject({ tipo: 'punto', id: 'A', etiqueta: 'A', x: 60, y: 70 });
  });

  it('normaliza las direcciones de la marca de ángulo recto', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const marca = resuelta.pasos[5].dibujo[1];
    if (marca.tipo !== 'marcaAnguloRecto') throw new Error('se esperaba una marca de ángulo recto');

    expect(marca.x).toBeCloseTo(100, 9);
    expect(Math.hypot(marca.ux1, marca.uy1)).toBeCloseTo(1, 9);
    expect(Math.hypot(marca.ux2, marca.uy2)).toBeCloseTo(1, 9);
    expect(marca.ux1 * marca.ux2 + marca.uy1 * marca.uy2).toBeCloseTo(0, 9);
  });

  it('aplica un factor de radio distinto al de la lección', () => {
    const resuelta = interpretarLeccion(cargar(piloto), { r: 0.6 });
    const arco = resuelta.pasos[1].dibujo[0];
    if (arco.tipo !== 'arco') throw new Error('se esperaba un arco');

    expect(arco.radio).toBeCloseTo(0.6 * distancia(resuelta.puntos.A, resuelta.puntos.B), 9);
    expect(distancia(resuelta.puntos.M, resuelta.puntos.A)).toBeCloseTo(arco.radio, 9);
  });

  it('lanza ConstruccionImposible si los arcos no se cortan', () => {
    const leccion = cargar(piloto);
    expect(() => interpretarLeccion(leccion, { r: 0.4 })).toThrow(ConstruccionImposible);
    expect(() => interpretarLeccion(leccion, { r: 0.4 })).toThrow('no se cortan');
  });

  it('lanza ConstruccionImposible si un arco no pasa por su punto de destino', () => {
    const datos = copia();
    datos.pasos[1].dibujo[0].hacia = 'B';
    expect(() => interpretarLeccion(cargar(datos))).toThrow(ConstruccionImposible);
    expect(() => interpretarLeccion(cargar(datos))).toThrow('no pasa por');
  });
});

describe('ejecutarComprobaciones', () => {
  it('cumple las cuatro comprobaciones de la lección piloto', () => {
    const leccion = cargar(piloto);
    const { puntos } = interpretarLeccion(leccion);
    const resultados = ejecutarComprobaciones(leccion, puntos);

    expect(resultados.map((r) => r.descripcion)).toEqual([
      'M equidista de A y B',
      'N equidista de A y B',
      'MN ⟂ AB',
      'MN pasa por el punto medio de AB',
    ]);
    expect(resultados.every((r) => r.ok)).toBe(true);
  });

  it('detecta una comprobación que no se cumple', () => {
    const datos = copia();
    datos.comprobaciones = [{ tipo: 'equidistante', punto: 'A', a: 'A', b: 'B' }];
    const leccion = cargar(datos);
    const { puntos } = interpretarLeccion(leccion);

    const [resultado] = ejecutarComprobaciones(leccion, puntos);
    expect(resultado.ok).toBe(false);
  });

  it('no da por buena una recta definida por dos puntos iguales', () => {
    const datos = copia();
    datos.comprobaciones = [{ tipo: 'perpendicular', recta: ['A', 'A'], segmento: ['A', 'B'] }];
    const leccion = cargar(datos);
    const { puntos } = interpretarLeccion(leccion);

    const [resultado] = ejecutarComprobaciones(leccion, puntos);
    expect(resultado.ok).toBe(false);
    expect(resultado.detalle).toBe('hay dos puntos coincidentes');
  });
});

describe('procesarLeccion', () => {
  it('procesa la lección piloto', () => {
    const resultado = procesarLeccion(piloto);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resuelta.pasos).toHaveLength(6);
    expect(resultado.comprobaciones).toHaveLength(4);
  });

  it('convierte una construcción imposible en un error legible', () => {
    const datos = copia();
    datos.radios.r.factor = 0.4;
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores[0]).toContain('construcción imposible:');
  });

  it('devuelve los errores de validación sin intentar interpretar', () => {
    const datos = copia();
    datos.id = 'Mediatriz';
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores).toContain('id: el id de lección va en minúsculas y con guiones');
  });

  it('rechaza una lección cuya comprobación falla', () => {
    const datos = copia();
    datos.comprobaciones = [{ tipo: 'equidistante', punto: 'A', a: 'A', b: 'B' }];
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores[0]).toContain('A equidista de A y B');
  });
});