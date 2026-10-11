import type { Metadata } from 'next';
import { BibliotecaConsejos } from '../../componentes/BibliotecaConsejos';
import { cargarBiblioteca, cargarConsejosGenerales } from '../../consejos';

export const metadata: Metadata = {
  alternates: { canonical: '/consejos' },
  title: 'Consejos para hacerlo perfecto',
  description:
    'Consejos de oficio para Dibujo Técnico: material, uso del compás y la escuadra, precisión y limpieza, y la lista de comprobación final de una lámina.',
};

export default function PaginaConsejos() {
  const biblioteca = cargarBiblioteca();
  const { listaComprobacion } = cargarConsejosGenerales();

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="consejos">
          <h1>Consejos para hacerlo perfecto</h1>
          <p className="lema">
            Los de oficio y los de cada paso de cada lección. Cada uno cabe en dos líneas y se puede
            copiar al cuaderno.
          </p>

          <BibliotecaConsejos consejos={biblioteca} />

          <section className="lista-lamina" aria-labelledby="lista-lamina">
            <h2 id="lista-lamina">Lista de comprobación de una lámina</h2>
            <p>Antes de entregar, repasa:</p>
            <ul>
              {listaComprobacion.map((punto) => (
                <li key={punto}>{punto}</li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </div>
  );
}
