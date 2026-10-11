import type { Metadata } from 'next';
import { agruparPorBloque as agruparTemarioPorBloque } from '@traze/lecciones';
import { MapaTemario } from '../../componentes/MapaTemario';
import { cargarLecciones } from '../../contenido';
import { cargarTemario } from '../../temario';

export const metadata: Metadata = {
  title: 'Temario',
  description:
    'Todo el temario de Dibujo Técnico de 1º de Bachillerato en una ruta ordenada, por bloques, con tu cuaderno de lecciones vistas.',
};

export default function PaginaTemario() {
  const publicadas = new Set(cargarLecciones().map(({ leccion }) => leccion.id));
  const bloques = agruparTemarioPorBloque(cargarTemario(), publicadas);

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="temario">
          <h1>Temario de 1º de Bachillerato</h1>
          <p className="lema">
            Sigue la ruta de arriba abajo: cada lección se apoya en las anteriores. Tu progreso se
            guarda solo en este navegador.
          </p>
          <MapaTemario bloques={bloques} />
        </section>
      </div>
    </div>
  );
}
