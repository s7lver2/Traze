import Link from 'next/link';
import { cargarLecciones } from '../contenido';
import { agruparPorBloque, textoPasos } from '../portada';

export default function Portada() {
  const grupos = agruparPorBloque(cargarLecciones());

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="portada">
          <h1>Traze</h1>
          <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>

          {grupos.length === 0 && <p>Todavía no hay lecciones publicadas.</p>}

          {grupos.map((grupo) => (
            <section
              key={grupo.bloque}
              className="bloque"
              aria-labelledby={`bloque-${grupo.bloque}`}
            >
              <h2 id={`bloque-${grupo.bloque}`}>Bloque {grupo.bloque}</h2>
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
