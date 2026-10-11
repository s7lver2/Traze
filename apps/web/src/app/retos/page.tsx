import type { Metadata } from 'next';
import { nombreDeBloque } from '@traze/lecciones';
import { IndiceRetos, type BloqueDeRetos } from '../../componentes/IndiceRetos';
import { cargarLecciones } from '../../contenido';
import { agruparPorBloque } from '../../portada';

export const metadata: Metadata = {
  alternates: { canonical: '/retos' },
  title: 'Retos y generador de problemas',
  description:
    'Practica Dibujo Técnico construyendo cada trazado tú mismo, paso a paso, y genera problemas aleatorios de cada tipo.',
};

export default function PaginaRetos() {
  const bloques: BloqueDeRetos[] = agruparPorBloque(cargarLecciones()).map((grupo) => ({
    bloque: grupo.bloque,
    nombre: nombreDeBloque(grupo.bloque),
    lecciones: grupo.items.map(({ leccion }) => ({ id: leccion.id, titulo: leccion.titulo })),
  }));

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="temario">
          <h1>Retos</h1>
          <p className="lema">
            Aquí la lámina la haces tú. La app te dice qué hacer, o no, según el nivel, y comprueba cada
            clic.
          </p>
          <IndiceRetos bloques={bloques} />
        </section>
      </div>
    </div>
  );
}
