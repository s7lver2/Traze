export interface Punto {
  x: number;
  y: number;
}

export interface Recta {
  p: Punto;
  q: Punto;
}

export interface Circunferencia {
  centro: Punto;
  radio: number;
}

export const EPS = 1e-9;

export const punto = (x: number, y: number): Punto => ({ x, y });
export const suma = (a: Punto, b: Punto): Punto => punto(a.x + b.x, a.y + b.y);
export const resta = (a: Punto, b: Punto): Punto => punto(a.x - b.x, a.y - b.y);
export const escala = (a: Punto, k: number): Punto => punto(a.x * k, a.y * k);
export const escalar = (a: Punto, b: Punto): number => a.x * b.x + a.y * b.y;
export const cruz = (a: Punto, b: Punto): number => a.x * b.y - a.y * b.x;
export const longitud = (a: Punto): number => Math.hypot(a.x, a.y);
export const distancia = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);
export const puntoMedio = (a: Punto, b: Punto): Punto => punto((a.x + b.x) / 2, (a.y + b.y) / 2);

export function unitario(v: Punto): Punto {
  const n = longitud(v);
  if (n < EPS) throw new Error('No se puede normalizar un vector nulo');
  return punto(v.x / n, v.y / n);
}

export const normalIzquierda = (v: Punto): Punto => punto(v.y, -v.x);

export function distanciaPuntoRecta(p: Punto, recta: Recta): number {
  const d = resta(recta.q, recta.p);
  const n = longitud(d);
  if (n < EPS) throw new Error('La recta está definida por dos puntos iguales');
  return Math.abs(cruz(d, resta(p, recta.p))) / n;
}