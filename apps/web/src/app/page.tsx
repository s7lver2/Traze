import { nombreDeBloque } from '@traze/lecciones';
import Link from 'next/link';
import { cargarLecciones } from '../contenido';
import { agruparPorBloque, textoPasos } from '../portada';
import { cargarTemario } from '../temario';

export default function Portada() {
  const grupos = agruparPorBloque(cargarLecciones());
  const publicadas = new Set(grupos.flatMap((grupo) => grupo.items.map(({ leccion }) => leccion.id)));
  const primera = cargarTemario().lecciones.find((entrada) => publicadas.has(entrada.id));

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="portada">
          <h1>Traze</h1>
          <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>

          <div className="acciones">
            {primera && (
              <Link className="boton boton-principal" href={`/leccion/${primera.id}`}>
                Empezar por «{primera.titulo}»
              </Link>
            )}
            <Link className="boton" href="/temario">
              Ver el temario
            </Link>
            <Link className="boton" href="/consejos">
              Consejos para hacerlo perfecto
            </Link>
          </div>

          {grupos.length === 0 && <p>Todavía no hay lecciones publicadas.</p>}

          {grupos.map((grupo) => (
            <section
              key={grupo.bloque}
              className="bloque"
              aria-labelledby={`bloque-${grupo.bloque}`}
            >
              <h2 id={`bloque-${grupo.bloque}`}>
                {grupo.bloque}. {nombreDeBloque(grupo.bloque)}
              </h2>
              <ul className="fichas">
                {grupo.items.map(({ leccion, resuelta }) => (
                  <li key={leccion.id}>
                    <Link className="ficha" href={`/leccion/${leccion.id}`}>
                      <span className="ficha-titulo">{leccion.titulo}</span>
                      <span className="ficha-meta">{textoPasos(resuelta.pasos.length)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      </div>
    </div>
  );
}
