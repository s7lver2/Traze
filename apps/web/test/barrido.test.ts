import { describe, expect, it } from 'vitest';
import { enLaCircunferencia, iniciarBarrido, moverBarrido, recorrido } from '../src/taller/barrido';

const centro = { x: 0, y: 0 };
const grados = (g: number) => (g * Math.PI) / 180;
const en = (g: number) => enLaCircunferencia(centro, 10, grados(g));

function barrer(...angulos: number[]) {
  let barrido = iniciarBarrido(centro, en(angulos[0]));
  for (const angulo of angulos.slice(1)) barrido = moverBarrido(barrido, en(angulo));
  return barrido;
}

describe('barrido del compás', () => {
  it('recuerda el rango recorrido hacia un lado', () => {
    const { desde, hasta } = recorrido(barrer(10, 30, 60, 90));
    expect(desde).toBeCloseTo(grados(10), 9);
    expect(hasta).toBeCloseTo(grados(90), 9);
  });

  it('y hacia el otro', () => {
    const { desde, hasta } = recorrido(barrer(90, 60, 30, 10));
    expect(desde).toBeCloseTo(grados(10), 9);
    expect(hasta).toBeCloseTo(grados(90), 9);
  });

  it('no salta al cruzar los 180°: el ángulo sigue siendo continuo', () => {
    const barrido = barrer(150, 170, -170, -150);
    expect(barrido.actual).toBeCloseTo(grados(210), 9);
    const { desde, hasta } = recorrido(barrido);
    expect(desde).toBeCloseTo(grados(150), 9);
    expect(hasta).toBeCloseTo(grados(210), 9);
  });

  it('una vuelta entera recorre 360°', () => {
    const { desde, hasta } = recorrido(barrer(0, 90, 180, -90, 0));
    expect(hasta - desde).toBeCloseTo(grados(360), 9);
  });

  it('si el puntero va y vuelve, el rango incluye todo lo que pasó', () => {
    const { desde, hasta } = recorrido(barrer(20, 80, 50));
    expect(desde).toBeCloseTo(grados(20), 9);
    expect(hasta).toBeCloseTo(grados(80), 9);
  });

  it('sin moverse, el rango es un solo ángulo', () => {
    const { desde, hasta } = recorrido(barrer(40));
    expect(hasta - desde).toBe(0);
  });

  it('no depende de la distancia del puntero al centro', () => {
    let barrido = iniciarBarrido(centro, { x: 5, y: 0 });
    barrido = moverBarrido(barrido, { x: 0, y: 500 });
    expect(barrido.actual).toBeCloseTo(Math.PI / 2, 9);
  });
});
