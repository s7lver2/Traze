import { EPS, distancia, punto, type Circunferencia, type Punto, type Recta } from './vec';

export function interseccionCircunferencias(
  a: Circunferencia,
  b: Circunferencia,
): [Punto, Punto] | null {
  const d = distancia(a.centro, b.centro);
  if (d < EPS) return null;
  if (d > a.radio + b.radio + EPS) return null;
  if (d < Math.abs(a.radio - b.radio) - EPS) return null;

  const x = (d * d + a.radio * a.radio - b.radio * b.radio) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.radio * a.radio - x * x));
  const ux = (b.centro.x - a.centro.x) / d;
  const uy = (b.centro.y - a.centro.y) / d;
  const base = punto(a.centro.x + ux * x, a.centro.y + uy * x);

  return [
    punto(base.x + uy * h, base.y - ux * h),
    punto(base.x - uy * h, base.y + ux * h),
  ];
}

export function interseccionRectaCircunferencia(recta: Recta, c: Circunferencia): Punto[] {
  const dx = recta.q.x - recta.p.x;
  const dy = recta.q.y - recta.p.y;
  const fx = recta.p.x - c.centro.x;
  const fy = recta.p.y - c.centro.y;

  const a = dx * dx + dy * dy;
  if (a < EPS) return [];
  const b = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - c.radio * c.radio;
  const discriminante = b * b - 4 * a * cc;

  if (discriminante < -EPS) return [];
  if (discriminante <= EPS) {
    const t = -b / (2 * a);
    return [punto(recta.p.x + t * dx, recta.p.y + t * dy)];
  }

  const raiz = Math.sqrt(discriminante);
  const t1 = (-b - raiz) / (2 * a);
  const t2 = (-b + raiz) / (2 * a);
  return [
    punto(recta.p.x + t1 * dx, recta.p.y + t1 * dy),
    punto(recta.p.x + t2 * dx, recta.p.y + t2 * dy),
  ];
}

export function interseccionRectas(r1: Recta, r2: Recta): Punto | null {
  const d1x = r1.q.x - r1.p.x;
  const d1y = r1.q.y - r1.p.y;
  const d2x = r2.q.x - r2.p.x;
  const d2y = r2.q.y - r2.p.y;
  const denominador = d1x * d2y - d1y * d2x;
  if (Math.abs(denominador) < EPS) return null;

  const t = ((r2.p.x - r1.p.x) * d2y - (r2.p.y - r1.p.y) * d2x) / denominador;
  return punto(r1.p.x + t * d1x, r1.p.y + t * d1y);
}