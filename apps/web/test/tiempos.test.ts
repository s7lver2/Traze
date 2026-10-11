import { describe, expect, it } from 'vitest';
import type { PrimitivaResuelta } from '@traze/lecciones';
import {
  DURACION_MS,
  duracionPaso,
  primitivasVisibles,
  progresoPrimitivas,
} from '../src/reproductor/tiempos';

const puntoA: PrimitivaResuelta = {
  tipo: 'punto',
  id: 'A',
  etiqueta: 'A',
  x: 0,
  y: 0,
  estilo: 'dato',
};
const arco: PrimitivaResuelta = {
  tipo: 'arco',
  cx: 0,
  cy: 0,
  radio: 10,
  inicio: 0,
  fin: 1,
  estilo: 'construccion',
};

describe('duracionPaso', () => {
  it('suma la duración de cada primitiva', () => {
    expect(duracionPaso([puntoA, arco])).toBe(DURACION_MS.punto + DURACION_MS.arco);
  });

  it('es cero si el paso no tiene primitivas', () => {
    expect(duracionPaso([])).toBe(0);
  });
});

describe('progresoPrimitivas', () => {
  it('va de nada a todo entre el principio y el final del paso', () => {
    expect(progresoPrimitivas([puntoA, arco], 0)).toEqual([0, 0]);
    expect(progresoPrimitivas([puntoA, arco], 1)).toEqual([1, 1]);
  });

  it('dibuja las primitivas una detrás de otra', () => {
    const total = duracionPaso([puntoA, arco]);
    const progreso = (DURACION_MS.punto + DURACION_MS.arco / 2) / total;
    const [primera, segunda] = progresoPrimitivas([puntoA, arco], progreso);
    expect(primera).toBe(1);
    expect(segunda).toBeCloseTo(0.5, 9);
  });

  it('limita el progreso fuera del rango 0-1', () => {
    expect(progresoPrimitivas([puntoA, arco], -3)).toEqual([0, 0]);
    expect(progresoPrimitivas([puntoA, arco], 7)).toEqual([1, 1]);
  });
});

describe('primitivasVisibles', () => {
  const dibujos = [[puntoA], [puntoA, arco]];

  it('muestra completos los pasos anteriores y oculta los posteriores', () => {
    const alFinal = primitivasVisibles(dibujos, 1, 1);
    expect(alFinal.map((v) => v.clave)).toEqual(['0-0', '1-0', '1-1']);
    expect(alFinal.map((v) => v.progreso)).toEqual([1, 1, 1]);
    expect(alFinal.map((v) => v.delPasoActual)).toEqual([false, true, true]);

    expect(primitivasVisibles(dibujos, 0, 1).map((v) => v.clave)).toEqual(['0-0']);
  });

  it('omite las primitivas del paso actual que todavía no han empezado', () => {
    expect(primitivasVisibles(dibujos, 1, 0).map((v) => v.clave)).toEqual(['0-0']);

    const total = duracionPaso(dibujos[1]);
    const visibles = primitivasVisibles(dibujos, 1, DURACION_MS.punto / 2 / total);
    expect(visibles.map((v) => v.clave)).toEqual(['0-0', '1-0']);
    expect(visibles[1].progreso).toBeCloseTo(0.5, 9);
  });
});