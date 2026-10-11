'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BloqueDeMapa } from '@traze/lecciones';
import { estadoDe, progresoVacio, type Progreso } from '../progreso';
import { cargarProgresoNavegador } from '../progreso-navegador';

const ETIQUETA = { vista: 'Vista', practicada: 'Practicada', dominada: 'Dominada' } as const;

export function MapaTemario({ bloques }: { bloques: BloqueDeMapa[] }) {
  const [progreso, setProgreso] = useState<Progreso>(progresoVacio);

  useEffect(() => {
    setProgreso(cargarProgresoNavegador());
  }, []);

  const publicadas = bloques.flatMap((bloque) => bloque.lecciones).filter((leccion) => leccion.publicada);
  const vistas = publicadas.filter((leccion) => estadoDe(progreso, leccion.id) !== null).length;

  return (
    <>
      <p className="mapa-resumen" aria-live="polite">
        Tu cuaderno: {vistas} de {publicadas.length} lecciones vistas.
      </p>
      {bloques.map((bloque) => (
        <section key={bloque.bloque} className="bloque" aria-labelledby={`bloque-${bloque.bloque}`}>
          <h2 id={`bloque-${bloque.bloque}`}>
            Bloque {bloque.bloque} · {bloque.nombre}
          </h2>
          <ol className="mapa-lista">
            {bloque.lecciones.map((leccion) => {
              const estado = estadoDe(progreso, leccion.id);
              return (
                <li
                  key={leccion.id}
                  className={leccion.publicada ? 'mapa-fila' : 'mapa-fila mapa-proxima'}
                >
                  {leccion.publicada ? (
                    <Link className="mapa-enlace" href={`/leccion/${leccion.id}`}>
                      {leccion.titulo}
                    </Link>
                  ) : (
                    <span className="mapa-enlace">{leccion.titulo}</span>
                  )}
                  {estado !== null && <span className="sello">{ETIQUETA[estado]}</span>}
                  {!leccion.publicada && <span className="mapa-nota">Próximamente</span>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </>
  );
}
