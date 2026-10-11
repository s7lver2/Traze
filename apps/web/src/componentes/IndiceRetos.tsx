'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { estadoDe, progresoVacio, type Progreso } from '../progreso';
import { cargarProgresoNavegador } from '../progreso-navegador';

export interface BloqueDeRetos {
  bloque: number;
  nombre: string;
  lecciones: { id: string; titulo: string }[];
}

const ETIQUETA = { vista: 'Vista', practicada: 'Practicada', dominada: 'Dominada' } as const;

/** Elige al azar una lección entre las que cumplen el filtro: «» cualquiera, «bloque:N» o el id de una lección. */
export function elegirLeccion(bloques: readonly BloqueDeRetos[], filtro: string, azar: () => number): string | null {
  const candidatas =
    filtro === ''
      ? bloques.flatMap((bloque) => bloque.lecciones)
      : filtro.startsWith('bloque:')
        ? (bloques.find((bloque) => bloque.bloque === Number(filtro.slice(7)))?.lecciones ?? [])
        : bloques.flatMap((bloque) => bloque.lecciones).filter((leccion) => leccion.id === filtro);
  if (candidatas.length === 0) return null;
  return candidatas[Math.floor(azar() * candidatas.length)].id;
}

export function IndiceRetos({ bloques }: { bloques: BloqueDeRetos[] }) {
  const router = useRouter();
  const [progreso, setProgreso] = useState<Progreso>(progresoVacio);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    setProgreso(cargarProgresoNavegador());
  }, []);

  function generar() {
    const id = elegirLeccion(bloques, filtro, Math.random);
    if (!id) return;
    router.push(`/reto/${id}?semilla=${Math.floor(Math.random() * 1_000_000)}`);
  }

  return (
    <>
      <section className="generador postit postit-datos" aria-labelledby="generador-titulo">
        <h2 id="generador-titulo">Generador de problemas</h2>
        <p>
          Elige qué tipo de problema quieres. Te saldrá un ejercicio distinto cada vez, siempre con solución, y
          podrás resolverlo paso a paso o pedir la construcción.
        </p>
        <div className="consejos-filtros">
          <label className="campo">
            Tipo de problema
            <select className="selector" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
              <option value="">Cualquiera</option>
              {bloques.map((bloque) => (
                <optgroup key={bloque.bloque} label={`${bloque.bloque}. ${bloque.nombre}`}>
                  <option value={`bloque:${bloque.bloque}`}>Cualquiera del bloque {bloque.bloque}</option>
                  {bloque.lecciones.map((leccion) => (
                    <option key={leccion.id} value={leccion.id}>
                      {leccion.titulo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button type="button" className="boton boton-principal" onClick={generar}>
            Generar problema
          </button>
        </div>
      </section>

      {bloques.map((bloque) => (
        <section key={bloque.bloque} className="bloque" aria-labelledby={`retos-bloque-${bloque.bloque}`}>
          <h2 id={`retos-bloque-${bloque.bloque}`}>
            {bloque.bloque}. {bloque.nombre}
          </h2>
          <ol className="mapa-lista">
            {bloque.lecciones.map((leccion) => {
              const estado = estadoDe(progreso, leccion.id);
              return (
                <li key={leccion.id} className="mapa-fila">
                  <Link className="mapa-enlace" href={`/reto/${leccion.id}`}>
                    {leccion.titulo}
                  </Link>
                  {(estado === 'practicada' || estado === 'dominada') && (
                    <span className="sello">{ETIQUETA[estado]}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </>
  );
}
