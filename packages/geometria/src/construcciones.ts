import { interseccionCircunferencias } from './interseccion';
import { EPS, distancia, puntoMedio, type Punto, type Recta } from './vec';

export interface Mediatriz {
  m: Punto;
  n: Punto;
  radio: number;
  recta: Recta;
  medio: Punto;
}

export function mediatriz(a: Punto, b: Punto, factorRadio = 0.75): Mediatriz | null {
  const d = distancia(a, b);
  if (d < EPS) return null;

  const radio = factorRadio * d;
  const cortes = interseccionCircunferencias({ centro: a, radio }, { centro: b, radio });
  if (!cortes) return null;

  const [m, n] = cortes;
  if (distancia(m, n) < EPS) return null;

  return { m, n, radio, recta: { p: m, q: n }, medio: puntoMedio(a, b) };
}