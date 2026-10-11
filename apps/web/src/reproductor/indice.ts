export type SituacionPaso = 'hecho' | 'actual' | 'pendiente';

export function situacionPaso(indice: number, actual: number): SituacionPaso {
  if (indice < actual) return 'hecho';
  if (indice === actual) return 'actual';
  return 'pendiente';
}

export function etiquetaPaso(indice: number, titulo: string, situacion: SituacionPaso): string {
  const base = `Ir al paso ${indice + 1}: ${titulo}`;
  return situacion === 'hecho' ? `${base} (hecho)` : base;
}
