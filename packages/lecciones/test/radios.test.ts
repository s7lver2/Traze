import { describe, expect, it } from 'vitest';
import { distancia } from '@traze/geometria';
import dividir from '../../../contenido/bloque-1-trazados/dividir-segmento-dos-partes.json';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import { interpretarLeccion } from '../src/interpretar';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function errores(datos: unknown): string[] {
  const resultado = validarLeccion(datos);
  return resultado.ok ? [] : resultado.errores;
}

describe('radios fijos y deslizador', () => {
  it('acepta un radio fijo en milímetros', () => {
    const datos = copia();
    datos.radios.s = { mm: 30 };
    expect(interpretarLeccion(cargar(datos)).radios.s).toBeCloseTo(30, 9);
  });

  it('rechaza un radio que no es ni relativo ni fijo', () => {
    const datos = copia();
    datos.radios.s = { entre: ['A', 'B'] };
    expect(errores(datos)).toContain('radios.s: un radio lleva «entre» y «factor», o bien «mm»');
  });

  it('rechaza un radio fijo que no es positivo', () => {
    const datos = copia();
    datos.radios.s = { mm: 0 };
    expect(errores(datos).some((e) => e.startsWith('radios.s'))).toBe(true);
  });

  it('conserva el deslizador de la lección piloto', () => {
    const leccion = cargar(piloto);
    expect(leccion.radios.r).toMatchObject({ deslizador: { min: 0.55, max: 0.85 } });
  });

  it('la otra lección existente también declara su deslizador', () => {
    const leccion = cargar(dividir);
    expect(leccion.radios.r).toMatchObject({ deslizador: { min: 0.55, max: 0.85 } });
  });

  it('todo el rango de los deslizadores da una construcción válida', () => {
    for (const datos of [piloto, dividir]) {
      const leccion = cargar(datos);
      const { min, max } = (leccion.radios.r as { deslizador: { min: number; max: number } }).deslizador;
      for (const factor of [min, (min + max) / 2, max]) {
        expect(() => interpretarLeccion(leccion, { r: factor })).not.toThrow();
      }
    }
  });
});

describe('derivado radio', () => {
  it('define un radio a partir de dos puntos calculados', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'radio', id: 't', entre: ['M', 'N'], factor: 0.5 });
    const resuelta = interpretarLeccion(cargar(datos));
    expect(resuelta.radios.t).toBeCloseTo(0.5 * distancia(resuelta.puntos.M, resuelta.puntos.N), 9);
  });

  it('aplica el factor del deslizador también a un radio derivado', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'radio', id: 't', entre: ['M', 'N'], factor: 0.5 });
    const resuelta = interpretarLeccion(cargar(datos), { t: 1 });
    expect(resuelta.radios.t).toBeCloseTo(distancia(resuelta.puntos.M, resuelta.puntos.N), 9);
  });

  it('no deja usar un radio antes de definirlo', () => {
    const datos = copia();
    datos.derivados.unshift({ tipo: 'interseccionArcos', ids: ['P', 'Q'], centros: ['A', 'B'], radio: 't' });
    datos.derivados.push({ tipo: 'radio', id: 't', entre: ['A', 'B'], factor: 0.75 });
    expect(errores(datos)).toContain('derivados.0.radio: El radio «t» no está definido');
  });
});

describe('ids que no se pisan', () => {
  it('rechaza un radio derivado con el id de otro radio', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'radio', id: 'r', entre: ['M', 'N'], factor: 0.5 });
    expect(errores(datos)).toContain('derivados.2.id: El radio «r» ya está definido');
  });

  it('rechaza un derivado que sobrescribe un dato', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'puntoMedio', id: 'A', entre: ['A', 'B'] });
    expect(errores(datos)).toContain('derivados.2: El punto «A» ya está definido');
  });

  it('rechaza un derivado que repite otro derivado', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'puntoMedio', id: 'M', entre: ['A', 'B'] });
    expect(errores(datos)).toContain('derivados.2: El punto «M» ya está definido');
  });
});
