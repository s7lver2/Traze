'use client';

import { trocearTexto } from '../reproductor/enlaces';

interface Propiedades {
  texto: string;
  /** Los nombres de punto que se reconocen en el texto. */
  claves: readonly string[];
  alResaltar: (claves: string[]) => void;
}

/** Un texto en el que los nombres de los puntos (A, B, AB…) se pueden señalar en el dibujo. */
export function TextoConPuntos({ texto, claves, alResaltar }: Propiedades) {
  return (
    <>
      {trocearTexto(texto, claves).map((trozo, i) =>
        trozo.puntos ? (
          <button
            key={i}
            type="button"
            className="punto-enlace"
            aria-label={`Señalar ${trozo.texto} en el dibujo`}
            onMouseEnter={() => alResaltar(trozo.puntos!)}
            onMouseLeave={() => alResaltar([])}
            onFocus={() => alResaltar(trozo.puntos!)}
            onBlur={() => alResaltar([])}
            onClick={() => alResaltar(trozo.puntos!)}
          >
            {trozo.texto}
          </button>
        ) : (
          <span key={i}>{trozo.texto}</span>
        ),
      )}
    </>
  );
}
