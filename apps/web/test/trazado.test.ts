import { describe, expect, it } from 'vitest';
import {
  descripcionAnguloRecto,
  descripcionArco,
  descripcionMarcaIgualdad,
  esConstruccion,
  puntaArco,
  puntaSegmento,
  radioPunto,
} from '../src/reproductor/trazado';

describe('puntaSegmento', () => {
  const tramo = { x1: 0, y1: 0, x2: 10, y2: 20 };

  it('recorre el segmento según el progreso y no se sale de él', () => {
    expect(puntaSegmento(tramo, 0.5)).toEqual({ x: 5, y: 10 });
    expect(puntaSegmento(tramo, 2)).toEqual({ x: 10, y: 20 });
    expect(puntaSegmento(tramo, -1)).toEqual({ x: 0, y: 0 });
  });
});

describe('puntaArco', () => {
  it('sigue el barrido del arco', () => {
    const punta = puntaArco(
      { tipo: 'arco', cx: 0, cy: 0, radio: 10, inicio: 0, fin: Math.PI, estilo: 'construccion' },
      0.5,
    );
    expect(punta.x).toBeCloseTo(0, 9);
    expect(punta.y).toBeCloseTo(10, 9);
  });
});

describe('descripcionArco', () => {
  const arco = (fin: number) =>
    ({ tipo: 'arco', cx: 0, cy: 0, radio: 10, inicio: 0, fin, estilo: 'construccion' }) as const;

  it('dibuja un cuarto de circunferencia', () => {
    expect(descripcionArco(arco(Math.PI / 2), 1)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 1 0.000 10.000',
    );
  });

  it('recorta el arco según el progreso', () => {
    expect(descripcionArco(arco(Math.PI), 0.5)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 1 0.000 10.000',
    );
  });

  it('respeta el sentido negativo', () => {
    expect(descripcionArco(arco(-Math.PI / 2), 1)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 0 0.000 -10.000',
    );
  });

  it('divide el trazo en dos arcos si pasa de 180 grados', () => {
    expect(descripcionArco(arco(2 * Math.PI), 1)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 1 -10.000 0.000 A 10.000 10.000 0 0 1 10.000 0.000',
    );
  });

  it('devuelve una cadena vacía si todavía no hay recorrido', () => {
    expect(descripcionArco(arco(Math.PI), 0)).toBe('');
  });
});

describe('marcas', () => {
  it('dibuja el cuadradito del ángulo recto en el vértice', () => {
    const marca = {
      tipo: 'marcaAnguloRecto',
      x: 10,
      y: 10,
      ux1: 1,
      uy1: 0,
      ux2: 0,
      uy2: 1,
    } as const;
    expect(descripcionAnguloRecto(marca)).toBe('M 14.000 10.000 L 14.000 14.000 L 10.000 14.000');
  });

  it('dibuja la marca de igualdad perpendicular al segmento, en su punto medio', () => {
    const marca = { tipo: 'marcaIgualdad', x1: 0, y1: 0, x2: 10, y2: 0 } as const;
    expect(descripcionMarcaIgualdad(marca)).toBe('M 5.000 -3.000 L 5.000 3.000');
  });

  it('no dibuja la marca de igualdad de un segmento nulo', () => {
    const marca = { tipo: 'marcaIgualdad', x1: 4, y1: 4, x2: 4, y2: 4 } as const;
    expect(descripcionMarcaIgualdad(marca)).toBe('');
  });
});

describe('radioPunto', () => {
  it('hace un pequeño pulso y vuelve al tamaño base', () => {
    expect(radioPunto(2, 0)).toBe(2);
    expect(radioPunto(2, 0.5)).toBe(3);
    expect(radioPunto(2, 1)).toBeCloseTo(2, 9);
  });
});

describe('esConstruccion', () => {
  it('es cierto solo para las primitivas de estilo construcción', () => {
    expect(
      esConstruccion({
        tipo: 'punto',
        id: 'M',
        etiqueta: 'M',
        x: 0,
        y: 0,
        estilo: 'construccion',
      }),
    ).toBe(true);
    expect(
      esConstruccion({ tipo: 'segmento', x1: 0, y1: 0, x2: 1, y2: 1, estilo: 'dato' }),
    ).toBe(false);
    expect(esConstruccion({ tipo: 'marcaIgualdad', x1: 0, y1: 0, x2: 1, y2: 1 })).toBe(false);
  });
});