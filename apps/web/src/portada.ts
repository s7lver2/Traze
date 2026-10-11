export interface GrupoBloque<T> {
  bloque: number;
  items: T[];
}

export function agruparPorBloque<T extends { leccion: { bloque: number } }>(
  items: readonly T[],
): GrupoBloque<T>[] {
  const grupos = new Map<number, T[]>();
  for (const item of items) {
    const grupo = grupos.get(item.leccion.bloque);
    if (grupo) grupo.push(item);
    else grupos.set(item.leccion.bloque, [item]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bloque, lista]) => ({ bloque, items: lista }));
}

export function textoPasos(total: number): string {
  return total === 1 ? '1 paso' : `${total} pasos`;
}
