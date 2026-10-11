import type { PrimitivaResuelta } from '@traze/lecciones';
import { clamp01 } from './tiempos';

type Resuelta<T extends PrimitivaResuelta['tipo']> = Extract<PrimitivaResuelta, { tipo: T }>;

export interface Tramo {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Posicion {
  x: number;
  y: number;
}

const formatear = (n: number): string => (Math.abs(n) < 5e-4 ? '0.000' : n.toFixed(3));

export function puntaSegmento(tramo: Tramo, progreso: number): Posicion {
  const k = clamp01(progreso);
  return {
    x: tramo.x1 + (tramo.x2 - tramo.x1) * k,
    y: tramo.y1 + (tramo.y2 - tramo.y1) * k,
  };
}

export function puntaArco(arco: Resuelta<'arco'>, progreso: number): Posicion {
  const angulo = arco.inicio + (arco.fin - arco.inicio) * clamp01(progreso);
  return {
    x: arco.cx + arco.radio * Math.cos(angulo),
    y: arco.cy + arco.radio * Math.sin(angulo),
  };
}

export function puntaDe(primitiva: PrimitivaResuelta, progreso: number): Posicion | null {
  switch (primitiva.tipo) {
    case 'segmento':
    case 'recta':
      return puntaSegmento(primitiva, progreso);
    case 'arco':
      return puntaArco(primitiva, progreso);
    default:
      return null;
  }
}

export function descripcionArco(arco: Resuelta<'arco'>, progreso: number): string {
  const recorrido = (arco.fin - arco.inicio) * clamp01(progreso);
  if (Math.abs(recorrido) < 1e-9) return '';

  // Un arco SVG de más de 180° es ambiguo; se parte en dos mitades.
  const trozos = Math.abs(recorrido) > Math.PI ? 2 : 1;
  const sentido = recorrido > 0 ? 1 : 0;
  const en = (angulo: number): Posicion => ({
    x: arco.cx + arco.radio * Math.cos(angulo),
    y: arco.cy + arco.radio * Math.sin(angulo),
  });

  const origen = en(arco.inicio);
  let camino = `M ${formatear(origen.x)} ${formatear(origen.y)}`;
  for (let i = 1; i <= trozos; i++) {
    const destino = en(arco.inicio + (recorrido * i) / trozos);
    camino += ` A ${formatear(arco.radio)} ${formatear(arco.radio)} 0 0 ${sentido} ${formatear(destino.x)} ${formatear(destino.y)}`;
  }
  return camino;
}

export function descripcionAnguloRecto(marca: Resuelta<'marcaAnguloRecto'>, lado = 4): string {
  const a = { x: marca.x + marca.ux1 * lado, y: marca.y + marca.uy1 * lado };
  const b = { x: a.x + marca.ux2 * lado, y: a.y + marca.uy2 * lado };
  const c = { x: marca.x + marca.ux2 * lado, y: marca.y + marca.uy2 * lado };
  return `M ${formatear(a.x)} ${formatear(a.y)} L ${formatear(b.x)} ${formatear(b.y)} L ${formatear(c.x)} ${formatear(c.y)}`;
}

export function descripcionMarcaIgualdad(marca: Resuelta<'marcaIgualdad'>, semilargo = 3): string {
  const dx = marca.x2 - marca.x1;
  const dy = marca.y2 - marca.y1;
  const largo = Math.hypot(dx, dy);
  if (largo < 1e-9) return '';

  const mx = (marca.x1 + marca.x2) / 2;
  const my = (marca.y1 + marca.y2) / 2;
  const nx = -dy / largo;
  const ny = dx / largo;
  return `M ${formatear(mx - nx * semilargo)} ${formatear(my - ny * semilargo)} L ${formatear(mx + nx * semilargo)} ${formatear(my + ny * semilargo)}`;
}

export function radioPunto(base: number, progreso: number): number {
  return base * (1 + 0.5 * Math.sin(Math.PI * clamp01(progreso)));
}

export function esConstruccion(primitiva: PrimitivaResuelta): boolean {
  return 'estilo' in primitiva && primitiva.estilo === 'construccion';
}