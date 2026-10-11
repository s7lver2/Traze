'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { nombreDeBloque } from '@traze/lecciones';
import { ConstruccionImposible, interpretarLeccion } from '@traze/lecciones/interpretar';
import { crearEstado, reductor, VELOCIDADES } from '../reproductor/estado';
import { decimal } from '../reproductor/formato';
import { derivarBanda } from '../reproductor/instrumentos';
import { duracionPaso } from '../reproductor/tiempos';
import { BandaInstrumentos } from './BandaInstrumentos';
import { Lienzo } from './Lienzo';

const MAX_SALTO_MS = 100;

interface Propiedades {
  leccion: Leccion;
  resuelta: LeccionResuelta;
}

export function Reproductor({ leccion, resuelta }: Propiedades) {
  const total = resuelta.pasos.length;
  const [estado, despachar] = useReducer(reductor, total, (pasos) => crearEstado(pasos));
  const [vista, setVista] = useState<LeccionResuelta>(resuelta);
  const [factores, setFactores] = useState<Record<string, number>>(() => {
    const iniciales: Record<string, number> = {};
    for (const [id, radio] of Object.entries(leccion.radios)) {
      if ('factor' in radio) iniciales[id] = radio.factor;
    }
    return iniciales;
  });
  const deslizadores = Object.entries(leccion.radios).flatMap(([id, radio]) =>
    'deslizador' in radio && radio.deslizador
      ? [{ id, entre: radio.entre, min: radio.deslizador.min, max: radio.deslizador.max }]
      : [],
  );
  const [aviso, setAviso] = useState<string | null>(null);

  const dibujos = useMemo(() => vista.pasos.map((paso) => paso.dibujo), [vista]);
  const pasoActual = vista.pasos[estado.paso];
  const duracion = duracionPaso(dibujos[estado.paso]);
  const terminado = estado.progreso >= 1 && !estado.reproduciendo;
  const banda = useMemo(
    () => derivarBanda(dibujos[estado.paso], vista.radios, leccion.radios, factores),
    [dibujos, estado.paso, vista.radios, leccion.radios, factores],
  );

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (consulta.matches) despachar({ tipo: 'animar', valor: false });
  }, []);

  useEffect(() => {
    if (!estado.reproduciendo) return;

    let anterior = performance.now();
    let cuadro = 0;
    const bucle = (ahora: number) => {
      despachar({
        tipo: 'avanzar',
        ms: Math.min(MAX_SALTO_MS, ahora - anterior),
        duracionPasoMs: duracion,
      });
      anterior = ahora;
      cuadro = requestAnimationFrame(bucle);
    };
    cuadro = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(cuadro);
  }, [estado.reproduciendo, estado.paso, duracion]);

  function cambiarFactor(id: string, valor: number) {
    const nuevos = { ...factores, [id]: valor };
    setFactores(nuevos);
    try {
      setVista(interpretarLeccion(leccion, nuevos));
      setAviso(null);
    } catch (error) {
      if (!(error instanceof ConstruccionImposible)) throw error;
      setAviso(error.message);
    }
  }

  return (
    <section className="escenario" aria-label="Demostración animada">
      <header className="escenario-titulo">
        <p className="etiqueta">
          Bloque {leccion.bloque} · {nombreDeBloque(leccion.bloque)}
        </p>
        <h1>{leccion.titulo}</h1>
      </header>

      <div className="escenario-dibujo">
        <Lienzo
          ancho={vista.lienzo.ancho}
          alto={vista.lienzo.alto}
          dibujos={dibujos}
          paso={estado.paso}
          progreso={estado.progreso}
          ocultarConstruccion={estado.ocultarConstruccion}
          descripcion={`Paso ${estado.paso + 1} de ${total}: ${pasoActual.titulo}`}
        />

        <button
          type="button"
          className={`flecha flecha-anterior${terminado ? ' flecha-visible' : ''}`}
          disabled={estado.paso === 0}
          aria-label="Paso anterior"
          onClick={() => despachar({ tipo: 'anterior' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 5.5 8 12l6.5 6.5" />
          </svg>
        </button>
        <button
          type="button"
          className={`flecha flecha-siguiente${terminado ? ' flecha-visible' : ''}`}
          disabled={estado.paso === total - 1}
          aria-label={
            estado.paso < total - 1
              ? `Paso siguiente: ${vista.pasos[estado.paso + 1].titulo}`
              : 'Paso siguiente'
          }
          onClick={() => despachar({ tipo: 'siguiente' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
          </svg>
        </button>
      </div>

      <div className="notas notas-izquierda">
        <aside className="postit postit-paso">
          <p className="etiqueta" aria-live="polite">
            Paso {estado.paso + 1} de {total}
          </p>
          <h2>{pasoActual.titulo}</h2>
          <p className="texto-paso">{pasoActual.texto}</p>
          {banda && <BandaInstrumentos banda={banda} />}
        </aside>

        {deslizadores.length > 0 && (
          <aside className="postit postit-datos datos-modificables">
            <h3>Prueba otros datos</h3>
            {deslizadores.map(({ id, entre, min, max }) => (
              <label key={id} className="deslizador">
                <span>
                  Abertura del compás ({id}): {decimal(factores[id], 2)} × {entre.join('')}
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={0.01}
                  value={factores[id]}
                  onChange={(evento) => cambiarFactor(id, Number(evento.target.value))}
                />
              </label>
            ))}
            {aviso && (
              <p className="aviso" role="alert">
                {aviso}. Se muestra el último trazado válido.
              </p>
            )}
          </aside>
        )}
      </div>

      <div className="notas notas-derecha">
        <aside className="postit postit-porque">
          <p className="etiqueta">Por qué</p>
          <p className="porque">{pasoActual.porque}</p>
        </aside>

        {pasoActual.consejo && (
          <aside className="postit postit-consejo">
            <p className="etiqueta">Consejo del profe</p>
            <p>{pasoActual.consejo}</p>
          </aside>
        )}

        <aside className="postit postit-ajustes" aria-label="Ajustes de la demostración">
          <div className="ajustes-botones">
            <button
              type="button"
              className="boton"
              onClick={() => despachar({ tipo: 'reiniciar' })}
            >
              Reiniciar
            </button>
            <button
              type="button"
              className="boton"
              onClick={() => despachar({ tipo: 'verSolucion' })}
            >
              Ver solución completa
            </button>
          </div>

          <label className="campo">
            Velocidad
            <select
              className="selector"
              value={estado.velocidad}
              onChange={(evento) => {
                const valor = VELOCIDADES.find((v) => v === Number(evento.target.value));
                if (valor) despachar({ tipo: 'velocidad', valor });
              }}
            >
              {VELOCIDADES.map((v) => (
                <option key={v} value={v}>
                  {decimal(v, 1).replace(',0', '')}×
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <input
              type="checkbox"
              checked={estado.ocultarConstruccion}
              onChange={() => despachar({ tipo: 'alternarConstruccion' })}
            />
            Ocultar construcción
          </label>
        </aside>
      </div>

      <aside className="cajetin" aria-label="Cajetín de la lámina">
        <dl>
          <div>
            <dt>Lámina</dt>
            <dd>{leccion.titulo}</dd>
          </div>
          <div>
            <dt>Escala</dt>
            <dd>1:1</dd>
          </div>
          <div>
            <dt>Formato</dt>
            <dd>
              {vista.lienzo.ancho} × {vista.lienzo.alto} mm
            </dd>
          </div>
        </dl>
      </aside>

      <div className="barra" role="group" aria-label="Controles de la lección">
        <button
          type="button"
          className="boton boton-principal"
          disabled={!estado.animar}
          onClick={() => despachar({ tipo: 'alternarReproduccion' })}
        >
          {estado.reproduciendo ? 'Pausar' : 'Reproducir todo'}
        </button>
      </div>
    </section>
  );
}
