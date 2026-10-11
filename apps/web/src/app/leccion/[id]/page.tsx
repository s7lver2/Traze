import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';

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
        </div>
      </div>
    </article>
  );
}
