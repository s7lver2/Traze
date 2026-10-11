import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { vecinas } from '@traze/lecciones';
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';
import { cargarTemario } from '../../../temario';

export const dynamicParams = false;

interface Propiedades {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return cargarLecciones().map(({ leccion }) => ({ id: leccion.id }));
}

export async function generateMetadata({ params }: Propiedades): Promise<Metadata> {
  const { id } = await params;
  const cargada = cargarLeccion(id);
  if (!cargada) return {};
  return { title: cargada.leccion.titulo, description: cargada.leccion.enunciado };
}

export default async function PaginaLeccion({ params }: Propiedades) {
  const { id } = await params;
  const cargada = cargarLeccion(id);
  if (!cargada) notFound();

  const { leccion, resuelta } = cargada;
  const temario = cargarTemario();
  const publicadas = new Set(cargarLecciones().map(({ leccion: otra }) => otra.id));
  const { anterior, siguiente } = vecinas(temario, publicadas, id);
  const requisitos = leccion.requisitos.flatMap((idRequisito) => {
    const entrada = temario.lecciones.find((candidata) => candidata.id === idRequisito);
    return entrada ? [entrada] : [];
  });

  return (
    <article className="leccion">
      <Reproductor leccion={leccion} resuelta={resuelta} />

      <div className="pagina">
        <div className="hoja">
          <section className="enunciado">
            <h2>Enunciado</h2>
            <p>{leccion.enunciado}</p>
            <p className="idea-clave">
              <strong>Idea clave.</strong> {leccion.ideaClave}
            </p>
            {requisitos.length > 0 && (
              <div className="requisitos">
                <p className="etiqueta">Si te atascas, repasa</p>
                <ul>
                  {requisitos.map((requisito) => (
                    <li key={requisito.id}>
                      {publicadas.has(requisito.id) ? (
                        <Link href={`/leccion/${requisito.id}`}>{requisito.titulo}</Link>
                      ) : (
                        <span>{requisito.titulo} (próximamente)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {leccion.errores.length > 0 && (
            <section className="errores">
              <h2>Errores frecuentes</h2>
              <ul>
                {leccion.errores.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </section>
          )}

          <details className="pasos-escritos">
            <summary>Los pasos por escrito</summary>
            <ol>
              {resuelta.pasos.map((paso) => (
                <li key={paso.titulo}>
                  <strong>{paso.titulo}.</strong> {paso.texto} <em>{paso.porque}</em>
                </li>
              ))}
            </ol>
          </details>

          <nav className="nav-leccion" aria-label="Lección anterior y siguiente">
            {anterior ? (
              <Link className="nav-leccion-enlace" href={`/leccion/${anterior.id}`} rel="prev">
                <span className="etiqueta">← Lección anterior</span>
                <span className="nav-leccion-titulo">{anterior.titulo}</span>
              </Link>
            ) : (
              <span />
            )}
            <Link className="boton" href="/temario">
              Ver el temario
            </Link>
            {siguiente ? (
              <Link
                className="nav-leccion-enlace nav-leccion-siguiente"
                href={`/leccion/${siguiente.id}`}
                rel="next"
              >
                <span className="etiqueta">Lección siguiente →</span>
                <span className="nav-leccion-titulo">{siguiente.titulo}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </div>
    </article>
  );
}
