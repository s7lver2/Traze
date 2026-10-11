export interface Trozo {
  texto: string;
  /** Si el trozo nombra uno o varios puntos (un segmento como «AB» nombra dos), sus ids. */
  puntos?: string[];
}

const PALABRA = /[A-Za-z][A-Za-z0-9']*/g;
const LARGO_MAXIMO = 8;

/** Parte una palabra en ids conocidos, como «AB» en A y B; la partición más larga primero. */
function partir(palabra: string, ids: ReadonlySet<string>): string[] | null {
  if (palabra.length === 0) return [];
  for (let largo = Math.min(palabra.length, LARGO_MAXIMO); largo >= 1; largo--) {
    const cabeza = palabra.slice(0, largo);
    if (!ids.has(cabeza)) continue;
    const resto = partir(palabra.slice(largo), ids);
    if (resto) return [cabeza, ...resto];
  }
  return null;
}

/** Palabras que, tras una «A», dicen que es el punto («A con B», «A y B») y no la preposición. */
const DESPUES_DE_UN_PUNTO = new Set(['con', 'y', 'e', 'o', 'hasta', 'en', 'es', 'está', 'se', 'también']);

/** «A» al empezar una frase y seguida de una palabra en minúsculas es la preposición, no el punto. */
function esPreposicion(texto: string, inicio: number, palabra: string): boolean {
  if (palabra !== 'A') return false;
  const antes = texto.slice(0, inicio).trimEnd();
  if (antes !== '' && !/[.!?:]$/.test(antes)) return false;
  const siguiente = /^\s+([a-záéíóúñ]{2,})/.exec(texto.slice(inicio + 1));
  return siguiente !== null && !DESPUES_DE_UN_PUNTO.has(siguiente[1]);
}

/** Trocea un texto en partes normales y partes que nombran puntos de la construcción. */
export function trocearTexto(texto: string, ids: readonly string[]): Trozo[] {
  const conocidos = new Set(ids);
  const trozos: Trozo[] = [];
  let desde = 0;

  for (const coincidencia of texto.matchAll(PALABRA)) {
    const palabra = coincidencia[0];
    const inicio = coincidencia.index ?? 0;
    if (!/^[A-Z]/.test(palabra) || palabra.length > LARGO_MAXIMO) continue;
    if (esPreposicion(texto, inicio, palabra)) continue;
    const partes = conocidos.has(palabra) ? [palabra] : partir(palabra, conocidos);
    if (!partes) continue;

    if (inicio > desde) trozos.push({ texto: texto.slice(desde, inicio) });
    trozos.push({ texto: palabra, puntos: partes });
    desde = inicio + palabra.length;
  }

  if (desde < texto.length) trozos.push({ texto: texto.slice(desde) });
  return trozos;
}
