import { puntaArco, type Posicion, type Tramo } from './trazado';
import type { PrimitivaAnimada } from './tiempos';

const EPSILON = 1e-9;
const LARGO_PATA = 0.7;
const LARGO_MANGO = 0.25;
const ANCHO_REGLA = 12;
const SALIDA_REGLA = 8;
const PASO_MARCAS = 5;
const LARGO_MARCA = 2.5;

export interface Compas {
  aguja: Posicion;
  mina: Posicion;
  bisagra: Posicion;
  mango: Posicion;
}

export interface Regla {
  esquinas: [Posicion, Posicion, Posicion, Posicion];
  marcas: Tramo[];
}

export type HerramientaActiva =
  | { tipo: 'compas'; aguja: Posicion; mina: Posicion }
  | { tipo: 'regla'; tramo: Tramo };

/** Normal unitaria al tramo, elegida siempre hacia arriba (y negativa en pantalla). */
function normalArriba(dx: number, dy: number, largo: number): Posicion {
  const normal = { x: -dy / largo, y: dx / largo };
  if (normal.y > EPSILON || (Math.abs(normal.y) <= EPSILON && normal.x < 0)) {
    return { x: -normal.x, y: -normal.y };
  }
  return normal;
}

export function geometriaCompas(aguja: Posicion, mina: Posicion): Compas | null {
  const dx = mina.x - aguja.x;
  const dy = mina.y - aguja.y;
  const abertura = Math.hypot(dx, dy);
  if (abertura < EPSILON) return null;

  const pata = abertura * LARGO_PATA;
  const altura = Math.sqrt(Math.max(0, pata * pata - (abertura / 2) ** 2));
  const arriba = normalArriba(dx, dy, abertura);
  const bisagra = {
    x: (aguja.x + mina.x) / 2 + arriba.x * altura,
    y: (aguja.y + mina.y) / 2 + arriba.y * altura,
  };
  const mango = {
    x: bisagra.x + arriba.x * pata * LARGO_MANGO,
    y: bisagra.y + arriba.y * pata * LARGO_MANGO,
  };
  return { aguja, mina, bisagra, mango };
}

export function geometriaRegla(tramo: Tramo): Regla | null {
  const dx = tramo.x2 - tramo.x1;
  const dy = tramo.y2 - tramo.y1;
  const largo = Math.hypot(dx, dy);
  if (largo < EPSILON) return null;

  const along = { x: dx / largo, y: dy / largo };
  const arriba = normalArriba(dx, dy, largo);
  const origen = {
    x: tramo.x1 - along.x * SALIDA_REGLA,
    y: tramo.y1 - along.y * SALIDA_REGLA,
  };
  const total = largo + 2 * SALIDA_REGLA;
  const en = (distancia: number, altura: number): Posicion => ({
    x: origen.x + along.x * distancia + arriba.x * altura,
    y: origen.y + along.y * distancia + arriba.y * altura,
  });

  const marcas: Tramo[] = [];
  for (let distancia = 0; distancia <= total + EPSILON; distancia += PASO_MARCAS) {
    const base = en(distancia, 0);
    const punta = en(distancia, LARGO_MARCA);
    marcas.push({ x1: base.x, y1: base.y, x2: punta.x, y2: punta.y });
  }

  return {
    esquinas: [en(0, 0), en(total, 0), en(total, ANCHO_REGLA), en(0, ANCHO_REGLA)],
    marcas,
  };
}

/** La herramienta que el alumno vería usar en el paso en curso: la de la última línea trazada. */
export function herramientaActiva(visibles: readonly PrimitivaAnimada[]): HerramientaActiva | null {
  for (let i = visibles.length - 1; i >= 0; i--) {
    const { primitiva, progreso, delPasoActual } = visibles[i];
    if (!delPasoActual) continue;
    if (primitiva.tipo === 'arco') {
      return {
        tipo: 'compas',
        aguja: { x: primitiva.cx, y: primitiva.cy },
        mina: puntaArco(primitiva, progreso),
      };
    }
    if (primitiva.tipo === 'segmento' || primitiva.tipo === 'recta') {
      return {
        tipo: 'regla',
        tramo: {
          x1: primitiva.x1,
          y1: primitiva.y1,
          x2: primitiva.x2,
          y2: primitiva.y2,
        },
      };
    }
  }
  return null;
}
