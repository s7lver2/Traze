'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ETIQUETA_TIPO,
  buscarConsejos,
  temasDisponibles,
  type ConsejoBiblioteca,
} from '@traze/lecciones/busqueda';

export function BibliotecaConsejos({ consejos }: { consejos: ConsejoBiblioteca[] }) {
  const [consulta, setConsulta] = useState('');
  const [tema, setTema] = useState('');
  const temas = useMemo(() => temasDisponibles(consejos), [consejos]);
  const visibles = useMemo(
    () => buscarConsejos(consejos, { consulta, tema }),
    [consejos, consulta, tema],
  );

  return (
    <>
      <div className="consejos-filtros">
        <label className="campo">
          Buscar
          <input
            type="search"
            className="campo-texto"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder="compás, tangente, grosor…"
          />
        </label>
        <label className="campo">
          Tema
          <select
            className="selector"
            value={tema}
            onChange={(evento) => setTema(evento.target.value)}
          >
            <option value="">Todos</option>
            {temas.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="mapa-resumen">
        {visibles.length === 1 ? '1 consejo' : `${visibles.length} consejos`}
      </p>

      {visibles.length === 0 ? (
        <p>No hay consejos con esa búsqueda. Prueba con otra palabra o quita el filtro de tema.</p>
      ) : (
        <ul className="consejos-lista">
          {visibles.map((consejo) => (
            <li
              key={consejo.id}
              className={consejo.leccion ? 'postit consejo consejo-leccion' : 'postit consejo'}
            >
              <p className="etiqueta">{consejo.tipo ? ETIQUETA_TIPO[consejo.tipo] : consejo.tema}</p>
              <p>{consejo.texto}</p>
              {consejo.leccion && (
                <p className="consejo-origen">
                  <Link href={`/leccion/${consejo.leccion.id}`}>
                    {consejo.leccion.titulo}, paso {consejo.leccion.paso}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
