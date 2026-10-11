import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function errores(datos: unknown): string[] {
  const resultado = validarLeccion(datos);
  return resultado.ok ? [] : resultado.errores;
}

describe('validarLeccion', () => {
  it('acepta la lección piloto y aplica los valores por defecto', () => {
    const resultado = validarLeccion(piloto);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.leccion.pasos).toHaveLength(6);
    expect(resultado.leccion.lienzo).toEqual({ ancho: 210, alto: 140 });
    const arco = resultado.leccion.pasos[1].dibujo[0];
    expect(arco.tipo === 'arco' && arco.amplitud).toBe(0.32);
  });

  it('rechaza un id de lección con mayúsculas', () => {
    const datos = copia();
    datos.id = 'Mediatriz';
    expect(errores(datos)).toContain('id: el id de lección va en minúsculas y con guiones');
  });

  it('señala un punto no definido con su paso y su campo', () => {
    const datos = copia();
    datos.pasos[0].dibujo[0] = { tipo: 'segmento', desde: 'A', hasta: 'Z' };
    expect(errores(datos)).toContain('pasos.0.dibujo.0.hasta: El punto «Z» no está definido');
  });

  it('señala un radio no definido en un arco', () => {
    const datos = copia();
    datos.pasos[1].dibujo[0].radio = 'q';
    expect(errores(datos)).toContain('pasos.1.dibujo.0.radio: El radio «q» no está definido');
  });

  it('rechaza más de 10 pasos', () => {
    const datos = copia();
    datos.pasos = Array.from({ length: 11 }, () => datos.pasos[0]);
    expect(errores(datos).some((e) => e.startsWith('pasos:'))).toBe(true);
  });

  it('rechaza una lección sin comprobaciones', () => {
    const datos = copia();
    datos.comprobaciones = [];
    expect(errores(datos).some((e) => e.startsWith('comprobaciones:'))).toBe(true);
  });
});