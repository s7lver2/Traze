export interface Posicion {
  x: number;
  y: number;
}

/**
 * El giro de un compás alrededor de su aguja: el ángulo del puntero, medido de forma continua
 * (sin el salto de ±π al dar la vuelta), y el rango que ha recorrido.
 */
export interface Barrido {
  centro: Posicion;
  /** Ángulo continuo en el que empezó el giro. */
  inicial: number;
  /** Último ángulo bruto del puntero, para desenrollar el siguiente. */
  ultimo: number;
  /** Ángulo continuo actual. */
  actual: number;
  minimo: number;
  maximo: number;
}

const DOS_PI = 2 * Math.PI;
const anguloDe = (centro: Posicion, p: Posicion): number => Math.atan2(p.y - centro.y, p.x - centro.x);

export function iniciarBarrido(centro: Posicion, posicion: Posicion): Barrido {
  const angulo = anguloDe(centro, posicion);
  return { centro, inicial: angulo, ultimo: angulo, actual: angulo, minimo: angulo, maximo: angulo };
}

/** Menor diferencia entre dos ángulos, en (−π, π]. */
function diferencia(nuevo: number, anterior: number): number {
  let d = (nuevo - anterior) % DOS_PI;
  if (d > Math.PI) d -= DOS_PI;
  if (d <= -Math.PI) d += DOS_PI;
  return d;
}

export function moverBarrido(barrido: Barrido, posicion: Posicion): Barrido {
  const bruto = anguloDe(barrido.centro, posicion);
  const actual = barrido.actual + diferencia(bruto, barrido.ultimo);
  return {
    ...barrido,
    ultimo: bruto,
    actual,
    minimo: Math.min(barrido.minimo, actual),
    maximo: Math.max(barrido.maximo, actual),
  };
}

/** Lo que ha recorrido el compás, para que el reto compruebe que cubre el arco. */
export function recorrido(barrido: Barrido): { desde: number; hasta: number } {
  return { desde: barrido.minimo, hasta: barrido.maximo };
}

/** Un punto sobre la circunferencia de radio `radio` alrededor del centro, a ese ángulo. */
export function enLaCircunferencia(centro: Posicion, radio: number, angulo: number): Posicion {
  return { x: centro.x + radio * Math.cos(angulo), y: centro.y + radio * Math.sin(angulo) };
}
