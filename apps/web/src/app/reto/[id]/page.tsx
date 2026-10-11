import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaginaReto } from '../../../componentes/PaginaReto';
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
  return {
    title: `Reto: ${cargada.leccion.titulo}`,
    description: `Construye tú el trazado «${cargada.leccion.titulo}» paso a paso, con la regla y el compás, y comprueba cada clic.`,
    alternates: { canonical: `/reto/${id}` },
  };
}

export default async function PaginaDelReto({ params }: Propiedades) {
  const { id } = await params;
  const cargada = cargarLeccion(id);
  if (!cargada) notFound();
  return (
    <article className="leccion">
      <PaginaReto leccion={cargada.leccion} resuelta={cargada.resuelta} />
    </article>
  );
}
