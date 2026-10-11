import Link from 'next/link';
import { cargarLecciones } from '../contenido';

export default function Portada() {
  const lecciones = cargarLecciones();

  return (
    <section className="portada">
      <h1>Traze</h1>
      <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>
      <ul className="indice">
        {lecciones.map(({ leccion }) => (
          <li key={leccion.id}>
            <Link href={`/leccion/${leccion.id}`}>{leccion.titulo}</Link>
            <span>Bloque {leccion.bloque}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}