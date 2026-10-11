/**
 * Medidas de las etiquetas de los puntos, en milímetros de papel.
 * Las usan el chequeo de render y el Lienzo de la web: así no pueden descuadrarse.
 * El ancho de la letra es una aproximación para rotulación en mayúscula.
 */
export const ROTULO = {
  dx: 2,
  dy: -2.5,
  tamano: 5,
  anchoCaracter: 0.7,
  ascenso: 0.8,
  descenso: 0.2,
} as const;

export interface Caja {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function cajaDeRotulo(x: number, y: number, etiqueta: string): Caja {
  const base = y + ROTULO.dy;
  return {
    x1: x + ROTULO.dx,
    y1: base - ROTULO.ascenso * ROTULO.tamano,
    x2: x + ROTULO.dx + etiqueta.length * ROTULO.tamano * ROTULO.anchoCaracter,
    y2: base + ROTULO.descenso * ROTULO.tamano,
  };
}
