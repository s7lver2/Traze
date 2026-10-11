import { useMemo, useState } from 'react';

interface Posicion {
  x: number;
  y: number;
}

/**
 * Los puntos que hay que resaltar en el dibujo cuando se señala un nombre en un texto.
 * Solo se resaltan los que ya están dibujados: señalar no puede adelantar la solución.
 */
export function useDestacados(
  coordenadas: Readonly<Record<string, Posicion>>,
  claves: Readonly<Record<string, string>>,
  visibles: ReadonlySet<string>,
) {
  const [señalados, setSeñalados] = useState<string[]>([]);
  const destacados = useMemo(
    () =>
      señalados.flatMap((clave) => {
        const id = claves[clave];
        const posicion = id !== undefined && visibles.has(id) ? coordenadas[id] : undefined;
        return posicion ? [{ x: posicion.x, y: posicion.y }] : [];
      }),
    [señalados, claves, visibles, coordenadas],
  );
  return { destacados, alResaltar: setSeñalados };
}

/** De cada punto dibujado, su id y su etiqueta (si es distinta) apuntan al id. */
export function clavesDeLosPuntos(
  primitivas: readonly { tipo: string; id?: string; etiqueta?: string }[],
): Record<string, string> {
  const claves: Record<string, string> = {};
  for (const primitiva of primitivas) {
    if (primitiva.tipo !== 'punto' || primitiva.id === undefined) continue;
    claves[primitiva.id] = primitiva.id;
    if (primitiva.etiqueta) claves[primitiva.etiqueta] = primitiva.id;
  }
  return claves;
}
