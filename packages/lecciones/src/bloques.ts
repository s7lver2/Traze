export const BLOQUES_TEMARIO = [
  'Elementos fundamentales y lugar geométrico',
  'Circunferencia',
  'Arco capaz',
  'Triángulos',
  'Cuadriláteros',
  'Polígonos regulares',
  'Proporcionalidad',
  'Transformaciones',
  'Tangencias',
  'Curvas técnicas',
] as const;

/** Nombre del bloque (1 a 10). Sin dependencias: se puede importar desde el navegador. */
export function nombreDelBloque(bloque: number): string {
  return BLOQUES_TEMARIO[bloque - 1];
}
