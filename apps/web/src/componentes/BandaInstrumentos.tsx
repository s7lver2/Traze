import type { Banda } from '../reproductor/instrumentos';

export function BandaInstrumentos({ banda }: { banda: Banda }) {
  const campos = [
    ['Instrumento', banda.instrumento],
    ['Lápiz', banda.lapiz],
    ['Abertura', banda.abertura],
  ] as const;

  return (
    <dl className="banda" aria-label="Instrumentos de este paso">
      {campos.map(([nombre, valor]) =>
        valor ? (
          <div key={nombre}>
            <dt>{nombre}</dt>
            <dd>{valor}</dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}
