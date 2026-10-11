import { describe, expect, it } from 'vitest';
import { crearEstado, reductor, type EstadoReproductor } from '../src/reproductor/estado';

const TOTAL = 3;
const nuevo = () => crearEstado(TOTAL);
const avanzar = (estado: EstadoReproductor, ms: number) =>
  reductor(estado, { tipo: 'avanzar', ms, duracionPasoMs: 1000 });
const alternar = (estado: EstadoReproductor) =>
  reductor(estado, { tipo: 'alternarReproduccion' });
const encadenando = (): EstadoReproductor => alternar(alternar(nuevo()));

describe('crearEstado', () => {
  it('empieza en el primer paso, animándolo', () => {
    expect(nuevo()).toEqual({
      totalPasos: 3,
      paso: 0,
      progreso: 0,
      reproduciendo: true,
      encadenar: false,
      velocidad: 1,
      ocultarConstruccion: false,
      animar: true,
    });
  });

  it('rechaza una lección sin pasos', () => {
    expect(() => crearEstado(0)).toThrow('al menos un paso');
  });

  it('sin animaciones, el primer paso aparece terminado', () => {
    expect(crearEstado(TOTAL, false)).toMatchObject({
      progreso: 1,
      reproduciendo: false,
      animar: false,
    });
  });
});

describe('avanzar', () => {
  it('suma progreso según el tiempo y la velocidad', () => {
    expect(avanzar(nuevo(), 250).progreso).toBeCloseTo(0.25, 9);
    const rapido = reductor(nuevo(), { tipo: 'velocidad', valor: 2 });
    expect(avanzar(rapido, 250).progreso).toBeCloseTo(0.5, 9);
  });

  it('se detiene al terminar el paso si no está encadenando', () => {
    expect(avanzar(nuevo(), 1500)).toMatchObject({
      paso: 0,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });

  it('pasa al siguiente paso si está encadenando', () => {
    expect(avanzar(encadenando(), 1000)).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
      encadenar: true,
    });
  });

  it('se detiene tras el último paso aunque esté encadenando', () => {
    const final = avanzar(avanzar(avanzar(encadenando(), 1000), 1000), 1000);
    expect(final).toMatchObject({
      paso: 2,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });

  it('no cambia nada si está en pausa', () => {
    const pausado = alternar(nuevo());
    expect(avanzar(pausado, 500)).toBe(pausado);
  });

  it('ignora los tiempos negativos', () => {
    expect(avanzar(nuevo(), -100).progreso).toBe(0);
  });
});

describe('navegación manual', () => {
  it('siguiente entra en el paso animándolo, sin encadenar', () => {
    const siguiente = reductor(avanzar(nuevo(), 600), { tipo: 'siguiente' });
    expect(siguiente).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
      encadenar: false,
    });
  });

  it('siguiente y anterior no se salen de los límites', () => {
    const primero = nuevo();
    expect(reductor(primero, { tipo: 'anterior' })).toBe(primero);

    const ultimo = reductor(primero, { tipo: 'irA', paso: TOTAL - 1 });
    expect(reductor(ultimo, { tipo: 'siguiente' })).toBe(ultimo);
  });

  it('anterior vuelve a animar el paso al que entra', () => {
    const terminado = avanzar(reductor(nuevo(), { tipo: 'irA', paso: 2 }), 1000);
    expect(terminado.progreso).toBe(1);
    expect(reductor(terminado, { tipo: 'anterior' })).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
    });
  });

  it('irA limita el paso al rango de la lección', () => {
    expect(reductor(nuevo(), { tipo: 'irA', paso: 99 }).paso).toBe(2);
    expect(reductor(nuevo(), { tipo: 'irA', paso: -5 }).paso).toBe(0);
  });

  it('reiniciar vuelve al primer paso y cancela la cadena', () => {
    const enMedio = avanzar(encadenando(), 1000);
    expect(enMedio.paso).toBe(1);
    expect(reductor(enMedio, { tipo: 'reiniciar' })).toMatchObject({
      paso: 0,
      progreso: 0,
      reproduciendo: true,
      encadenar: false,
    });
  });

  it('ver la solución completa deja el último paso terminado', () => {
    expect(reductor(nuevo(), { tipo: 'verSolucion' })).toMatchObject({
      paso: 2,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });
});

describe('reproducir todo', () => {
  it('pausa y reanuda continuando por donde iba', () => {
    const pausado = alternar(avanzar(nuevo(), 400));
    expect(pausado).toMatchObject({ reproduciendo: false, encadenar: false });

    const reanudado = alternar(pausado);
    expect(reanudado.paso).toBe(0);
    expect(reanudado.progreso).toBeCloseTo(0.4, 9);
    expect(reanudado).toMatchObject({ reproduciendo: true, encadenar: true });
  });

  it('continúa en el siguiente paso si el actual ya terminó', () => {
    const terminado = avanzar(nuevo(), 1000);
    expect(terminado).toMatchObject({ paso: 0, progreso: 1, reproduciendo: false });
    expect(alternar(terminado)).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
      encadenar: true,
    });
  });

  it('empieza de nuevo si ya se llegó al final', () => {
    const alFinal = avanzar(reductor(nuevo(), { tipo: 'irA', paso: 2 }), 1000);
    expect(alFinal).toMatchObject({ paso: 2, progreso: 1, reproduciendo: false });
    expect(alternar(alFinal)).toMatchObject({
      paso: 0,
      progreso: 0,
      reproduciendo: true,
      encadenar: true,
    });
  });
});

describe('ajustes', () => {
  it('cambia la velocidad y alterna la visibilidad de la construcción', () => {
    expect(reductor(nuevo(), { tipo: 'velocidad', valor: 0.5 }).velocidad).toBe(0.5);

    const oculta = reductor(nuevo(), { tipo: 'alternarConstruccion' });
    expect(oculta.ocultarConstruccion).toBe(true);
    expect(reductor(oculta, { tipo: 'alternarConstruccion' }).ocultarConstruccion).toBe(false);
  });

  it('sin animaciones, los pasos aparecen terminados y reproducir no hace nada', () => {
    const sinAnimar = crearEstado(TOTAL, false);
    expect(reductor(sinAnimar, { tipo: 'siguiente' })).toMatchObject({
      paso: 1,
      progreso: 1,
      reproduciendo: false,
    });
    expect(alternar(sinAnimar)).toBe(sinAnimar);
  });

  it('desactivar la animación termina el paso en curso', () => {
    expect(reductor(encadenando(), { tipo: 'animar', valor: false })).toMatchObject({
      animar: false,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });
});